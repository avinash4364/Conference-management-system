function validateEmail(email) {
  var re = /\S+@\S+\.\S+/;
  return re.test(email) && email != undefined;
}

function loginChecker(req, res, next) {
  if (req.session.authorised) {
    res.redirect("/");
    return;
  } else {
    next();
    return;
  }
}

function checkForm(fields) {
  for (var i = 0; i < fields.length; i++) {
    var currElement = fields[i];

    if (currElement == undefined || currElement == "") {
      return false;
    }
  }
  return true;
}

function isReviewer(result) {
  let flag = false;
  for (const detail of result) {
    if (detail.end_date == "reviewer" && detail.venue == "accepted") {
      flag = true;
    }
  }
  return flag;
}

function getPaperId(result) {
  const reviewer = [];
  const arr = [];
  const arr1 = [];
  for (const detail of result) {
    if (detail.end_date.includes(".pdf")) {
      arr.push(detail.venue);
    }
    if (detail.end_date == "") {
      arr1.push(detail.venue);
    }
  }
  for (let i = 0; i < arr.length; i++) {
    if (!arr1.includes(arr[i])) {
      reviewer.push(arr[i]);
    }
  }
  console.log(reviewer);
  return reviewer;
}

module.exports.isReviewer = isReviewer;

module.exports.getPaperId = getPaperId;

module.exports.checkForm = checkForm;

module.exports.loginChecker = loginChecker;

module.exports.validateEmail = validateEmail;
