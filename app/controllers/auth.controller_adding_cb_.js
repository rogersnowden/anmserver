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
	logger.debug("*** genAccessToken " + Date() );
	logger.debug(" gen access token ID :" + ID);
	logger.debug("token secret: " + process.env.TOKEN_SECRET );
    let tok= jwt.sign( {session: ID},
		process.env.TOKEN_SECRET, { expiresIn: 600 });
//    let tok= jwt.sign( {session: ID, iat: Math.floor(Date.now())},
//		process.env.TOKEN_SECRET, { expiresIn: 5 * 60 });
	logger.debug("session ID : " + ID);
	logger.debug("gen tok: " + tok);
	var decoded = jwt.decode(tok);
	logger.debug('gend token decoded: ' + JSON.stringify(decoded.iat) + ' ' + Date(JSON.stringify(decoded.iat)));
	logger.debug('gend token decoded exp: ' + JSON.stringify(decoded.exp) + ' ' + Date(JSON.stringify(decoded.exp)));
	return tok;
}

function genSessionID(username) {
	logger.debug("*** genSessionID " + Date());
	let ID = crypto.createHash('sha1', username )
		  .update('How are you?')
          // Encoding to be used
          .digest('hex');
	logger.debug("gen'd session id: " + ID);
	return ID;
};

exports.findToken = (req, res, next) => {
	logger.debug("controller findToken");
	req.token = "sometoken";
	logger.debug("ctlr got token, return now");
//	next("Session Token Not Found");
	next();
};

exports.validateSession = (req, res, next) => {
	logger.debug("*** exports.verifyToken from auth.controller begin");
	let thisHdr = JSON.stringify(req.headers);
	logger.debug("$$$$$$ header: " + thisHdr);
// regex	"accessToken=(([A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*))
	let regexp = '/"accessToken=(([A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*))/'
	var accessToken = [];
	accessToken = thisHdr.match(/"accessToken=(([A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*))/);
	logger.debug("regardless, accessToken: " + accessToken);
	if (!accessToken ) {
			logger.debug('accessToken err');
			// set middleware to err handler and bail out.
			next("No Session Token");
			return;
	}
	let aToken = jwt.decode(accessToken[1]);
	logger.debug('da token: ' + accessToken[1]);
	logger.debug('to string, token: ' + JSON.stringify(aToken));
	// unpack the accessToken
	var reqToken = jwt.decode(accessToken[1]);
	let thisID= reqToken.session;
	// verify the token, wrt expiration, etc
	logger.debug("iat time: " + Date(reqToken.iat));
	logger.debug("exp time: " + Date(reqToken.exp));
	
	jwt.verify(accessToken, process.env.TOKEN_SECRET, function(err, decoded) {
	});
	logger.debug('reqToken string: ' + JSON.stringify(reqToken));
	logger.debug("now, thisID: " + thisID);

	let newToken = genAccessToken(thisID);
	
	logger.debug("find andupdate next");
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

exports.saveProfile = (req, res, next, callback) => {
	logger.debug("controller saveProfile: " + JSON.stringify(req.body));
	const update = {
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		email: req.body.email,
		touchtime: Math.floor(Date.now()),
		};
	logger.debug('update stuff: ' + update);
	// update the update obj fields, new:true forces update. Do it now.
	Profile.findOneAndUpdate( {username: req.body.userName}, update, { new: true }
		)
    .then((updatedDocument) => {
      if (!updatedDocument) {
		  logger.debug("update profile, doc not found");
        throw new Error('Document not found');
      }
	  logger.debug("controller profile updated");
      res.json(updatedDocument);
    })
    .catch((error) => {
      // Handle any errors
	  logger.debug('update error: ' + error);
	  res.status(500).send('Error updating document');    });
};

exports.saveProfile_ = (req, res) => {
	logger.debug("controller saveProfile: " + JSON.stringify(req.body));
	const update = {
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		email: req.body.email,
		touchtime: Math.floor(Date.now()),
		};
	logger.debug('update stuff: ' + update);
	// update the update obj fields, new:true forces update. Do it now.
	Profile.findOneAndUpdate( {username: req.body.userName}, update, { new: true }
		)
    .then((updatedDocument) => {
      if (!updatedDocument) {
		  logger.debug("update profile, doc not found");
        throw new Error('Document not found');
      }
	  logger.debug("controller profile updated");
      res.json(updatedDocument);
    })
    .catch((error) => {
      // Handle any errors
	  logger.debug('update error: ' + error);
	  res.status(500).send('Error updating document');    });
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

exports.login = (req, res) => {
  User.findOne({
    username: req.body.username
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        logger.debug("findOne err: " + err);
        res.status(500).send({ message: err });
        return;
      }
        logger.debug("past findOne, a " );

      if (!user) {
		  logger.debug("no user: " + user);
        return res.status(404).send({ message: "Username not found." });
      }
	// passwordOffered, gets hashed and compared to stored hash
	var passwordOffered = crypto.createHash('sha1').update(req.body.password).digest('hex');
    var passwordIsValid = (
        passwordOffered == user.passwordhash
      );
	  
      if (!passwordIsValid) {
		  logger.debug("bad pwd, sent: " + req.body.password);
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
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
      res.status(500).send({ message: err });
      return;
	}});

      var authorities = [];

      for (let i = 0; i < user.roles.length; i++) {
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }
	  res.setHeader('accessToken', accessToken);
	  logger.debug("login resp header accessToken: " + accessToken);
	  logger.debug("login res setHeader login here");
      res.status(200).send({
        id: user._id,
        username: user.username,
        email: user.email,
        roles: authorities,
        accessToken: accessToken,
      });
	          logger.debug("past status200 , authorities bit, resStatus: ");

    });
};

exports.getprofile = (req, res) => {
//	Profile.findOne({ sessionid: uname }, 'id_ username', function (err, profile) {
	Profile.findOne({ sessionid: req.body.username }, function (err, profile) {
		logger.debug("getProfile params: " + req.body.username);
    if (err) {
		logger.debug(" getProfile findone err: " + err);
		return handleError(err);
	} else {
		logger.debug("find one profile: " + profile);
		if (! profile._id) {
			logger.debug("NO Profile for " + uname);
//			res.send(401, "No session");
		}
		logger.debug('sending profile:' + profile);
		res.status(200).send(profile);
		logger.debug('profile http return 200 sent');
		
	}
	});
};
