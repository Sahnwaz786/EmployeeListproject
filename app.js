const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
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
      res.redirect("/profile");
    });
  });
});

app.get("/login", (req, res) => {
  res.render("index");
});

app.get("/employlist", isLoggedIn, (req, res) => {
  res.render("employeelist");
});

app.get("/signup", (req, res) => {
  res.render("index");
});

app.post("/login", async (req, res) => {
  let user = await Usermodel.findOne({ username: req.body.username });
  if (!user) return res.send("something went wrong");
  bcrypt.compare(req.body.password, user.password, function (err, result) {
    // result == true
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
  console.log("you have loggedout");
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
app.get("/createuser", (req, res) => {
  res.render("createUser");
});

app.post("/createuser", function (req, res, next) {
  upload(req, res, async function (err) {
    if (err) throw err;
    try {
      const Media = new employee({
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        designation: req.body.designation,
        gender: req.body.gender,
        courses: req.body.courses,
        fileUpload: req.file.filename,
        hireDate: new Date("2023-09-20"),
      });
      await Media.save();
      res.redirect("/profile");
    } catch (error) {
      res.send(error);
    }
  });
});

app.listen(3000);
