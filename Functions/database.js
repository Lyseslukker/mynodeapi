const mysql = require('mysql2')
const chalk = require("chalk")
const bcrypt = require("bcrypt")

const pool = mysql.createPool({
    host: '192.168.1.234',
    user: 'lyseslukker',
    password: 'Jegersej123',
    database: 'raspSQL',
    waitForConnections: true,
    connectionLimit: 50,
    queueLimit: 50
})


// const saltRounds = 10

// const hashPassword = (password) => {
//     bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
//         if (err) {
//             console.log("Handle this error")
//         }
//         if (hashedPassword) {
//             // Here, hashedPassword is the salted and hashed version of userPassword
//             // You would typically store this value in your database
//             console.log(hashedPassword)
//         }
//     })
// }


// const createUser = () => {
//     const sql = 'INSERT INTO users (email, password, iv) VALUES (?, ?, ?)';
    
//     pool.query(sql, [email, password, iv], (error, results) => {
//       if (error) throw error;
//       console.log(results);
//     });
// }


// const createUser = (email, password, iv) => {
//     const sql = 'INSERT INTO users (email, password, iv) VALUES (?, ?, ?)';
    
//     pool.query(sql, [email, password, iv], (error, results) => {
//         if (error) {
//             console.log(error)
//         }
//         console.log(results);
//     });
// }


// const findUser = (userEmail) => {
//     const sql = 'SELECT * FROM users WHERE email = ?';
    
//     pool.query(sql, [userEmail], (error, results) => {
//         if (error) {
//             console.log(error)
//         }
//         console.log(results[0]);
//     });
// }

module.exports = {createUser, findUser}