package controllers;

import models.ModelException;
import models.Record;

import org.bson.types.ObjectId;

import play.Play;
import play.mvc.BodyParser;
import play.mvc.Controller;
import play.mvc.Result;
import utils.DateTimeUtils;

import com.fasterxml.jackson.databind.JsonNode;

// Not secured, accessible from app server
public class Apps extends Controller {

	public static Result checkPreflight(String appIdString, String userIdString) {
		// allow cross origin request from app server
		String externalServer = Play.application().configuration().getString("external.server");
		response().setHeader("Access-Control-Allow-Origin", "http://" + externalServer);
		response().setHeader("Access-Control-Allow-Methods", "POST");
		response().setHeader("Access-Control-Allow-Headers", "Content-Type");
		return ok();
	}

	@BodyParser.Of(BodyParser.Json.class)
	public static Result createRecord(String appIdString, String userIdString) {
		// check whether the request is complete
		JsonNode json = request().body().asJson();
		if (json == null) {
			return badRequest("No json found.");
		} else if (!json.has("data")) {
			return badRequest("No data found.");
		} else if (!json.has("name")) {
			return badRequest("No name found.");
		} else if (!json.has("description")) {
			return badRequest("No description found.");
		}

		// save new record with additional metadata
		String data = json.get("data").toString();
		String name = json.get("name").asText();
		String description = json.get("description").asText();
		Record record = new Record();
		record.app = new ObjectId(appIdString);
		record.owner = new ObjectId(userIdString);
		record.creator = new ObjectId(userIdString);
		record.created = DateTimeUtils.getNow();
		record.data = data;
		record.name = name;
		record.description = description;
		try {
			Record.add(record);
		} catch (ModelException e) {
			return badRequest(e.getMessage());
		}

		// allow cross origin request from app server
		String externalServer = Play.application().configuration().getString("external.server");
		response().setHeader("Access-Control-Allow-Origin", "http://" + externalServer);
		return ok();
	}

}
