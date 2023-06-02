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
	
	jwt.verify(accessToken, process.env.TOKEN_SECRET, function(err, decoded) {
	});
	let newToken = genAccessToken(thisID);
	Session.findOneAndUpdate( {sessionID: thisID},
	    { username:req.body.username, 
		  authtoken: newToken, 
		  touchtime: Math.floor(Date.now())})
    .then((session) => {
		req.accessToken = newToken;
	// having found and updated, we are done here
	next();
    })
    .catch((error) => {
      // Handle any errors
      next(error);
    });
	logger.debug("########## end auth.controller.validateSession");
	};

exports.saveProfile = (req, res, callback) => {
  logger.debug("controller saveProfile: " + JSON.stringify(req.body));
  const update = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    touchtime: Math.floor(Date.now()),
  };
  logger.debug('update stuff: ' + update);

  // update the update obj fields, new:true forces update. Do it now.
  Profile.findOneAndUpdate({ username: req.body.userName }, update, { new: true }, (error, updatedDocument) => {
    if (error) {
      logger.debug('update error: ' + error);
      callback(error);
    } else if (!updatedDocument) {
      const error = new Error('Document not found');
      error.status = 404;
      logger.debug("update profile, doc not found");
      callback(error);
    } else {
      // update cool, return via callback
      logger.debug("saveProfile cool, returning now");
      callback(null, updatedDocument);
    }
  });
};

exports.register = (req, res) => {
	logger.debug("*** exports.register " + Date());
	logger.debug("auth ctlr register, pwd: " + req.body.password);
	logger.debug("req username: " + req.body.username);
	logger.debug("req fname: " + req.body.firstname);
	logger.debug("req lname: " + req.body.lastname);
	logger.debug("req email: " + req.body.email);
	//var pwd= crypto.createHash('sha1').update(req.body.password).digest('hex');
	var pwd = crypto.createHash('sha1').update(req.body.password).digest('hex');
	logger.debug("pwd temp from hash: " + pwd);
	logger.debug("type of pwd: " + typeof(pwd));
	logger.debug("req pwd before hash: " + req.body.password);
	req.body.password = pwd;
	logger.debug("req pwd updated after hash: " + req.body.password);
	//logger.debug("pwd crypt: " + pwd);

  const user = new User({
    username: req.body.username,
	firstname: req.body.firstname,
	lastname: req.body.lastname,
    email: req.body.email,
    passwordhash: req.body.password,
  });
  
  const profile = new Profile({
	username: req.body.username,
	firstname: "",
	lastname: "",
	email: req.body.email,
	created: new Date(),
  });

logger.debug("User: " + JSON.stringify(user, null, 1));

	logger.debug("new User password " + user.passwordhash);

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles }
        },
        (err, roles) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          user.roles = roles.map(role => role._id);
          user.save(err => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }

            res.send({ message: "User registered successfully" });
          });
        }
      );
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        user.roles = [role._id];
        user.save(err => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          res.send({ message: "User registered successfully" });
        });
      });
    }
  });
};

// Given a username, create a profile. Also, on login, create if none exists
function createProfile(uname) {
	logger.debug("create profile: " + uname);
	
	const query  = Profile.where({ username: uname });
		query.findOne(function (err, profile) {
		if (err) return handleError(err);
		if (!profile) {
			logger.debug("profile NOT FOUND: " + uname);
			var thisProfile = new Profile({username: uname, Doo: "dudly" });
    		thisProfile.save(function (err, prof) {
      			if (err) return console.error(err);
      				logger.debug(prof.username + " saved to profile collection.");
    		});
		} else {
			logger.debug("profile for " + profile.username + " FOUND");
		}
		});
	};

exports.login = (req, res, callback) => {
  User.findOne({
    username: req.body.username
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        logger.debug("findOne err: " + err);
        callback(err, "login db err");
        return;
      }
      logger.debug("past findOne, a ");

      if (!user) {
        logger.debug("no user: " + user);
        callback(404, "Username not found.", res);
        return;
      }
      // passwordOffered, gets hashed and compared to stored hash
      var passwordOffered = crypto.createHash('sha1').update(req.body.password).digest('hex');
      var passwordIsValid = (
        passwordOffered == user.passwordhash
      );

      if (!passwordIsValid) {
        logger.debug("bad pwd, sent: " + req.body.password);
        callback(401, "Invalid password", res);
        return;
      }

      // find session, if exists for this username, then delete it.
      Session.deleteOne({username: req.body.username}, function (err, result) {
        if (err){
          console.log(err)
        }else{
          console.log("cleared prior session :", result) 
        }
      });

      var ID = genSessionID(req.body.username);
      var accessToken = genAccessToken(ID);
      logger.debug('gend accessToken: ' + accessToken);
      const session = new Session({
        sessionid: ID,
        authtoken: accessToken,
        username: req.body.username,
        created: Math.floor(Date.now()),
        touchtime: Math.floor(Date.now()),
      });
      logger.debug("Session: " + ID);
      session.save((err, session) => {
        if (err) {
          callback(500, "login Save Session err", res);
        }
        var roles = [];
        for (let i = 0; i < user.roles.length; i++) {
          roles.push("ROLE_" + user.roles[i].name.toUpperCase());
        }
        res.setHeader('accessToken', accessToken);
        logger.debug("login resp header accessToken: " + accessToken);
        logger.debug("login res setHeader login here");
        callback(200, {
          'accessToken': accessToken,
          'roles': roles,
        }, res);
        logger.debug("past status200 , authorities bit, resStatus: ");
      });
    });
}

// logout current session. If not found, no big deal. Return success anyway.
exports.logout = (req, res, callback) => {
  db.session.findOneAndDelete({ username: req.body.username }, (err, session) => {
    if (err) {
      callback(err);
    } else {
      logger.debug("logged out from cntrl");
      callback(null, "logout");
    }
  });
};


exports.getProfile = (req, res, callback) => {
  logger.debug("getprofile req params: " + req.body.userName);
  Profile.findOne({ username: req.body.userName }, function (err, profile) {
    logger.debug("getProfile params: " + req.body.userName);
    if (err) {
      callback(err);
    } else {
      callback(null, profile);
    }
  });
};
