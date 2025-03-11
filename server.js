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
    http = require("http").Server(app),
    session = require("express-session")({
        secret: "secrets",
        resave: true,
        saveUninitialized: true
    }),
    bodyparser = require("body-parser"),
    crypto = require("crypto"),
    check = require("express-validator"),
    sanitizer = require("sanitize"),
    MongoClient = require('mongodb-legacy').MongoClient,
    client = new MongoClient(DB_CONN_STRING);


app.use(session);
app.set("view engine", "ejs");
app.use(require("express").static("public"));
app.use(require("express").urlencoded({ extended: true }));

app.get("/", (req, res) => {

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

connectDB();

http.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
}); 