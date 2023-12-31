// prod.controller.js
const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;
const Session = db.session;
const Profile = db.profile;
const Reset = db.reset;

const fs = require('fs').promises; // Import the promises version of the fs module

const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

var logger = require('log4js').getLogger("auth.controller")
logger.debug("in auth.controller");

logger.debug("db thing: " + db);


//var sha1 = require('node-sha1');
const bcrypt = require('bcrypt');

// getLibrary
exports.getLibrary = async (req, res) => {
	logger.debug("basePath: " + global.basePath);
  const userName = req.body.userName; // Assuming username is a URL parameter
  const filePath = `${global.basePath}/users/${userName}/userlibrary.json`;

  try {
    // Check if the file exists
    await fs.access(filePath);

    // Read the file
    const data = await fs.readFile(filePath, 'utf8');

    // Parse JSON data
    const libraryDocument = JSON.parse(data);
    logger.debug("get library success", libraryDocument);

    // Send the library document as a response
    return libraryDocument; // Return the data instead of directly responding
  } catch (error) {
    logger.debug("get library call failed", error);
    throw error; // Throw the error to be caught in routes.js
  }
};


// getBook
exports.getBook = (req, res) => {
  logger.debug("getBook req params: " + req.body.userName);
  return Profile.findOne({ username: req.body.userName })
    .then((profileDocument) => {
      if (!profileDocument) {
        const error = new Error('Document not found');
        error.status = 404;
        logger.debug("get profile fail");
        throw error;
      }
      logger.debug("get profile success" + profileDocument);
      return profileDocument;
    })
    .catch((error) => {
      logger.debug("get profile call failed");
      throw error;
    });
};
