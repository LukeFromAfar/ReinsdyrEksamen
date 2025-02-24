const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');


const sessionMiddleware = require('./middleware/sessionMiddleware');

const app = express();
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(sessionMiddleware);

const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
    res.render('pages/index', {title: 'Home'});
});

app.get('/login', (req, res) => {
    res.render('pages/login', {title: 'Login'});
});

app.get('/register', (req, res) => {
    res.render('/register', {title: 'Register'});
});

app.listen(process.env.PORT);