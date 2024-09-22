const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
app.use(express.json());
const Usermodel = require("./models/user");
const employee = require("./models/employee");
const bcrypt = require("bcrypt");
const path = require("path");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const { timeStamp } = require("console");
const upload = require("./utils/multer").single("fileUpload");

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/signup", async (req, res) => {
  let { username, email, password } = req.body;
  let user = await Usermodel.findOne({ username: username, email: email });
  if (user) {
    return res.send("username or email already exists");
  }
  bcrypt.genSalt(10, function (err, salt) {
    bcrypt.hash(password, salt, async function (err, hash) {
      const usercreated = await Usermodel.create({
        username,
        email,
        password: hash,
      });

      let token = jwt.sign({ email }, "shdadacad");
      res.cookie("token", token);
      res.redirect("/login");
    });
  });
});

app.get("/login", (req, res) => {
  res.render("index");
});

app.post("/login", async (req, res) => {
  let user = await Usermodel.findOne({ username: req.body.username });
  if (!user) return res.send("something went wrong");
  bcrypt.compare(req.body.password, user.password, function (err, result) {
    if (result === true) {
      let token = jwt.sign({ username: user.username }, "shdadacad");
      res.cookie("token", token);
      res.redirect("/profile");
    } else {
      res.send(console.log("email or password is wrong"));
    }
  });
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/");
});

function isLoggedIn(req, res, next) {
  if (req.cookies.token) {
    jwt.verify(req.cookies.token, "shdadacad", function (err, decoded) {
      if (err) {
        res.redirect("/");
      } else {
        next();
      }
    });
  } else {
    res.redirect("/");
  }
}

app.get("/profile", isLoggedIn, async (req, res) => {
  const user = await Usermodel.findOne();
  let employe = await employee.find();
  res.render("profile", { users: employe, user: user });
});
app.get("/createEmployee", (req, res) => {
  res.render("createEmployee");
});

app.post("/createEmployee", function (req, res, next) {
  upload(req, res, async function (err) {
    if (err) throw err;
    try {
      const Media = new employee({
        Unique: req.body.unique,
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        designation: req.body.designation,
        gender: req.body.gender,
        courses: req.body.courses,
        fileUpload: req.file.filename,
        hireDate: new Date(),
      });

      await Media.save();
      res.redirect("/profile");
    } catch (error) {
      res.send(error);
    }
  });
});

app.get("/edit/:id", isLoggedIn, async (req, res) => {
  try {
    const user = await employee.findById(req.params.id);
    if (!user) return res.status(404).send("User not found");
    res.render("edit", { user });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

const uploads = require("./utils/multer").single("fileUpload");

app.post("/edit/:id", isLoggedIn, (req, res) => {
  uploads(req, res, async function (err) {
    if (err) {
      return res.status(500).send("Error uploading file");
    }

    try {
      const { name, email, mobile, designation, gender, courses } = req.body;

      const updatedData = {
        name,
        email,
        mobile,
        designation,
        gender,
        courses,
      };

      if (req.file) {
        updatedData.fileUpload = req.file.filename;
      }

      await employee.findByIdAndUpdate(req.params.id, updatedData);
      res.redirect("/profile");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  });
});

app.get("/delete/:id", isLoggedIn, async (req, res) => {
  try {
    await employee.findByIdAndDelete({ _id: req.params.id });
    res.redirect("/profile");
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

app.get("/search", isLoggedIn, async (req, res) => {
  const keyword = req.query.keyword;

  try {
    let employees;

    if (keyword) {
      // Fetch employees matching the keyword in their name or email
      employees = await employee.find({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { email: { $regex: keyword, $options: "i" } },
        ],
      });
    } else {
      // If no keyword, fetch all employees
      employees = await employee.find();
    }

    const user = await Usermodel.findOne();
    res.render("profile", { users: employees, user: user });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

app.listen(3000);
