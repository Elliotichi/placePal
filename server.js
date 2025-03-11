/**
 * PlacePal's web server.
 * 
 * To run: npm start
 * 
*/
const PORT = process.env.PORT;
const API_KEY = process.env.API_KEY;
const DB_CONN_STRING = process.env.DB_CONN_STRING;
const DB_NAME = process.env.DB_NAME;

const app = require("express")(),
    express = require("express"),
    http = require("http").Server(app),
    session = require("express-session")({
        secret: "secrets",
        resave: true,
        saveUninitialized: true
    }),
    crypto = require("crypto"),
    bodyparser = require("body-parser"),
    MongoClient = require('mongodb-legacy').MongoClient,
    client = new MongoClient(DB_CONN_STRING),
    sanitize = require('validator').sanitize;

const { body, validationResult } = require("express-validator");

app.use(session);
app.set("view engine", "ejs");
app.use(require("express").static("public"));
app.use(require("express").urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
    return res.render("pages/index");
});

app.get("/login", (req, res) => {
    return res.render("pages/loginpage");
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
            return res.status(400).json({ errors: errors.array() });
        }

        const hash = hashPassword(req.body.password);
        var user_to_add = {
            email: req.body.email,
            pass_hash: hash,
            role: req.body.role
        }

    db.collection("users").insertOne(user_to_add, (err, result) => {
        if (err) throw err;
        return res.render("pages/loginpage");
    });
});

/**
 * Login route
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
            return res.status(400).json({ errors: errors.array() });
        }

        db.collection("users").findOne({ "email": req.body.email }, (err, result) => {
            if (err) throw err;
            if (!result) {
                error = "Invalid email or password.";
                return res.render("pages/loginpage");
            }
            if (compareHashPassword(req.body.password, result.password)) {
                req.session.loggedin = true;
                req.session.uname = result.user;
                if (err) throw err;
                res.redirect("/");
                return;
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

const hashPassword = password => {
    return crypto.createHash('sha256').update(password).digest('hex')
}

const compareHashPassword = (password, hashedPassword) => {
    if (hashPassword(password) === hashedPassword) {
        return false;
    }
    return false;
}

const isAuthenticated = ({ loggedin = false }) => {
    if (!loggedin || !db) { return false; }
    return true;
}

connectDB();

http.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
}); 