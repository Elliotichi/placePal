/**
 * PlacePal's web server.
 *
 * To run: npm start
 *
 */
// Database and connection information
const PORT = process.env.PORT,
  MICROSERVICE_PORT = process.env.MICROSERVICE_PORT,
  DB_CONN_STRING = process.env.DB_CONN_STRING,
  DB_NAME = process.env.DB_NAME;

let db;

// Dependencies
const app = require("express")(),
  /* Session management & routing */
  express = require("express"),
  http = require("http").Server(app),
  session = require("express-session")({
    secret: "secrets",
    resave: true,
    saveUninitialized: true,
  }),
  flash = require("connect-flash"),
  { renderLogin, renderHomepage } = require("./render"),
  /* Database and security management*/
  crypto = require("crypto"),
  MongoClient = require("mongodb-legacy").MongoClient,
  client = new MongoClient(DB_CONN_STRING),
  { body, validationResult } = require("express-validator"),
  sanitizeHTML = require("sanitize-html"),
  /* CV analyzer */
  FormData = require("form-data"),
  axios = require("axios"),
  path = require("path"),
  mammoth = require("mammoth"),
  multer = require("multer"),
  fs = require("fs");

/* Configuration of multer and temporary storage*/
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
/* Temporary storage is ./uploads/ - new files will have random names generated */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
      cb(
        null,
        `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
          file.originalname
        )}`
      );
    },
  }),
  /* File format filter */
  fileFilter = (req, file, cb) => {
    if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      req.fileValidationError = "Only .docx files are allowed";
    }
  },
  /* Create multer with the above options */
  upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
  });

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
  return renderLogin(res, {
    success: req.flash("success"),
    failure: req.flash("failure"),
  });
});

app.post(
  "/register",
  [
    [
      body("email").isEmail().trim(),
      body("password").notEmpty().trim(),
      body("role").notEmpty().trim(),
    ],
  ],
  async (req, res) => {
    if (!db) {
      res.redirect("/");
      req.session.loggedIn = false;
      return;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("failure", "Invalid username or password");
      return res.redirect("/login");
    }

    const hash = crypto
      .createHash("sha256")
      .update(req.body.password)
      .digest("hex");
    var user_to_add = {
      email: req.body.email,
      pass_hash: hash,
      role: req.body.role,
    };

    db.collection("users").insertOne(user_to_add, (err) => {
      if (err) throw err;
      req.flash("success", "Successfully registered!");
      return res.redirect("/login");
    });
  }
);

/**
 * Login route
 * Validate that the email
 */
app.post(
  "/login",
  [[body("email").isEmail(), body("password").notEmpty()]],
  async (req, res) => {
    if (!db) {
      res.redirect("/");
      req.session.loggedIn = false;
      return;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return renderLogin(res, { failure: "Invalid username or password" });
    }

    db.collection("users").findOne({ email: req.body.email }, (err, result) => {
      if (err) throw err;
      
      if (!result) {
        return renderLogin(res, {
          failure: "Invalid username or password",
        });
      }

      if (
        crypto.createHash("sha256").update(req.body.password).digest("hex") ===
        res.pass_hash
      ) {
        req.session.loggedin = true;
        req.session.uname = result.user;
        return res.redirect(303, "/");
      }
    });
  }
);

/**
 * CV analyzer route
 */
app.post("/analyze", upload.single("document"), async (req, res) => {
  /* Make sure the user supplied a file in the request */
  try {
    if (!req.file) {
      // return renderAnalyzer({error: "Please upload a .docx file"}); //< Placeholder for once upload page is created
      return res.status(400).json({ error: "Please upload a .docx file" });
    }

    const wordDocPath = req.file.path;
    try {
      /* Parse text + sanitize HTML */
      const fileData = await fs.promises.readFile(wordDocPath);
      const parsed = await mammoth.extractRawText({ buffer: fileData });
      const extractedText = sanitizeHTML(parsed.value, {
        allowedTags: [],
        disallowedTagsMode: "recursiveEscape",
      });

      /* Temporary buffer */
      const textFilePath = path.join(
        uploadDir,
        `${path.basename(wordDocPath, path.extname(wordDocPath))}.txt`
      );
      fs.writeFileSync(textFilePath, extractedText, "utf8");

      /* Turn into form data */
      let newForm = new FormData();
      newForm.append("file", fs.createReadStream(textFilePath));

      /* Send to python microservice */
      const microserviceResult = await axios.post(
        `http://localhost:${MICROSERVICE_PORT}/process`,
        newForm,
        {
          headers: {
            ...newForm.getHeaders(),
          },
        }
      );

      /* Cleanup */
      fs.unlinkSync(wordDocPath);
      fs.unlinkSync(textFilePath);

      /* Return the result */
      res.json(microserviceResult.data);
    } /* Catch errors with the filesystem */ catch (error) {
      if (fs.existsSync(wordDocPath)) {
        fs.unlinkSync(wordDocPath);
      }
      throw error;
    }
  } catch (error) {
    /* Catch errors with the processing
  This will usually throw when the uploaded CV is a valid .docx file, but it is empty */
    console.error(error);
    res
      .status(500)
      .json({
        error:
          "Something went wrong while analyzing your CV. Please try again.",
      });
  }
});

/*
 * DATABASE CONNECT
 * Wait until a databse connection is established. If there is an error, log it in the server console
 */
const connectDB = async () => {
  try {
    // Use connect method to connect to the server
    await client.connect();
    console.log("Connected successfully to MongoDB Atlas");
    db = client.db(DB_NAME);
  } catch (err) {
    console.log(err);
  }
};

connectDB();

http.listen(PORT, () => console.log(`Listening on ${PORT}`));
