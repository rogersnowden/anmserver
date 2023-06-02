const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: {type: String, required: true},
	firstname: String,
	lastname: String,
    email: String,
    passwordhash: String,
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role"
      }
    ],
  })
);

module.exports = User;