// routes.js 
const { authJwt } = require("../middlewares");
const controller = require("../controllers/auth.controller");
const auth= require("../middlewares/authJwt");
var logger = require('log4js').getLogger("routes")

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


const verifyToken = (req, res, next) => {
	logger.debug("hitting verifyToken");
	// write header to file for debug
//	fs.writeFile('reqhdr.txt', JSON.stringify(req.headers), function (err) {
//		if (err) throw err;
//		logger.debug('post verf reqhdr file is created successfully.');
//		});
	let thisHdr = JSON.stringify(req.headers);
	let hdr1= thisHdr.split('accessToken:');
	logger.debug('hdr1 0 : ' + hdr1[0]);
	logger.debug('hdr1 1 : ' + hdr1[1]);
	let hdr1a = JSON.stringify(hdr1[1]);
	logger.debug("hdr 1a : " + hdr1a);
	let hdr2= hdr1a.split('\",');
	logger.debug('hdr2: ' + hdr2[0]);
	let hdr3 = hdr2[0];
	logger.debug('hdr3 type: ' + typeof(hdr3));
	hdr4 = hdr3.replace(/\\/g, '');
	logger.debug('hdr4 cleaner: ' + hdr4);
	var accessToken = hdr4.replace(/"/g, '');
	logger.debug('client accessToken: ' + accessToken);
	if (!accessToken) {
			logger.debug('accessToken err: ' + ex);
			res.sendStatus(401);
		logger.debug("accessToken from client not found");
	}
	logger.debug("client accessToken found");
	// now verify it with mongodb
	};

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

app.post("/api/getprofile", verifyToken, (req, res)=>{
	  logger.debug("post getprofile routes file " + req.username);
	  logger.debug("cookies: " + req.cookies);
	  logger.debug("signed cookies: " + req.signedCookies);
	  controller.getprofile(req, res);
	  logger.debug("cntrolller getprofile res: " + res.data);
})

//  app.post("/api/getprofile", (req, res) => {auth.verifyToken}, (req,res) => {
//	  logger.debug("post getprofile calling controller " + req.username);
//	  controller.getprofile(req, res);
//	  logger.debug("cntrolller getprofile res: " + res.data);
//  })


 
};
