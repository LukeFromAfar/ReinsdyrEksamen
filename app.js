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

app.get('/api/search', async (req, res) => {
    const searchTerm = req.query.term.toLowerCase();
    
    try {
        const flokker = await Flokk.find({
            $or: [
                { navn: { $regex: searchTerm, $options: 'i' } },
                { buemerkeNavn: { $regex: searchTerm, $options: 'i' } },
                { serieinndeling: { $regex: searchTerm, $options: 'i' } }
            ]
        });

        const reinsdyr = await Reinsdyr.find({
            $or: [
                { navn: { $regex: searchTerm, $options: 'i' } },
                { serienummer: { $regex: searchTerm, $options: 'i' } }
            ]
        }).populate('flokkId');

        const results = [
            ...flokker.map(f => ({ type: 'flokk', name: f.navn, buemerkeNavn: f.buemerkeNavn })),
            ...reinsdyr.map(r => ({ type: 'reinsdyr', name: r.navn, serienummer: r.serienummer, flokkNavn: r.flokkId.navn }))
        ];

        res.json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'An error occurred while searching' });
    }
});



app.listen(process.env.PORT);