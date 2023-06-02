// routes.js 
const { authJwt } = require("../middlewares");
const controller = require("../controllers/auth.controller");
const dbtrans = require("../controllers/dbtrans.controller");
const auth= require("../middlewares/authJwt");
var logger = require('log4js').getLogger();

const fs = require('fs');

module.exports = function(app) {

//	logger.debug("config cors stuff");
//  app.use(function(req, res, next) {
//	  logger.debug("req: " + req);
//	  logger.debug("res: " + res);
//	logger.debug("doing config cors stuff");
//	res.header("Access-Control-Allow-Origin", "*");
//    res.header(
//      "Access-Control-Allow-Headers",
//      "x-access-token, Origin, Content-Type, Accept"
//    );
//	logger.debug("res headers: " + JSON.stringify(res.header));
//    next();
//  });

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
	  fs.writeFile('reqloginbody.txt', JSON.stringify(req.body), function (err) {
		if (err) throw err;
		logger.debug('post reqlogin body file is created successfully.');
		});
	  logger.debug("LOGIN POST username, calling controller " + req.body.username);
	  logger.debug("LOGIN POST password, calling controller " + req.body.password);
	  controller.login(req, res);
	  logger.debug("login cntrolller call res: " + res.data);
  })

  app.get('/api/logout', (req,res) => {
  })

  app.post('/api/register', (req,res) => {
	  logger.debug(" routes register called: " + req.body.user + ' ' + req.body.password);
	  controller.register(req, res);
	  logger.debug(" ctrlr regiser returned: " + res.data);
  })

app.post("/api/getprofile", (req, res, next)=>{
	logger.debug("############ getprofile from routes, verifyToken next");
	controller.verifyToken(req, res);
	  logger.debug("after verifyToken call");
	  next();
})

  app.post("/api/getprofile", (req, res, next) => {
	  //var thisProfile;
	  logger.debug("start getprofile calling controller " + req.body.username);
	  controller.getprofile(req, res);
	  logger.debug("after cntroller getprofile res: " + res);
  })

app.post('/api/saveprofile', controller.validateSession, (req, res, next) => { 
	// find, extract token from hdr
	logger.debug("routes: acesssToken: " + req.accessToken);
//	res.status(200).json({ message: 'Token Happy now'});
	next();
});

app.post('/api/saveprofile', controller.saveProfile, (req, res) => {
	// verify session in db: exists and current
	logger.debug("saveprofile call done");
});

 
app.use(errorHandler);

 
};
