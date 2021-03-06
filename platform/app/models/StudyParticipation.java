package models;

import java.util.List;
import java.util.Set;

import models.enums.Gender;
import models.enums.ParticipantSearchStatus;
import models.enums.ParticipationStatus;

import org.bson.types.ObjectId;

import utils.collections.CMaps;
import utils.collections.Sets;

public class StudyParticipation extends Model {
	
	private static final String collection = "participation";

	public ObjectId member; //member that is related to a study
	public String memberName; // replication of member name
	public ObjectId study; //study that the member is related to
	public String studyName; // replication of study name
	public ParticipationStatus status; //how is the member related to the study?
	public String group; // If study has multiple separate groups of participants
	public ObjectId recruiter; // if member has been recruited through someone (by entering a participation code)
	public String recruiterName; // replication of recruiter name
	public Set<ObjectId> providers; // (Optional) List of healthcare providers monitoring the member for this study.
	public List<History> history; // History of participation process
	public ObjectId aps;
	//public Set<ObjectId> shared; // Records of member shared for this study
	
	public int yearOfBirth;
	public String country;
	public Gender gender;
	
	public static void add(StudyParticipation studyparticipation) throws ModelException {
		Model.insert(collection, studyparticipation);
	}
	
	public static Set<StudyParticipation> getAllByMember(ObjectId member, Set<String> fields) throws ModelException {
		return Model.getAll(StudyParticipation.class, collection, CMaps.map("member", member), fields);
	}
	
	public static Set<StudyParticipation> getParticipantsByStudy(ObjectId study, Set<String> fields) throws ModelException {
		return Model.getAll(StudyParticipation.class, collection, CMaps.map("study", study).map("status", Sets.createEnum(ParticipationStatus.ACCEPTED, ParticipationStatus.REQUEST, ParticipationStatus.RESEARCH_REJECTED)), fields);
	}
	
	public static StudyParticipation getById(ObjectId id, Set<String> fields) throws ModelException {
		return Model.get(StudyParticipation.class, collection, CMaps.map("_id", id), fields);
	}
	
	public static StudyParticipation getByStudyAndMember(ObjectId study, ObjectId member, Set<String> fields) throws ModelException {
		return Model.get(StudyParticipation.class, collection, CMaps.map("study", study).map("member", member), fields);
	}
	
	public static StudyParticipation getByStudyAndId(ObjectId study, ObjectId id, Set<String> fields) throws ModelException {
		return Model.get(StudyParticipation.class, collection, CMaps.map("_id", id).map("study", study), fields);
	}
	
	public void setStatus(ParticipationStatus newstatus) throws ModelException {
		Model.set(StudyParticipation.class, collection, this._id, "status", newstatus);
	}
    
    public void addHistory(History newhistory) throws ModelException {
    	this.history.add(newhistory);
    	Model.set(StudyParticipation.class, collection, this._id, "history", this.history);
    }
}
