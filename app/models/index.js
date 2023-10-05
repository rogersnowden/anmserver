const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require("./user.model");
db.session = require("./session.model");
db.role = require("./role.model");
db.profile = require("./profile.model");
db.reset = require("./reset.model");

db.ROLES = ["user", "admin", "moderator"];

module.exports = db;