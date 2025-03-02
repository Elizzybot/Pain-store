require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

require("./auth/google");
require("./auth/github");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(passport.initialize());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected")).catch(err => console.log(err));

app.post("/api/signup", async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();
    res.json({ message: "User registered" });
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token });
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get("/auth/google/callback", passport.authenticate("google", { session: false }), (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET);
    res.redirect(`/dashboard.html?token=${token}`);
});

app.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));
app.get("/auth/github/callback", passport.authenticate("github", { session: false }), (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET);
    res.redirect(`/dashboard.html?token=${token}`);
});

app.post("/api/create-panel", async (req, res) => {
    try {
        const { email, username } = req.body;
        const response = await axios.post(
            `${process.env.PTERODACTYL_PANEL_URL}/api/application/users`,
            { email, username, first_name: "User", last_name: "Hosting" },
            { headers: { Authorization: `Bearer ${process.env.PTERODACTYL_API_KEY}` } }
        );
        res.json({ message: "Panel created", data: response.data });
    } catch (error) {
        res.status(500).json({ error: error.response.data });
    }
});

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
