const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "localhost",
  user: "avinash",
  password: "Demo@4364",
  database: "CMS",
});

// connection.connect(function(err) {
//   if (err) throw err;
//   connection.query("SELECT * FROM conference", function (err, result, fields) {
//     if (err) throw err;
//     console.log(result);
//   });
// });

module.exports = connection;
// module.exports = mysql.escape;
