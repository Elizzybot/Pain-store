const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    githubId: { type: String }
});

module.exports = mongoose.model("User", UserSchema);
