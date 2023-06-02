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

// case switch for errors
function getHttpResponse(errorMessage) {
  switch (errorMessage) {
    case "Valid Session":
      return 200;
    case "Session Not Found":
      return 404;
    case "Session Timeout":
    case "Session Expired":
    case "Invalid Password":
    case "Username Not Found":
      return 401;
    default:
      return 500;
  }
}

app.get('/',(req,res)=>{ 
logger.debug("empty get req");
	if(req.session.loggedIn)
		logger.debug("empty get req, logged in")
	else {
	}
	res.redirect('testlogin.html','./')
  });
  

app.post("/api/login", (req, res) => {
	logger.debug("routes login ");
  controller.login(req, res)
    .then(data => {
      // send success response
      res.status(200).json(data);
    })
    .catch(err => {
      // send error response
      res.status(500).json({message: err.message});
    });
});

// logout from current session. If no session, return success anyway.

app.post("/api/logout", controller.validateSession, (req, res, next) => {
	logger.debug("routes logout accessToken: " + req.accessToken);
	  next();
});

app.post('/api/logout', (req, res) => {
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
app.post('/api/register', (req, res) => {
  logger.debug("routes register called: " + req.body.username + ' ' + req.body.password);
  controller.register(req, res)
    .then(data => {
      // send success response
      res.status(200).json(data);
    })
    .catch(err => {
      if (err.message === "Username already exists") {
        res.status(400).json({ message: "Username already exists. Please choose a different username." });
      } else {
        res.status(500).json({ message: err.message });
      }
    });
});


// getProfile POST
app.post("/api/getprofile", (req, res) => {
  controller.validateSession(req, res)
    .then(user => {
      return controller.getProfile(req, res); // Add the return statement here
    })
    .then(profileDocument => {
      // send success response
      logger.debug("got prof: " + profileDocument);
      res.status(200).json(profileDocument);
    })
    .catch(error => {
      res.status(error.status || 500).json({ message: error.message });
    });
});

// saveProfile POST
app.post('/api/saveprofile', (req, res) => { 
  controller.validateSession(req, res)
    .then(user => {
      controller.saveProfile(req, res);
    })
    .then(updatedDocument => {
      // send success response
	  logger.debug("save, got updated doc: " + updatedDocument);
      res.status(200).json(updatedDocument);
    })
    .catch(error => {
      res.status(error).json({message: error.message});
    });
});

// errorHandler for all cases, function errorHandler defined above
app.use(errorHandler);
};
