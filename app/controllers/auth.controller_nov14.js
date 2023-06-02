// auth.controller.js
const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;
const Session = db.session;

const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

var logger = require('log4js').getLogger("auth.controller")
logger.debug("in auth.controller");

var jwt = require('jsonwebtoken');

var sha1 = require('node-sha1');

function genAccessToken(ID) {
	logger.debug("token secret: " + process.env.TOKEN_SECRET );
    let tok= jwt.sign( {session: ID}, process.env.TOKEN_SECRET, { expiresIn: '180s'});
	logger.debug("gen tok: " + tok);
	var decoded = jwt.decode(tok);
	logger.debug('decoded: ' + JSON.stringify(decoded));
	return tok;
}

function genSessionID(username) {
	let ID = crypto.createHash('sha1', username )
		  .update('How are you?')
          // Encoding to be used
          .digest('hex');
	logger.debug("gen'd session id: " + ID);
	return ID;
	
}

exports.register = (req, res) => {
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

logger.debug("User: " + JSON.stringify(user, null, 1));

	logger.debug("new User password " + user.passwordhash);

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

logger.debug("user save, no err");

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

            res.send({ message: "User was registered successfully!" });
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

          res.send({ message: "User was registered successfully!" });
        });
      });
    }
  });
};

exports.login = (req, res) => {
	logger.debug("ctrl login uname: " + req.body.username);
	logger.debug("ctrl login pwd: " + req.body.password);
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
        logger.debug("past !user, b");

	// passwordOffered, gets hashed and compared to stored hash
	var passwordOffered = crypto.createHash('sha1').update(req.body.password).digest('hex');

	
    var passwordIsValid = (
        passwordOffered == user.passwordhash
      );
	  
      logger.debug("did pwd validation: " + passwordIsValid);
	  
      if (!passwordIsValid) {
		  logger.debug("bad pwd, sent: " + req.body.password);
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

        logger.debug("past pwdIsValid, do gentoken");
	var ID = genSessionID(req.body.username);
	var accessToken = genAccessToken(ID);
	logger.debug('gend accessToken: ' + accessToken);
	const session = new Session({
		sessionid: ID,
		authtoken: accessToken,
		username: req.body.username,
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
	logger.debug("ctrl getprofile uname: " + req.body.username);
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
        logger.debug("past !user, b");

	// passwordOffered, gets hashed and compared to stored hash
	var passwordOffered = crypto.createHash('sha1').update(req.body.password).digest('hex');

	logger.debug("req pwd: " + req.body.password);
	logger.debug("req pwd, hashed: " + passwordOffered);
	logger.debug("db pwd: " + user.passwordhash);
	
	
    var passwordIsValid = (
        passwordOffered == user.passwordhash
      );
	  
      logger.debug("did pwd validation: " + passwordIsValid);
	  
      if (!passwordIsValid) {
		  logger.debug("bad pwd, sent: " + req.body.password);
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

        logger.debug("past pwdIsValid, do gentoken");
	var token = genAccessToken(req.body.username);
 //     var token = jwt.sign({ id: user.id }, config.secret, {
 //       expiresIn: 86400 // 24 hours
 //     });
		
		logger.debug("user id: " + user.id);
        logger.debug("access token assigned: " + token);

      var authorities = [];

      for (let i = 0; i < user.roles.length; i++) {
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }
      res.status(200).send({
        id: user._id,
        username: user.username,
        email: user.email,
        roles: authorities,
        accessToken: token
      });
	          logger.debug("past status200 , authorities bit, resStatus: ");

    });
};
