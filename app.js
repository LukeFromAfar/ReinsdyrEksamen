const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));

mongoose.connect(process.env.MONGODB_URI, {});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
    res.render('index', {title: 'Home'});
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


app.listen(process.env.PORT);