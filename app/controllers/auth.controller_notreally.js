// auth.controller.js
const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;
const Session = db.session;
const Profile = db.profile;

const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

var logger = require('log4js').getLogger("auth.controller")
logger.debug("in auth.controller");

var jwt = require('jsonwebtoken');

var sha1 = require('node-sha1');

function genAccessToken(ID) {
	logger.debug(" gen access token ID :" + ID);
    let tok= jwt.sign( {session: ID},
		process.env.TOKEN_SECRET, { expiresIn: 600 });
	var decoded = jwt.decode(tok);
	return tok;
}

function genSessionID(username) {
	let ID = crypto.createHash('sha1', username )
		  .update('How are you?')
          .digest('hex');
	return ID;
};

exports.findToken = (req, res, next) => {
	logger.debug("controller findToken");
	req.token = "sometoken";
	logger.debug("ctlr got token, return now");
	next();
};

exports.validateSession = (req, res, next) => {
	logger.debug("*** exports.verifyToken from auth.controller begin");
	let thisHdr = JSON.stringify(req.headers);
	let regexp = '/"accessToken=(([A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*))/'
	var accessToken = [];
	accessToken = thisHdr.match(/"accessToken=(([A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*))/);
	if (!accessToken ) {
			logger.debug('accessToken err');
			// set middleware to err handler and bail out.
			next("No Session Token");
			return;
	}
	let aToken = jwt.decode(accessToken[1]);
	// unpack the accessToken
	var reqToken = jwt.decode(accessToken[1]);
	let thisID= reqToken.session;
	// verify the token, wrt expiration, etc
	logger.debug("iat time: " + Date(reqToken.iat));
	logger.debug("exp time: " + Date(reqToken.exp));

	jwt.verify(accessToken, process.env.TOKEN_SECRET)
		.then((decoded) => {
			let newToken = genAccessToken(thisID);
			return Session.findOneAndUpdate( {sessionID: thisID},
				{ username:req.body.username,
				authtoken: newToken,
				touchtime: Math.floor(Date.now())})
		})
		.then((session) => {
			req.accessToken = session.authtoken;
			// having found and updated, we are done here
			next();
		})
		.catch((error) => {
			// Handle any errors
			next(error);
		});
	logger.debug("########## end auth.controller.validateSession");
};

exports.saveProfile = (req, res) => {
  logger.debug("controller saveProfile: " + JSON.stringify(req.body));
  const update = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    touchtime: Math.floor(Date.now()),
  };
  logger.debug('update stuff: ' + update);

  // update the update obj fields, new:true forces update. Do it now.
  Profile.findOneAndUpdate({ username: req.body.userName }, update, { new: true })
    .then((updatedDocument) => {
      if (!updatedDocument) {
        const error = new Error('Document not found');
        error.status = 404;
        logger.debug("update profile, doc not found");
        throw error;
      }
      // update cool, return updatedDocument
      logger.debug("saveProfile cool, returning now");
      res.send(updatedDocument);
    })
    .catch((error) => {
      // Handle any errors
      logger.debug('update error: ' + error);
      res.status(error.status || 500).send({ message: error.message });
    });
};
