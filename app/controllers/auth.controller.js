// auth.controller.js
const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;
const Session = db.session;
const Profile = db.profile;
const Reset = db.reset;



const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

var logger = require('log4js').getLogger("auth.controller")
logger.debug("in auth.controller");

logger.debug("db thing: " + db);


var jwt = require('jsonwebtoken');

//var sha1 = require('node-sha1');
const bcrypt = require('bcrypt');

const saltRounds = 10; // Increase for more security. 10 is a reasonable default.

function hashPassword(plainPassword) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(plainPassword, saltRounds, (err, hashed) => {
            if (err) {
                reject(err);
            } else {
                resolve(hashed);
            }
        });
    });
}

function genAccessToken(ID) {
	logger.debug(" gen access token ID :" + ID);
    let tok= jwt.sign( {session: ID},
		process.env.TOKEN_SECRET, { expiresIn: 600 });
	var decoded = jwt.decode(tok);
	logger.debug("decoded token: " + decoded);
	return tok;
}

function genSessionID(username) {
    const currentTimestamp = Date.now().toString();
    let ID = crypto.createHash('sha256')
                   .update(username + currentTimestamp + 'TheRainInSpainIsWet')
                   .digest('hex');
    return ID;
}

exports.findToken = (req, res, next) => {
	logger.debug("controller findToken");
	req.token = "sometoken";
	logger.debug("ctlr got token, return now");
	next();
};

exports.validateSession = (req, res) => {
  return new Promise((resolve, reject) => {
    logger.debug("*** exports.verifyToken from auth.controller begin");
    let thisHdr = JSON.stringify(req.headers);
    logger.debug("hdr: " + thisHdr);
    let regexp = '/"accessToken=(([A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*))/'
    var accessToken = [];
    accessToken = thisHdr.match(/"accessToken=(([A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*))/);
    if (!accessToken ) {
      logger.debug('accessToken err');
      // set middleware to err handler and bail out.
      reject('Invalid accessToken');
    }
    let aToken = jwt.decode(accessToken[1]);
    // unpack the accessToken
    var reqToken = jwt.decode(accessToken[1]);
    let thisID= reqToken.session;
    // verify the token, wrt expiration, etc
    logger.debug("iat time: " + Date(reqToken.iat));
    logger.debug("exp time: " + Date(reqToken.exp));

    jwt.verify(accessToken, process.env.TOKEN_SECRET, function(err, decoded) {});

    let newToken = genAccessToken(thisID);
    logger.debug("gend access token: " + newToken);

    Session.findOneAndUpdate(
      { sessionID: thisID },
      {
        username: req.body.username,
        authtoken: newToken,
        touchtime: Math.floor(Date.now()),
      }
    )
      .then((session) => {
        req.accessToken = newToken;
        // having found and updated, we are done here
        resolve(session); // resolve the promise with the session object
      })
      .catch((error) => {
        // Handle any errors
        reject(error); // reject the promise with the error
      });

    logger.debug("########## end auth.controller.validateSession");
  });
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

  // update the update obj fields, new:true forces update
  return Profile.findOneAndUpdate({ username: req.body.userName }, update, { new: true })
    .then((updatedDocument) => {
      if (!updatedDocument) {
        const error = new Error('Document not found');
        error.status = 404;
        logger.debug("update profile, doc not found");
        throw error;
      }
      // update successful, return the updated document
      logger.debug("saveProfile cool, returning now");
      return updatedDocument;
    })
    .catch((error) => {
      logger.debug('update error: ' + error);
      throw error;
    });
};

exports.register = (req, res) => {
  logger.debug("*** exports.register " + Date());
  logger.debug("auth ctlr register, user: " + req.body.username);

  return new Promise((resolve, reject) => {
    User.findOne({ username: req.body.username })
      .then(existingUser => {
        if (existingUser) {
          // If user with the same username already exists, reject with a specific error message
          throw new Error("Username already exists");
        }

        // Hash the password
        return bcrypt.hash(req.body.password, saltRounds);
      })
      .then(hashedPassword => {
        // Create a new user with the hashed password
        const user = new User({
          username: req.body.username,
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          email: req.body.email,
          passwordhash: hashedPassword,
        });

        return user.save();
      })
      .then(user => {
        if (req.body.roles) {
          return Role.find({ name: { $in: req.body.roles } }).exec()
            .then(roles => {
              user.roles = roles.map(role => role._id);
              return user.save();
            });
        } else {
          return Role.findOne({ name: "user" }).exec()
            .then(role => {
              user.roles = [role._id];
              return user.save();
            });
        }
      })
      .then(() => {
        logger.debug("reg okay");
        resolve({ message: "User registered successfully" });
      })
      .catch((error) => {
        logger.debug("reg err " + error);
        reject(error);
      });
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

exports.login = (req, res) => {
  // tidy up strings
  req.body.username = req.body.username.trim();
  req.body.password = req.body.password.trim();

  return authenticateUser(req.body.username, req.body.password)
    .then(user => {
      return createSession(user)
        .then(session => {
          if (session) {
            return session;
          } else {
            throw new Error('Not logging in');
          }
        });
    })
    .catch(error => {
      console.error('Error in login:', error);
      throw error;
    });
};

function authenticateUser(username, password) {
  return User.findOne({ username: username })
    .populate("roles", "-__v")
    .exec()
    .then(user => {
      if (!user) {
        logger.debug("username not found: " + username);
        throw new Error("Username Not Found");
      }

      // Compare the password using bcrypt
      return bcrypt.compare(password, user.passwordhash)
        .then(passwordIsValid => {
          if (!passwordIsValid) {
            logger.debug("password bad: " + password);
            throw new Error("Invalid Password");
          }

          logger.debug("username auth fell through okay");
          return user;
        });
    })
    .catch(error => {
      logger.debug('Error authenticating user:', error);
      throw error;
    });
}

function lookupUser(username) {
  return User.findOne({ username: username })
    .exec()
    .then(user => {
      if (!user) {
        logger.debug("username not found: " + username);
        throw new Error("Username Not Found");
      } else {
        return user;
      }
    })
    .catch(error => {
      console.error('Error finding:', error);
      throw error;
    });
}

function createSession(user) {
  return Session.deleteOne({ username: user.username })
    .exec()
    .then(result => {
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

      return session.save().then(session => {
        return session;
      })
      .catch(error => {
        console.error('Error creating session:', error);
        throw error;
      });
    })
    .catch(error => {
      console.error('Error deleting old session:', error);
      throw error;
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

// create hashed value to use as reset token
function generateRandomToken() {
	let token= crypto.randomBytes(32).toString('hex');
	logger.debug("gen token: " + token);
	return token;
};

// Assuming User is your user model and it has a method or static to find by username...

exports.pwdreset = (req, res) => {
  return new Promise((resolve, reject) => {
    // tidy up strings
    let username = req.body.username.trim();
	// preemptively get token so value is in scope throughout
    var token = generateRandomToken();

    // Check if username exists in the database
    User.findOne({ username: username })
      .then(user => {
        if (!user) {
          // No user found with this username
		  logger.debug("control reset find user err: " + username);
          reject(new Error("Username not found"));
          return;  // Return to prevent the rest of the code from executing
        }

        // create reset timestamp, add to user doc, gen reset link to api
        let resetTime = Math.floor(Date.now());
    
        var thisReset = new Reset({
          token: token, 
          username: username,
          created: resetTime
        });
		logger.debug("created reset obj: " + resetTime);
        return thisReset.save();  // Chain the promise to be caught by the outer .then() or .catch()
      })
      .then(() => {
        var link = getLink(token);
		logger.debug("reset do happy");
        resolve({message: "Reset link sent"});
      })
      .catch(error => {
        logger.debug('Error pwd reset:', error);
        reject(new Error("Error in password reset"));
      });
  });
};

exports.pwdset = (req, res) => {
  return new Promise((resolve, reject) => {
    Reset.findOne({ token: req.body.token })
      .then(resetDoc => {
        if (!resetDoc) {
          logger.debug("token not found: " + req.body.token); // Note: Change from resetDoc.token to req.body.token because resetDoc would be null here
          return reject(new Error("Reset Token Not Found"));
        }
        
        // If reset token found, retrieve the associated user
        return User.findOne({ username: req.body.username });
      })
      .then(user => {
        if (!user) {
          logger.debug("User not found for username: " + req.body.username);
          return reject(new Error("User not found"));
        }

        // Update the password and save
		var newPassword = req.body.newPassword;
		var hashedPassword = crypto.createHash('sha1').update(newPassword).digest('hex');
		user.password = hashedPassword;        return user.save();
      })
      .then(() => {
        logger.debug("Password updated successfully");
        resolve({ message: "Password updated successfully" });
      })
      .catch(error => {
        console.error('Error authenticating reset token:', error);
        reject(error);
      });
  });
};



function getLink(username, resetTime) {
	logger.debug("in getlink");
	var urlBase= "https://localhost:3000";
	var thisLink= urlBase + "/pwdset/" + username;
	console.log("new link: " + thisLink);
	return (thisLink);
};

function sendLink(username, resetTime) {
	console.log("link sent: " + username + " " + resetTime);
};

exports.getProfile = (req, res) => {
  logger.debug("getprofile req params: " + req.body.userName);
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
