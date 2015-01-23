package utils.db;

import java.net.UnknownHostException;
import java.util.Map;
import java.util.Set;

import models.Model;

import org.bson.types.ObjectId;

import play.Play;
import utils.collections.CollectionConversion;

import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.MongoClient;
import com.mongodb.MongoException;
import com.mongodb.WriteConcern;

public class MongoDatabase extends Database {
	
	private String host;
	private int port;
	private String database; // database currently in use
	
	private MongoClient mongoClient; // mongo client is already a connection pool
	private DatabaseConversion conversion = new DatabaseConversion();
	
	public MongoDatabase(String host, int port, String database) {
		this.host = host;
		this.port = port;
		this.database = database;
	}

	/**
	 * Open mongo client.
	 */
	protected void openConnection() throws DatabaseException {
		//String host = Play.application().configuration().getString("mongo.host");
		//int port = Play.application().configuration().getInt("mongo.port");
		//database = Play.application().configuration().getString("mongo.database");
		try {
			mongoClient = new MongoClient(host, port);
			mongoClient.setWriteConcern(WriteConcern.ACKNOWLEDGED);
		} catch (UnknownHostException e) {	
			e.printStackTrace();
			throw new DatabaseException(e);
		}
	}
	
	/**
	 * Closes all connections.
	 */
	protected void close() {
		mongoClient.close();
	}

	/**
	 * Sets up the collections and creates all indices.
	 */
	protected void initialize() {
		// TODO
	}

	/**
	 * Drops the database.
	 */
	protected void destroy() {
		getDB().dropDatabase();
	}

	/**
	 * Get a connection to the database in use.
	 */
	DB getDB() {
		return mongoClient.getDB(database);
	}

	/**
	 * Gets the specified collection.
	 */
	public DBCollection getCollection(String collection) {
		return getDB().getCollection(collection);
	}

	/* Database operations */
	/**
	 * Insert a document into the given collection.
	 */
	public <T extends Model> void insert(String collection, T modelObject) throws DatabaseException {
		DBObject dbObject;
		try {
			dbObject = conversion.toDBObject(modelObject);
			getCollection(collection).insert(dbObject);			
		} catch (DatabaseConversionException e) {
			throw new DatabaseException(e);
		} catch (MongoException e) {
			throw new DatabaseException(e);
		}
	}

	/**
	 * Remove all documents with the given properties from the given collection.
	 */
	public void delete(String collection, Map<String, ? extends Object> properties) throws DatabaseException {
		DBObject query = toDBObject(properties);
		try {
			getCollection(collection).remove(query);
		} catch (MongoException e) {
			throw new DatabaseException(e);
		}
	}

	/**
	 * Check whether a document exists that has the given properties.
	 */
	public boolean exists(String collection, Map<String, ? extends Object> properties) throws DatabaseException {
		DBObject query = toDBObject(properties);
		DBObject projection = new BasicDBObject("_id", 1);
		try {
			return getCollection(collection).findOne(query, projection) != null;
		} catch (MongoException e) {
			throw new DatabaseException(e);
		}
	}

	/**
	 * Return the given fields of the object that has the given properties.
	 */
	public <T extends Model> T get(Class<T> modelClass, String collection, Map<String, ? extends Object> properties,
			Set<String> fields) throws DatabaseException {
		DBObject query = toDBObject(properties);
		DBObject projection = toDBObject(fields);
		try {
			DBObject dbObject = getCollection(collection).findOne(query, projection);
			if (dbObject == null) return null;
			return conversion.toModel(modelClass, dbObject);
		} catch (MongoException e) {
			throw new DatabaseException(e);
		} catch (DatabaseConversionException e) {
			throw new DatabaseException(e);
		}
	}

	/**
	 * Return the given fields of all objects that have the given properties.
	 */
	public <T extends Model> Set<T> getAll(Class<T> modelClass, String collection, Map<String, ? extends Object> properties,
			Set<String> fields) throws DatabaseException {
		DBObject query = toDBObject(properties);
		DBObject projection = toDBObject(fields);
		try {
			DBCursor cursor = getCollection(collection).find(query, projection);
			Set<DBObject> dbObjects = CollectionConversion.toSet(cursor);
			return conversion.toModel(modelClass, dbObjects);
		} catch (MongoException e) {
			throw new DatabaseException(e);
		} catch (DatabaseConversionException e) {
			throw new DatabaseException(e);
		}
	}

	/**
	 * Set the given field of the object with the given id.
	 */
	public void set(String collection, ObjectId modelId, String field, Object value) throws DatabaseException {
		DBObject query = new BasicDBObject("_id", modelId);
		DBObject update = new BasicDBObject("$set", new BasicDBObject(field, value));
		try {
			getCollection(collection).update(query, update);
		} catch (MongoException e) {
			throw new DatabaseException(e);
		}
	}

	/**
	 * Convert the properties map to a database object. If an array is given as the value, use the $in operator.
	 */
	private DBObject toDBObject(Map<String, ? extends Object> properties) {
		DBObject dbObject = new BasicDBObject();
		for (String key : properties.keySet()) {
			Object property = properties.get(key);
			if (property instanceof Set<?>) {
				dbObject.put(key, new BasicDBObject("$in", ((Set<?>) property).toArray()));
			} else {
				dbObject.put(key, property);
			}
		}
		return dbObject;
	}

	/**
	 * Convert the fields set to a database object. Project to all fields given.
	 */
	private DBObject toDBObject(Set<String> fields) {
		DBObject dbObject = new BasicDBObject();
		for (String field : fields) {
			dbObject.put(field, 1);
		}
		return dbObject;
	}
	
}
