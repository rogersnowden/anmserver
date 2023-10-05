const mongoose = require("mongoose");

// Define the Reset schema
const resetSchema = new mongoose.Schema({
    token: { type: String, index: { unique: true } },
    username: { type: String },
    created: Date,
});

// Create the model, if it doesn't exist
const Reset = mongoose.model('Reset', resetSchema);

module.exports = Reset;