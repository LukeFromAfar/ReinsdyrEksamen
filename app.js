const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const path = require('path');
const fileUpload = require('express-fileupload');
const authenticateUser = require('./middleware/authenticateUser');

const app = express();
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));

app.use(fileUpload({
    createParentPath: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(process.env.MONGODB_URI, {});


const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);


const profileRoutes = require('./routes/profileRoutes');
app.use('/profile', profileRoutes);



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


// app.get('/profile', authenticateUser, (req, res) => {
//     res.render('profilePage', { title: 'Profile', user: req.user });
// });

// app.get('/profile/register-flokk', authenticateUser, (req, res) => {
//     res.render('registerFlokk', { title: 'Registrer flokk', user: req.user });
// });

// app.get('/profile/register-rein', authenticateUser, (req, res) => {
//     res.render('registerRein', { title: 'Registrer reinsdyr', user: req.user });
// });

app.listen(process.env.PORT);