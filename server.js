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
    sanitizer = require("sanitize");

const PORT = process.env.PORT;
const API_KEY = process.env.API_KEY;
/* const DB_USER;
const DB_PASS */


app.use(session);
app.set("view engine", "ejs");
app.use(require("express").static("public"));
app.use(require("express").urlencoded({ extended: true }));

app.get("/", (req, res) => {

});


http.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
}); 