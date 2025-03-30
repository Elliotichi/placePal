/**
 * @file server.js
 * @author saul and the goodmans
 * @brief NodeJS server for backend of placePal. Routes for login, register, navigation, search, upload, etc.
 * @TODO <listed in each route's comments>
 * 
 */

/************************************************* SERVER CONFIGURATION  ************************************************/
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
        `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
      );
    },
  }),
  /* File format filter */
  fileFilter = (req, file, cb) => {
    if (
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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

/***************************************************** ROUTES  *****************************************************/

app.get("/", (req, res) => {
  /**
   * @brief Root route. Homepage if logged in, login if not logged in.
   */
  if (req.session.loggedIn) {
    return renderHomepage(res);
  } else {
    return renderLogin(res, {
      success: req.flash("success"),
      failure: req.flash("failure"),
    });
  }
});

app.get("/login", (req, res) => {
  return renderLogin(res, {
    success: req.flash("success"),
    failure: req.flash("failure"),
  });
});

app.post(
  "/register",
  /**
   * @brief registration route. Validate and add to DB.
   * @TODO nothing
   */
  [
    [
      body("registeremail").isEmail().trim(),
      body("registerpassword").notEmpty().trim(),
      body("registerrole").notEmpty().trim(),
    ],
  ],
  async (req, res) =>  {
    if (!db) {
      return res.redirect(303, "/");
      req.session.loggedIn = false;
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("failure", "Invalid selection!");
      return res.redirect(303, "/");
    }

    const hash = crypto.createHash("sha256").update(req.body.registerpassword).digest("hex");
    let user_to_add = {
      email: req.body.registeremail,
      pass_hash: hash,
      role: req.body.registerrole,
    };

    db.collection("users").insertOne(user_to_add, (err) => {
      req.flash("success", "Successfully registered!");
      return res.redirect(303, "/");
    });
  }
);

app.get("/logout", (req, res)=> {
  /**
   * @brief Logout route.
   */
  req.session.loggedIn = false;
  return res.redirect("/");
})

app.post(
  "/login",
  /**
   * @brief Login route. Validates form inputs, searches DB for pass hash match, logs in.
   * @TODO conditional rendering of stuff based on agency vs student (e.g. "Add Placement" button)
   */

  /* Validation rules */
  [
    [
      body("loginemail").isEmail(),
      body("loginpassword").notEmpty(),
      body("userType").matches(/^(student|agency)$/),
    ],
  ],
  async (req, res) => {
    /* DB conn fail */
    if (!db) {
      return res.redirect(303, "/");
      req.session.loggedIn = false;
      return;
    }

    /* Validation middleware fail */
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("failure", "Invalid username, password or user role.");
      return res.redirect(303, "/");
    }

    /* Query */
    db.collection("users").findOne({ email: req.body.loginemail }, (err, result) => {
      if (err) throw err;

      /* No result - send them back */
      if (!result) {
        req.flash("failure", "Invalid credentials");
        return res.redirect(303, "/");
      }

      /* Role checks */
      let claimedRole = req.body.userType;
      if (claimedRole !== result.role) {
        req.flash("failure", "Invalid credentials");
        return res.redirect(303, "/");
      }
      req.session.isAgency = result.role === "agency" ? true : false;

      /* Password check */
      let validPass = false;
      if (
        crypto.createHash("sha256").update(req.body.loginpassword).digest("hex") ===
        result.pass_hash
      ) {
        /* Send to homepage */
        validPass = true;
        req.session.loggedIn = true;
        req.session.uname = result.email;
        return res.redirect(303, "/");
      } else {
        req.session.loggedIn = false;
        req.flash("failure", "Invalid credentials");
        return res.redirect(303, "/");
      }
    });
  }
);

app.post("/search", async (req, res) => {
  /**
   * @brief Search route: builds a mongodb aggregation pipeline and queries DB, returning JSON of results
   * @TODO tag-based matching
   */
  try {
    const title = req.body.title;
    const jobType = req.body.placementType ?? "any";
    const location = req.body.location === "" ? "any" : req.body.location;
    const pipeline = [];

    /* Pipeline: use the pre-existing "text" DB index to match in diff fields */
    if (title && title.trim() !== "") {
      pipeline.push({
        $search: {
          index: "text",
          text: {
            query: title,
            path: ["title", "description", "responsibilities", "requirements"],
          },
        },
      });
      /* If the title is empty, find everything (e.g. at a given location/placement type) */
    } else {
      pipeline.push({ $match: {} });
    }

    /* If a location is given add it to pipeline */
    if (location && location !== "any") {
      pipeline.push({
        $match: {
          location: { $regex: location, $options: "i" },
        },
      });
    }

    /* If there's a placement type given, add to pipeline */
    if (jobType && jobType !== "any") {
      pipeline.push({
        $match: { job_type: { $regex: jobType, $options: "i" } },
      });
    }

    /* Make the query */
    const results = await db.collection("placements").aggregate(pipeline).toArray();

    /* Send back as json */
    res.json(results);
  } catch (error) {
    return res.redirect(303, "/");
  }
});

app.post("/analyze", upload.single("document"), async (req, res) => {
  /**
   * @brief CV analyzer. Validates CV file, sanitizes and sends contents to microservice for processing/analysis.
   * @TODO other file formats?
   */
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
    res.status(500).json({
      error: "Something went wrong while analyzing your CV. Please try again.",
    });
  }
});

/***************************************************** DATABASE CONN *****************************************************/

const connectDB = async () => {
  /**
   * @brief Database connector. Keeps a connection open due to frequency of requests.
   * @TODO nuffin
   */
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB Atlas");
    db = client.db(DB_NAME);
  } catch (err) {
    console.log(err);
  }
};

connectDB();

/***************************************************** SERVER START *****************************************************/

http.listen(PORT, () => console.log(`Listening on ${PORT}`));
