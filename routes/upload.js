const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fileName = { link: "" };
const db = require("../DB");
const fs = require("fs");
let errors = [];
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    const localFile = `${Math.random().toString(36).substring(2, 15)}${path
      .extname(file.originalname)
      .toLowerCase()}`;
    cb(null, localFile);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    var filetypes = /pdf|txt|doc|docx|odt|rtf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(
      "Error: File upload only supports the " +
        "following filetypes - " +
        filetypes
    );
  },
}).single("file");

router.get("/submitFile", (req, res) => {
  res.render("submitFile", {
    title: "Submit Paper",
    authorised: req.session.authorised,
    id: req.session.uid,
    conf_id: req.query.conf_id,
  });
});

router.post("/submitFile", upload, (req, res) => {
  if (!req.file) {
    res.send("atleast upload a single file");
  } else {
    fileName.name = req.file.originalname;
    fileName.link = `${req.file.filename}`;
    const authors = {
      names:
        typeof req.body.author_name == "undefined" ? "" : req.body.author_name,
      emails: typeof req.body.email == "undefined" ? "" : req.body.email,
    };
    const data = JSON.stringify(authors);

    // store information about authors in data folder in .json format

    // const authorPath = path.join(__dirname, "../data/");
    // if (authors.names.length > 0) {
    //   fs.writeFile(`${authorPath}/${fileName.link}.json`, data, (err) => {
    //     if (err) {
    //       console.log("error while writing authors in data directory");
    //     }
    //   });
    // }

    // insert the file details into mysql
    const sqlQuery = `call submit_paper(?,?,?,?,?,?,?)`;
    const conf_id = parseInt(req.query.conf_id);
    const values = [
      req.body.paper_title,
      req.body.topic,
      req.session.uid,
      req.body.abstract,
      fileName.link,
      conf_id,
      data,
    ];
    db.query(sqlQuery, values, (err, results, fields) => {
      if (err) {
        errors.push(err.message);
        console.log("errors found in sql");
        return;
      } else {
        res.redirect(`/?id=${req.session.uid}`);
        return;
      }
    });
  }
});

errors = [];

module.exports = router;
