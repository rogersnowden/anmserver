const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: {type: String, required: true},
	firstname: String,
	lastname: String,
    email: String,
    passwordhash: String,
    roles: [String],
  })
);

module.exports = User;