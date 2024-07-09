// prod.controller.js
const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;
const Session = db.session;
const Profile = db.profile;
const Reset = db.reset;

const path = require('path');
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

// getUserBook
exports.getUserBook = async (req, res) => {
	logger.debug("basePath: " + global.basePath);
  const userName = req.body.userName; // Assuming username is a URL parameter
  const productSKU = req.body.productSKU 
  const filePath = `${global.basePath}/users/${userName}/mybooks/${productSKU}/${userName}${productSKU}.json`;

  try {
    // Check if the file exists
    await fs.access(filePath);

    // Read the file
    const data = await fs.readFile(filePath, 'utf8');

    // Parse JSON data
    const userBook = JSON.parse(data);
    logger.debug("get user book success", userBook);

    // Send the user book  as a response
    return userBook; // Return the data instead of directly responding
  } catch (error) {
    logger.debug("get user book call failed", error);
    throw error; // Throw the error to be caught in routes.js
  }
};

// getUserBookImages return array of all qualfiied images
exports.getUserBookImages = async (req, res) => {
    logger.debug("basePath: " + global.basePath);
    const userName = req.body.userName;
    const productSKU = req.body.productSKU;
	const imagesDirectory = `${global.basePath}/users/${userName}/mybooks/${productSKU}/`;
//    const imagesDirectory = path.join(global.basePath, 'users', ${userName}, 'mybooks', ${productSKU}, 'images');
	logger.debug("user image dir: " + imagesDirectory);
logger.debug("here");
    try {
        const files = await fs.readdir(imagesDirectory);
        const imageFiles = files.filter(file => file.endsWith('.png'));

        const imagesData = await Promise.all(imageFiles.map(async (file) => {
            const filePath = path.join(imagesDirectory, file);
            const fileData = await fs.readFile(filePath);
            return Buffer.from(fileData).toString('base64');
        }));

        const imagesBase64 = imagesData.map((data, index) => ({
            filename: imageFiles[index],
            data: `data:image/png;base64,${data}`
        }));

        logger.debug("get book images success");
        res.json(imagesBase64); // Send the array of base64 encoded images
    } catch (error) {
        logger.debug("get book images call failed", error);
        res.status(500).send({ message: "Failed to get book images." });
    }
};

// return array of all qualified audio files.
exports.getUserBookAudio = async (req, res) => {
    const { userName, productSKU } = req.body;
    const audioDirectory = `${global.basePath}/users/${userName}/mybooks/${productSKU}/`;

    try {
        const files = await fs.readdir(audioDirectory);
        const audioFiles = files.filter(file => file.endsWith('.wav'));
		// Sort files in ascending order by name
		audioFiles.sort();
        const audioData = await Promise.all(audioFiles.map(async (file) => {
            const filePath = path.join(audioDirectory, file);
            const fileData = await fs.readFile(filePath);
            return Buffer.from(fileData).toString('base64');
        }));

        const audioBase64 = audioData.map((data, index) => ({
            filename: audioFiles[index],
            data: `data:audio/wav;base64,${data}`
        }));

        res.json(audioBase64);
    } catch (error) {
        res.status(500).send({ message: "Failed to get book audio." });
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

