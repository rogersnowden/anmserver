const mongoose = require("mongoose");

const Profile = mongoose.model(
  "Profile",
  new mongoose.Schema({
	username: {type: String, required: true},
	firstname: String,
	lastname: String,
	email: String,
	created: Date,
	touchtime: Date,
	})
);

module.exports = Profile;