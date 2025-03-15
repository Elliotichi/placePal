/**
 * PlacePal's web server.
 * 
 * To run: npm start
 * 
*/
// Database and connection information
const PORT = process.env.PORT;
const API_KEY = process.env.API_KEY;
const DB_CONN_STRING = process.env.DB_CONN_STRING;
const DB_NAME = process.env.DB_NAME;

// Imports
const app = require("express")(),
    express = require("express"),
    http = require("http").Server(app),
    crypto = require("crypto"),
    bodyparser = require("body-parser"),
    MongoClient = require('mongodb-legacy').MongoClient,
    client = new MongoClient(DB_CONN_STRING),
    flash = require('connect-flash'),
    sanitize = require('validator').sanitize,
    session = require("express-session")({
        secret: "secrets",
        resave: true,
        saveUninitialized: true
    });


// Helper functions for rendering - standardizes template etc
const { renderLogin, renderHomepage } = require("./render");

// Validator functions
const { body, validationResult } = require("express-validator");

// Configure Express
app.use(session);
app.set("view engine", "ejs");
app.use(require("express").static("public"));
app.use(require("express").urlencoded({ extended: true }));
app.use(express.json());
app.use(flash());

app.get("/", (req, res) => {
    return renderHomepage(res);
});

app.get("/login", (req, res) => {
    return renderLogin(res, { success: req.flash("success"), failure: req.flash("failure") });
});

app.post("/register",
    [
        [
            body("email").isEmail().trim(),
            body("password").notEmpty().trim(),
            body("role").notEmpty().trim()
        ]
    ], async (req, res) => {
        if (!db) { res.redirect("/"); req.session.loggedIn = false; return; }
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash("failure", "Invalid username or password");
            return res.redirect("/login");
        }

        const hash = hashPassword(req.body.password);
        var user_to_add = {
            email: req.body.email,
            pass_hash: hash,
            role: req.body.role
        }

        db.collection("users").insertOne(user_to_add, (err, result) => {
            if (err) throw err;
            req.flash("success", "Successfully registered!");
            return res.redirect("/login");
        });
});

/**
 * Login route
 * Validate that the email 
 */
app.post("/login",
    [
        [
            body("email").isEmail(),
            body("password").notEmpty()
        ]
    ], async (req, res) => {
        if (!db) { res.redirect("/"); req.session.loggedIn = false; return; }
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return renderLogin(res, { failure: "Invalid username or password" });
        }
        db.collection("users").findOne({ "email": req.body.email }, (err, result) => {
            if (err) throw err;
            if (!result) {
                return renderLogin(res, {
                    failure: "Invalid username or password"
                });
            }
            if (compareHashPassword(req.body.password, result.pass_hash)) {
                req.session.loggedin = true;
                req.session.uname = result.user;
                return res.redirect(303, "/");
            }
        })
});

/* 
* DATABASE CONNECT
* Wait until a databse connection is established. If there is an error, log it in the server console
*/
const connectDB = async () => {
    try {
        // Use connect method to connect to the server
        await client.connect();
        console.log('Connected successfully to MongoDB Atlas');
        db = client.db(DB_NAME);
    }
    catch (err) {
        console.log(err);
    }
}

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');
const compareHashPassword = (password, hashedPassword) => hashPassword(password) === hashedPassword;
const isAuthenticated = (loggedin = false) => (!loggedin || !db);

connectDB();

http.listen(PORT, () => console.log(`Listening on ${PORT}`)); 