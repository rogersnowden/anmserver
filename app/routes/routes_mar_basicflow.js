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
//	next();
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

app.post('/api/saveprofile', controller.findToken, (req, res, next) => { 
	// find, extract token from hdr
//	let tok = controller.findToken(req, res, next);
	logger.debug("routes: session token found: " + req.token);
//	res.status(200).json({ message: 'Token Happy now'});
	next();
});

app.post('/api/saveprofile', controller.verifySession, (req, res, next) => {
	// verify session in db: exists and current
	logger.debug("routes second call, req.token: " + req.token);
//	res.status(200).json({ message: 'Session Happy now'});
	next();
});

app.post('/api/saveprofile', controller.verifySession, (req, res) => {
	logger.debug("save 3");
	// save mod profile to db
	res.status(200).json({ message: 'Session Saved'});
});

//app.post('/api/saveprofile', async function (req, res, next) {
//  try {  
//    const user = 'User';
//    const query = 'SELECT [Password] as password FROM [Table] where [User] = ' + SqlString.escape(user);
//    const pool = await sql.connect(dbConfig);
//    const result = await pool.request()
//      .query(querys);
//    const password = result.recordset[0].password;
//    console.log(password);
//    res.end(password);
//  } catch (e) {
//    res.end(e.message || e.toString());
//  }
//});

//app.post("/api/a_saveprofile", async function (req, res, next) {
//	try {
//	logger.debug("############ saveprofile from routes, verifyToken next");
//	let x = controller.verifyToken(req, res);

//	let sessionStatus = controller.validateSession(req, res);
	
//	logger.debug("return from save verifytoken: " + sessionStatus);
//	if (sessionStatus !== "Valid Session") {
//		logger.debug("routes saveprofile error: " + sessionStatus);
//		return res.status(401).send("sessionStatus");
//	}
	// otherwise, do next bit
//	logger.debug("routes saveprofile 'next' time");
//	} catch(e) {
//		logger.debug("save err catch: " + e);
//};
	
//	next();
	
//});

app.post("/api/a_saveprofile", (req, res)=>{
	logger.debug("############ saveprofile from routes, update db" + req.body);
//	let x = dbtrans.saveprofile(req, res);
	logger.debug("############ saveprofile after update:" + x);
})

app.post("/api/test", (req, res, next) =>{ 
//	let x = controller.test(req, res);
	
	logger.debug("%%%%%%%%% test response: " + x);
	next();
})
 
app.post("/api/test", (req, res) =>{ 
	logger.debug("%%%%%%%%% test NEXT and last thing");
})
 
 
app.use(errorHandler);

 
};
