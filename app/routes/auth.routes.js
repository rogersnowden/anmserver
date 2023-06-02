// auth.routes.js
const { verifyRegister } = require("../middlewares");
const controller = require("../controllers/auth.controller");

console.log(" !!!!!!!!!!!!!!!!!!! auth.routes loaded");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/api/auth/register",
    [
      verifyRegister.checkDuplicateUsernameOrEmail,
      verifyRegister.checkRolesExisted
    ],
    controller.register
  );

  app.post(
	"/api/auth/login", 
	controller.login
  );
  
  app.getprofile(
  logger.debug("clear ");
  logger.debug("");
  logger.debug("");
  logger.debug("");
  logger.debug("############### START getprofile from routes");
	"api/auth/getprofile",
	controller.getprofile;
	logger.debug(" END getprofile from auth.routes");
  );
};
