const mongoose = require('mongoose');

const dbConfig = require("./app/config/db.config");
	console.log("dbConfig: ");
	console.log(dbConfig.HOST);
	console.log(dbConfig.PORT);
	console.log(dbConfig.DB);

const db = require("./app/models");
const Session = db.session;

db.mongoose
  .connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
//    initial();
//	logger.debug('past mongoose initial');
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });


// Define the schema for the collection
const sessionSchema = new mongoose.Schema({
    sessionid: { type: String, required: true},
	authtoken: String,
	username: {type: String, required: true, unique: true},
	created: Date,
	touchtime: Date,
});

// Create the model for the collection
//const Session = mongoose.model('Session', sessionSchema);

//// Create a unique index on the username field
//Session.collection.createIndex({ username: 1 }, { unique: true }, (err) => {
// if (err) {
//    console.error('Error creating index:', err);
//  } else {
//    console.log('Index created successfully.');
//  }
//});
