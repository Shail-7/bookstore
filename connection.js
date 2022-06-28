const mysql = require("mysql2");
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Ordex@123",
    database:"bookstore",
    port: 3306
});

con.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("Connection Established!");
    }
});

module.exports.con=con;

