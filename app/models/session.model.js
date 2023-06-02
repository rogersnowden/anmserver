const mongoose = require("mongoose");

const Session = mongoose.model(
  "Session",
  new mongoose.Schema({
    sessionid: { type: String, required: true},
	authtoken: String,
	username: {type: String, index: {unique: true}},
	created: Date,
	touchtime: Date,
	})
);

module.exports = Session;