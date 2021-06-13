var express = require("express");
var router = express.Router();
var db = require("../DB");
var helpers = require("../helpers");
var errors = [];

router.get("/register", helpers.loginChecker, function (req, res, next) {
  res.render("register", {
    title: "Register",
  });
});

// country and phone no. not compulsory

router.post("/register", helpers.loginChecker, function (req, res, next) {
  if (
    !helpers.checkForm([
      req.body.email,
      req.body.psw,
      req.body.pswrepeat,
      req.body.fname,
      req.body.username,
    ])
  ) {
    errors.push("Please fill in all fields!");
    next();
    return;
  }

  if (!helpers.validateEmail(req.body.email)) {
    errors.push("Please enter a valid email address!");
    next();
    return;
  }

  if (req.body.psw !== req.body.pswrepeat) {
    errors.push("Passwords are not equal!");
    next();
    return;
  }

  if (req.body.phone.length !== 10) {
    errors.push("Enter a valid phone no.(of length 10)");
    next();
    return;
  }
  var sqlQuery = `INSERT INTO user (password,user_name,user_fname,email_id,phone_no,country) VALUES(MD5(?),?,?,?,?,?)`;
  var values = [
    req.body.psw,
    req.body.username,
    req.body.fname,
    req.body.email,
    parseInt(req.body.phone),
    req.body.country,
  ];
  db.query(sqlQuery, values, function (err, results, fields) {
    if (err) {
      errors.push(err.message);
      next();
      return;
    }

    if (results.affectedRows == 1) {
      res.redirect("/login");
      return;
    } else {
      errors.push(err.message);
      next();
    }
  });
});

router.post("/register", function (req, res, next) {
  res.statusCode = 401;

  res.render("register", {
    title: "Register",
    messages: errors,
  });

  errors = [];
});

router.get("/login", helpers.loginChecker, function (req, res, next) {
  res.render("login", {
    title: "Login",
  });
});

router.post("/login", function (req, res, next) {
  if (!helpers.checkForm([req.body.emailorusername, req.body.psw])) {
    errors.push("Please fill in all fields!");
    next();
    return;
  }

  if (helpers.validateEmail(req.body.emailorusername)) {
    var sqlQuery = `SELECT * FROM user WHERE email_id = ? AND password = MD5(?)`;
    var values = [req.body.emailorusername, req.body.psw];

    db.query(sqlQuery, values, function (err, results, fields) {
      if (err) {
        errors.push(err.message);
        next();
        return;
      }

      if (results.length == 1) {
        req.session.authorised = true;
        req.session.uid = results[0].user_id;
        res.redirect(`/?id=${results[0].user_id}`);
        return;
      } else {
        errors.push("The email or password is incorrect.");
        next();
      }
    });
  } else {
    var sqlQuery2 = `SELECT * FROM user WHERE user_name = ? AND password = MD5(?)`;
    var values = [req.body.emailorusername, req.body.psw];

    db.query(sqlQuery2, values, function (err, results, fields) {
      if (err) {
        errors.push(err.message);
        next();
        return;
      }

      if (results.length == 1) {
        req.session.authorised = true;
        req.session.uid = results[0].user_id;
        res.redirect(`/?id=${results[0].user_id}`);
        return;
      } else {
        errors.push("The username or password is incorrect.");
        next();
      }
    });
  }
});

router.post("/login", function (req, res, next) {
  res.statusCode = 401;

  res.render("login", {
    title: "Login",
    messages: errors,
  });

  errors = [];
});

router.get("/exit", function (req, res, next) {
  req.session.destroy(function (err) {
    res.redirect("/");
  });
});

errors = [];

module.exports = router;
