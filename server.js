// server.js rsnowden
const express = require("express");
const cors = require("cors");

const dbConfig = require("./app/config/db.config");
	console.log("dbConfig: ");
	console.log(dbConfig.HOST);
	console.log(dbConfig.PORT);
	console.log(dbConfig.DB);

const app = express();

// debugging to disk if needed
const fs = require('fs');

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // trust first proxy
  sessionConfig.cookie.secure = true; // serve secure cookies
}

// debug logger to screen
var log4js = require("log4js");
var logger = log4js.getLogger();
logger.level = "debug";

const dotenv = require('dotenv');
dotenv.config();
process.env.TOKEN_SECRET;

logger.debug('server token_secret: ' + process.env.TOKEN_SECRET);

var jwt = require('jsonwebtoken');
var corsOptions = {
  origin: "http://localhost:3000",
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");
const Role = db.role;
const Session = db.session;

// set strictQuery is false by default, you get a warning. Deprecation thing, deal with it soon
db.mongoose.set("strictQuery", true);
db.mongoose
  .connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
	})
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    initial();
	logger.debug('past mongoose initial');
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit(1);
  });

// simple get route for testing server instance
app.get("/", (req, res) => {
	logger.debug("simple get: " + req.body.username);
  res.json({ message: "get: Base server is here." });
});

// simple post route for testing server instance
app.post("/", (req, res) => {
		  fs.writeFile('server_reqlog.txt', JSON.stringify(req), function (err) {
		if (err) throw err;
		logger.debug('simple post reqlog file is created successfully.');
		});

	logger.debug("simple post: " + req.body.username);
  res.json({ message: "post: Base server is here." });
});

// load routes
require("./app/routes/routes")(app);

logger.debug("routes loaded");

// set port, listen for requests
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

// runs from db.mongoose def, above
function initial() {

  // Drop of sessions collection, then create a new one. If drop fails due to "ns not found", just create a new one.
  db.mongoose.connection.db.collection("sessions").drop()
    .then(() => {
      console.log("Collection 'sessions' dropped");
    })
    .catch((error) => {
      if (error.codeName === "NamespaceNotFound") {
        console.log("Collection 'sessions' does not exist");
      } else {
        console.error("Error dropping collection:", error);
        process.exit(1);
      }
    })
    .then(() => {
      const sessionSchema = new db.mongoose.Schema({
        sessionid: { type: String, required: true },
        authtoken: String,
        username: { type: String, index: { unique: true } },
        created: Date,
        touchtime: Date,
      });
		const sessionOptions = {
		  validator: {
			$jsonSchema: {
			  bsonType: "object",
			  required: ["sessionid"],
			  properties: {
				sessionid: {
				  bsonType: "string",
				  description: "must be a string and is required"
				},
				authtoken: {
				  bsonType: "string",
				  description: "must be a string"
				},
				username: {
				  bsonType: "string",
				  description: "must be a string and is required"
				},
				created: {
				  bsonType: "date",
				  description: "must be a date"
				},
				touchtime: {
				  bsonType: "date",
				  description: "must be a date"
				}
			  }
			}
		  },
		};
      db.mongoose.connection.db.createCollection("sessions", sessionOptions)
        .then(() => {
          console.log("Created new sessions collection");
        })
        .catch((error) => {
          console.error("Error creating sessions collection:", error);
          process.exit(1);
        });
    });
}
