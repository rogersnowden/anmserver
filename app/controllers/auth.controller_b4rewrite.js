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
  // tidy up strings
  req.body.username = req.body.username.trim();
  req.body.password = req.body.password.trim();
//	logger.debug("auth ctl login start: " + req.body.username);
  authenticateUser(req.body.username, req.body.password) => {
    if (err) {
      return sendErrorResponse(err, res, callback);
    }
    createSession(user, (err, accessToken) => {
      if (err) {
        return sendErrorResponse(err, res, callback);
      }
      return sendSuccessResponse(accessToken, user, res, callback);
    });
  });
};

function authenticateUser(username, password, callback) {
	logger.debug("auth username: " + username + " " + password);
  User.findOne({ username: username })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
		  logger.debug("user auth err: " + err);
        return callback(err, null);
      }
	  logger.debug("username checked, no err: " + username);
      if (!user) {
		  logger.debug("username not found: " + username);
        return callback("Username Not Found", null);
      }

      var passwordOffered = crypto.createHash('sha1').update(password).digest('hex');
      var passwordIsValid = (passwordOffered == user.passwordhash);

      if (!passwordIsValid) {
		  logger.debug("password bad: " + password);
        return callback("Invalid Password", null);
      }
logger.debug("username auth fell through okay");
      return callback(null, user);
    });
}

function createSession(user, callback) {
  Session.deleteOne({ username: user.username }, (err) => {
    if (err) {
      return callback(err, null);
    }

    var ID = genSessionID(user.username);
    var accessToken = genAccessToken(ID);
    logger.debug('generated accessToken: ' + accessToken);
    const session = new Session({
      sessionid: ID,
      authtoken: accessToken,
      username: user.username,
      created: Math.floor(Date.now()),
      touchtime: Math.floor(Date.now()),
    });

    session.save((err, session) => {
      if (err) {
        return callback(err, null);
      }

      return callback(null, accessToken);
    });
  });
}

function sendErrorResponse(err, res, callback) {
  if (typeof err === "string") {
    return callback(err, null);
  } else {
    return callback(500, "Login failed.", res);
  }
}

function sendSuccessResponse(accessToken, user, res, callback) {
  var roles = [];
  for (let i = 0; i < user.roles.length; i++) {
    roles.push("ROLE_" + user.roles[i].name.toUpperCase());
  }
  
  res.setHeader('accessToken', accessToken);
  logger.debug("Set accessToken header: " + accessToken);
  
  var response = {
    accessToken: accessToken,
    roles: roles,
  };
  
  return callback(null, response);
}

// logout current session. If not found, no big deal. Return success anyway.
exports.logout = (req, res, callback) => {
  db.session.findOneAndDelete({ username: req.body.username }, (err, session) => {
    if (err) {
      callback(err);
    } else {
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
