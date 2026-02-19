const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const mongoose = require("mongoose");

const app = express();

// ================= DATABASE CONNECTION =================
mongoose.connect("mongodb://127.0.0.1:27017/sportify2")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ================= MIDDLEWARE =================
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: "sportsSecret",
    resave: false,
    saveUninitialized: true
}));

// ================= MODELS =================
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

const workoutSchema = new mongoose.Schema({
    userId: String,
    exercise: String,
    duration: Number,
    calories: Number
});

const User = mongoose.model("User", userSchema);
const Workout = mongoose.model("Workout", workoutSchema);

// ================= ROUTES =================

// HOME PAGE (Shows all workouts)
app.get("/", async (req, res) => {

    const users = await User.find();
    const workouts = await Workout.find();

    res.render("index", {
        user: req.session.user || null,
        users,
        workouts
    });
});


// REGISTER PAGE
app.get("/register", (req, res) => {
    res.render("register");
});

// REGISTER LOGIC
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    await User.create({ name, email, password });
    res.redirect("/login");
});

// LOGIN PAGE
app.get("/login", (req, res) => {
    res.render("login");
});

// LOGIN LOGIC
app.post("/login", async (req, res) => {
    const user = await User.findOne({
        email: req.body.email,
        password: req.body.password
    });

    if (user) {
        req.session.user = user;
        res.redirect("/dashboard");
    } else {
        res.send("Invalid Credentials");
    }
});

// DASHBOARD (User Specific)
app.get("/dashboard", async (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    const workouts = await Workout.find({
        userId: req.session.user._id
    });

    res.render("dashboard", {
        user: req.session.user,
        workouts: workouts
    });
});

// ADD WORKOUT
app.post("/addWorkout", async (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    await Workout.create({
        userId: req.session.user._id,
        exercise: req.body.exercise,
        duration: req.body.duration,
        calories: req.body.calories
    });

    if (req.body.action === "home") {
        res.redirect("/");
    } else {
        res.redirect("/dashboard");
    }
});


// LOGOUT
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});


