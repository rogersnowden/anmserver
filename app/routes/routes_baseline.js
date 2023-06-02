// routes.js 
const { authJwt } = require("../middlewares");
const controller = require("../controllers/auth.controller");
const dbtrans = require("../controllers/dbtrans.controller");
const auth= require("../middlewares/authJwt");
var logger = require('log4js').getLogger();

const fs = require('fs');

module.exports = function(app) {

logger.debug("in the routes.js file");

// test tracing
//console.trace();

function errorHandler(err, req, res,next) {
	logger.debug("err handler: " + err);
	res.status(401).json({message: err});
}

app.get('/',(req,res)=>{ 
	if(req.session.loggedIn)
		logger.debug("empty get req, logged in")
	else {
	}
	res.redirect('testlogin.html','./')
  });
  

  app.post("/api/login", (req,res) => {
	  logger.debug("hit login call");
	  controller.login(req, res);
	  logger.debug("login cntrolller call res: " + res.data);
  })

// logout from current session. If no session, return success anyway.
app.post('/api/logout', (req, res) => {
  logger.debug("logging out now: " + req.body.username);
  controller.logout(req, res, (error, result) => {
    if (error) {
      res.status(error.status || 500).send(error.message);
    } else {
      logger.debug("status: " + result);
      res.status(200).send('logout');
    }
  });
});

// register POST
  app.post('/api/register', (req,res) => {
	  logger.debug(" routes register called: " + req.body.user + ' ' + req.body.password);
	  controller.register(req, res);
	  logger.debug(" ctrlr regiser returned: " + res.data);
  });

// getProfile POST
  app.post("/api/getprofile", controller.validateSession, (req, res, next) => {
	logger.debug("routes getprofile accessToken: " + req.accessToken);
	  next();
  });

  app.post("/api/getprofile", (req, res) => {
	logger.debug("start getprofile calling controller " + req.body.userName);
	controller.getProfile(req, res, (error, profileDocument) => {
		if (error) {
		  res.status(error.status || 500).send(error.message);
		} else {
		  res.json(profileDocument);
		}
	  });
  });

// saveProfile POST
  app.post('/api/saveprofile', controller.validateSession, (req, res, next) => { 
	logger.debug("routes saveprofile accessToken: " + req.accessToken);
	next();
});

app.post('/api/saveprofile', (req, res) => {
  controller.saveProfile(req, res, (error, updatedProfile) => {
    if (error) {
      res.status(error.status || 500).send(error.message);
    } else {
      res.json(updatedProfile);
    }
  });
});

// errorHandler for all cases, function errorHandler defined above
app.use(errorHandler);
};
