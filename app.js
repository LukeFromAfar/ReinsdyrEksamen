const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(process.env.MONGODB_URI, {});



const authRoutes = require('./routes/authRoutes');
const authenticateUser = require('./middleware/authenticateUser');
app.use('/auth', authRoutes);
app.use(authenticateUser)

app.get('/', (req, res) => {
    res.render('index', {title: 'Home'});
    res.send(`Server running on port ${process.env.PORT}`);
});

app.get('/FAQ', (req, res) => {
    res.render('faq', {title: 'FAQ'});
});

app.get('/map', (req, res) => {
    res.render('map', {title: 'Kart'});
});

app.get('/database', (req, res) => {
    res.render('database', {title: 'Database'});
});

app.get('/profile', authenticateUser, (req, res) => {
    res.render('profilePage', { title: 'Profile', user: req.user });
});


app.listen(process.env.PORT);