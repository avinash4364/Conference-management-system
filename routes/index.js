// var mysql = require('mysql');
var express = require("express");
var router = express.Router();
var db = require("../DB");
var helpers = require("../helpers");
var errors = [];

router.get("/", function (req, res, next) {
  var sqlQuery = `select email_id as name_id,user_fname as name,"" as role,user_name from user where user_id=? UNION select conf_id,conf_name, "chair",topic from conference,pc_chair,user where conf_id=chair_id and user.user_id=pc_chair.user_id and user.user_id=? UNION select request.conf_id,conf_name,role,request from conference ,request where user_id=? and conference.conf_id=request.conf_id`;
  // INNER JOIN roleofuser ON conference.conf_id=roleofuser.conf_id

  const values = [req.session.uid, req.session.uid, req.session.uid];
  db.query(sqlQuery, values, function (err, results, fields) {
    res.render("index", {
      title: "Conference Management System",
      authorised: req.session.authorised,
      id: req.session.uid,
      confs: results,
    });
  });
});

// Create conference page
router.get("/conference", function (req, res, next) {
  //var sqlQuery = `SELECT DISTINCT(conf_name) FROM conference;`;
  var sqlQuery = `SELECT user.user_fname, user.user_id FROM user`;

  db.query(sqlQuery, function (err, results, fields) {
    res.render("conference", {
      title: "Conference",
      authorised: req.session.authorised,
      id: req.session.uid,
      confs: results,
    });
  });
});

router.post("/conference", function (req, res, next) {
  if (
    !helpers.checkForm([
      req.body.confName,
      req.body.venueOfconf,
      req.body.organiserName,
      req.body.topic,
    ])
  ) {
    errors.push("Please fill in all fields!");
    next();
    return;
  }

  // , req.body.UserID

  var sqlQuery = `call insert_into_conference(?,?,?,?,?,?,?)`;
  var values = [
    req.body.confName,
    req.body.startdate,
    req.body.enddate,
    req.body.venueOfconf,
    req.body.organiserName,
    req.body.topic,
    req.query.id,
  ];

  db.query(sqlQuery, values, function (err, results, fields) {
    if (err) {
      errors.push(err.message);
      next();
      return;
    }

    if (results.affectedRows == 1) {
      res.redirect(`/?id=${req.session.uid}`);
      return;
    } else {
      errors.push(err.message);
      next();
    }
  });

  // var sqlQuery1 = `INSERT INTO roleofuser VALUES(NULL, NULL, NULL, ?)`;
  // var values1 = [req.body.userRole];
  // db.query(sqlQuery1, values1, function (err, results, fields) {

  //   if (err) {
  //     errors.push(err.message);
  //     next();
  //     return;
  //   }
  // });
});

router.post("/conference", function (req, res, next) {
  res.statusCode = 401;

  res.render("conference", {
    title: "conference",
    messages: errors,
  });

  errors = [];
});

// ======================================= Join new conference ==========

router.get("/allConfer", function (req, res, next) {
  var sqlQuery = `select distinct(conf_name),topic from conference,user,pc_chair where pc_chair.chair_id=conference.conf_id and not pc_chair.user_id=${req.session.uid} and conference.conf_id NOT IN(select c.conf_id from conference as c,request where conference.conf_id=request.conf_id and request="accepted")`;

  db.query(sqlQuery, function (err, results, fields) {
    res.render("allConfer", {
      title: "List of all conferences",
      authorised: req.session.authorised,
      id: req.session.uid,
      allConf: results,
      exist: typeof req.session.errors == "undefined" ? "" : req.session.errors,
    });
  });
});

router.post("/allConfer", function (req, res, next) {
  if (!helpers.checkForm([req.body.NameOfConf])) {
    errors.push("Please fill in all fields!");
    next();
    return;
  }

  // var sqlQuery = `INSERT INTO conference VALUES(NULL, ?, ?, ?, ?,?)`; , req.body.role,
  // var values = [req.body.confName, req.body.venueOfconf, req.body.organiserName,req.body.userRole,req.session.fname];
  // sql = insert into roleofuser (user_id, conf_id, role) select "20", conf_id, role from roleofuser where conf_id ="10";  ` + mysql.escape(req.body.role) `
  var sqlQuery = `call send_request(?,?,?)`;
  var values = [
    req.session.uid,
    req.body.NameOfConf,
    req.body.role.toLocaleLowerCase(),
  ];

  db.query(sqlQuery, values, function (err, results, fields) {
    if (err) {
      errors.push(err.message);
      next();
      return;
    }

    if (results.affectedRows == 0) {
      req.session.errors =
        "You can't request to join a conference which you created";
      res.redirect("back");
      return;
    } else if (results.affectedRows == 1) {
      res.redirect(`/?id=${req.session.uid}`);
      return;
    } else {
      errors.push(err.message);
      next();
    }
  });
});

router.post("/allConfer", function (req, res, next) {
  res.statusCode = 401;

  res.render("allConfer", {
    title: "allConfer",
    messages: errors,
  });
  delete res.session.error;
  errors = [];
});

// conference detail page
// router.get('/conf_detail', function (req, res, next) {

//   res.statusCode = 401;

//   res.render('conf_detail', {
//     title: 'conf_detail',
//     messages: errors
//   });

//   errors = [];

// });

// Function to handle the root path
router.get("/conf_detail", async function (req, res) {
  let confid = req.query.conf_id;
  // var sqlQuery = `SELECT  paper.document_name, conference.conf_name FROM paper INNER JOIN conference ON paper.conf_name=conference.conf_name where conf_id = ? UNION SELECT conference.conf_name,conference.conf_name FROM conference where conf_id = ?`;

  var sqlQuery = `select conf_name,start_date,end_date,venue from conference where conf_id=? UNION select title,topic,document_name,paper_id from paper where conf_id=? UNION select request.user_id,user_fname,role,request from request,user where conf_id=? and request="pending" and request.user_id=user.user_id UNION select "","",role,request from request where conf_id=? and user_id=? and request="accepted" UNION select "","","",paper_id from reviews where reviewer_id=? and paper_id IN(select paper_id from paper where conf_id=?)`;
  var values = [
    confid,
    confid,
    confid,
    confid,
    req.session.uid,
    req.session.uid,
    confid,
  ];
  db.query(sqlQuery, values, function (err, results, fields) {
    res.render("conf_detail", {
      title: "Conference details",
      authorised: req.session.authorised,
      id: req.session.uid,
      confs: results,
      conf_id: confid,
      isReviewer: helpers.isReviewer(results),
      papers: helpers.getPaperId(results),
    });
    console.log(results);
  });
});

router.post("/conf_detail", (req, res, next) => {
  var sql = "call update_request(?,?,?)";
  const values = [req.body.request, parseInt(req.body.id), req.query.conf_id];
  db.query(sql, values, (err, results) => {
    if (err) {
      errors.push(err.message);
      next();
      return;
    }
    if (results.affectedRows == 1) {
      res.redirect("back");
      return;
    } else {
      errors.push(err.message);
      next();
    }
  });
});

router.post("/conf_detail", function (req, res, next) {
  res.statusCode = 401;
  res.render("conf_detail", {
    title: "conf_detail",
    authorised: req.session.authorised,
    id: req.session.uid,
    messages: errors,
  });
});

router.get("/review", (req, res) => {
  const sqlquery = "select conf_id from paper where paper_id=?";
  const values = [parseInt(req.query.paper_id)];

  db.query(sqlquery, values, (err, results) => {
    res.render("review", {
      title: "Review paper",
      authorised: req.session.authorised,
      id: req.session.uid,
      confs: results,
    });
    console.log(results, values);
  });
});

router.post("/review", async (req, res, next) => {
  var sql = "call submit_review(?,?,?,?,?,?,?,?,?)";
  const conf_id = parseInt(req.body.id);
  const values = [
    req.session.uid,
    parseInt(req.query.paper_id),
    conf_id,
    parseInt(req.body.plagirism),
    req.body.relevancy,
    req.body.presentation,
    req.body.originality,
    req.body.status,
    parseInt(req.body.nominate),
  ];
  console.log(values);
  db.query(sql, values, (err, results) => {
    if (err) {
      if (err.errno == 1054) {
        errors.push(
          "You can't review this paper. You are not a reviewer of this conference"
        );
      }
      next();
      return;
    } else {
      res.redirect(`/conf_detail?conf_id=${conf_id}}`);
      return;
    }
  });
});

router.post("/review", function (req, res, next) {
  res.statusCode = 401;
  res.render("review", {
    title: "Review paper",
    authorised: req.session.authorised,
    id: req.session.uid,
    messages: errors,
  });
  errors = [];
});

errors = [];

module.exports = router;
