const db = require("../models");
const ROLES = db.ROLES;
const User = db.user;

var logger = require('log4js').getLogger("verifyRegister")

checkDuplicateUsernameOrEmail = (req, res, next) => {
	logger.debug("##### verifyRegister called 1")

  // Username
  console.log("finding username: " + req.body.username);
  User.findOne({
    username: req.body.username
  }).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (user) {
      res.status(400).send({ message: "Failed! Username is already in use!" });
      return;
    }

    // Email
    User.findOne({
      email: req.body.email
    }).exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (user) {
        res.status(400).send({ message: "Failed! Email is already in use!" });
        return;
      }

      next();
    });
  });
};

checkRolesExisted = (req, res, next) => {
	logger.debug("##### verifyRegister called 2")
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        res.status(400).send({
          message: `Failed! Role ${req.body.roles[i]} does not exist!`
        });
	logger.debug("##### verifyRegister ending checkRolesExists, returning")
		
        return;
      }
    }
  }

  next();
};

const verifyRegister = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted
};

module.exports = verifyRegister;
