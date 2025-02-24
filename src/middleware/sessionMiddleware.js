const session = require('express-session');
require('dotenv').config();


const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true, maxAge: 24*60*60*1000 }
});

module.exports = sessionMiddleware;