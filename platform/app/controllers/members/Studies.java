package controllers.members;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

import org.bson.types.ObjectId;

import play.mvc.Result;
import play.mvc.Security;

import models.History;
import models.Member;
import models.ModelException;
import models.ParticipationCode;
import models.Research;
import models.ResearchUser;
import models.Study;
import models.StudyParticipation;
import models.User;
import models.enums.EventType;
import models.enums.ParticipantSearchStatus;
import models.enums.ParticipationCodeStatus;
import models.enums.ParticipationStatus;
import models.enums.StudyValidationStatus;
import utils.collections.Sets;
import utils.json.JsonValidation;
import utils.json.JsonValidation.JsonValidationException;
import actions.APICall;
import play.libs.Json;
import controllers.APIController;
import controllers.Secured;
import controllers.research.ResearchSecured;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class Studies extends APIController {

	@APICall
	@Security.Authenticated(Secured.class)
	public static Result list() throws JsonValidationException, ModelException {
	   ObjectId user = new ObjectId(request().username());
	   
	   Set<StudyParticipation> participation = StudyParticipation.getAllByMember(user, Sets.create("study","studyName", "status","history"));
	   
	   return ok(Json.toJson(participation));
	}
	
	@APICall
	@Security.Authenticated(Secured.class)
	public static Result enterCode() throws JsonValidationException, ModelException {
        JsonNode json = request().body().asJson();
		
		JsonValidation.validate(json, "code");
		String codestr = JsonValidation.getString(json, "code");
		ObjectId userId = new ObjectId(request().username());
		
		User user = Member.getById(userId, Sets.create("firstname","sirname"));
		String userName = user.sirname+", "+user.firstname;
		
		ParticipationCode code = ParticipationCode.getByCode(codestr);
		if (code == null) return inputerror("code", "notfound", "Unknown Participation Code.");
		
		StudyParticipation existing = StudyParticipation.getByStudyAndMember(code.study, userId, Sets.create("status"));
		if (existing != null) {
			// Redirect to study page
		}
				
		if (code.status != ParticipationCodeStatus.UNUSED && 
			code.status != ParticipationCodeStatus.SHARED && 
			code.status != ParticipationCodeStatus.REUSEABLE) return inputerror("code","alreadyused","Participation code has expired.");
		
		Study study = Study.getByIdFromMember(code.study, Sets.create("name", "participantSearchStatus"));
				
		if (study.participantSearchStatus != ParticipantSearchStatus.SEARCHING) return inputerror("code", "notsearching", "Study is not searching for participants.");
		
		StudyParticipation part = new StudyParticipation();
		part.study = code.study;
		part.studyName = study.name;
		part.member = userId;
		part.memberName = userName;
		part.group = code.group;
		part.recruiter = code.recruiter;		
		part.recruiterName = code.recruiterName;
		part.status = ParticipationStatus.CODE;
		
		part.history = new ArrayList<History>();
		part.shared = new HashSet<ObjectId>();
		
		History codedentererd = new History(EventType.CODE_ENTERED, user, null); 
		part.history.add(codedentererd);
		StudyParticipation.add(part);
		
		if (code.status != ParticipationCodeStatus.REUSEABLE) {
		   code.setStatus(ParticipationCodeStatus.USED);
		}
		
		ObjectNode result = Json.newObject();
		result.put("study", code.study.toString());
		return ok(result);
	}
	
	@APICall
	@Security.Authenticated(Secured.class)
	public static Result get(String id) throws JsonValidationException, ModelException {
	   ObjectId userId = new ObjectId(request().username());	
	   ObjectId studyId = new ObjectId(id);
	   	   
	   Study study = Study.getByIdFromMember(studyId, Sets.create("createdAt","createdBy","description","executionStatus","name","participantSearchStatus","validationStatus","history","infos","owner","participantRules","recordRules","studyKeywords"));
	   StudyParticipation participation = StudyParticipation.getByStudyAndMember(studyId, userId, Sets.create("status", "history"));
	   Research research = Research.getById(study.owner, Sets.create("name", "description"));
	   
	   ObjectNode obj = Json.newObject();
	   obj.put("study", Json.toJson(study));
	   obj.put("participation", Json.toJson(participation));
	   obj.put("research", Json.toJson(research));
	   
	   return ok(obj);
	}
	
	@APICall
	@Security.Authenticated(Secured.class)
	public static Result requestParticipation(String id) throws JsonValidationException, ModelException {
		ObjectId userId = new ObjectId(request().username());		
		ObjectId studyId = new ObjectId(id);
		
		User user = Member.getById(userId, Sets.create("firstname","sirname"));		
		StudyParticipation participation = StudyParticipation.getByStudyAndMember(studyId, userId, Sets.create("status", "history"));		
		Study study = Study.getByIdFromMember(studyId, Sets.create("executionStatus", "participantSearchStatus", "history"));
		
		if (study == null) return badRequest("Study does not exist.");
		if (participation == null) return badRequest("Member is not allowed to participate in study.");		
		if (study.participantSearchStatus != ParticipantSearchStatus.SEARCHING) return badRequest("Study is not searching for participants anymore.");
		if (participation.status != ParticipationStatus.CODE && participation.status != ParticipationStatus.MATCH) return badRequest("Wrong participation status.");
		
		participation.setStatus(ParticipationStatus.REQUEST);
		participation.addHistory(new History(EventType.PARTICIPATION_REQUESTED, user, null));
						
		return ok();
	}
	
	@APICall
	@Security.Authenticated(Secured.class)
	public static Result noParticipation(String id) throws JsonValidationException, ModelException {
		ObjectId userId = new ObjectId(request().username());		
		ObjectId studyId = new ObjectId(id);
		
		User user = Member.getById(userId, Sets.create("firstname","sirname"));		
		StudyParticipation participation = StudyParticipation.getByStudyAndMember(studyId, userId, Sets.create("status", "history"));		
		Study study = Study.getByIdFromMember(studyId, Sets.create("executionStatus", "participantSearchStatus", "history"));
		
		if (study == null) return badRequest("Study does not exist.");
		if (participation == null) return badRequest("Member is not allowed to participate in study.");				
		if (participation.status != ParticipationStatus.CODE && participation.status != ParticipationStatus.MATCH && participation.status != ParticipationStatus.REQUEST) return badRequest("Wrong participation status.");
		
		participation.setStatus(ParticipationStatus.MEMBER_REJECTED);
		participation.addHistory(new History(EventType.NO_PARTICIPATION, user, null));
						
		return ok();
	}
		
}
