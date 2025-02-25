const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const path = require('path');
const fileUpload = require('express-fileupload');
const authenticateUser = require('./middleware/authenticateUser');

const Flokk = require('./models/FlokkSchema');
const Eier = require('./models/EierSchema');
const Reinsdyr = require('./models/ReinsdyrSchema');
const Beiteomraade = require('./models/BeiteomradeSchema');

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



app.get(['/', '/index'], async (req, res) => {
    try {
        const search = req.query.search || '';
        const regex = new RegExp(search, 'i');
        const numberSearch = isNaN(search) ? null : Number(search);

        // Search for Flokk
        const flokker = await Flokk.find({
            $or: [
                { navn: regex },
                { buemerkeNavn: regex },
                { serieinndeling: regex }
            ]
        }).populate('eier');

        // Get IDs of matching flokker
        const flokkIds = flokker.map(f => f._id);

        // Search for Reinsdyr, including those in matching flokker
        const reinsdyr = await Reinsdyr.find({
            $or: [
                { navn: regex },
                { serienummer: regex },
                { flokk: { $in: flokkIds } }
            ]
        }).populate('flokk');

        // Get IDs of matching reinsdyr's flokker
        const reinsdyrFlokkIds = reinsdyr.map(r => r.flokk._id);

        // Combine flokk IDs
        const allFlokkIds = [...new Set([...flokkIds, ...reinsdyrFlokkIds])];

        // Search for Eier, including those related to matching flokker
        const eiere = await Eier.find({
            $or: [
                { navn: regex },
                { epost: regex },
                { kontaktsprak: regex },
                { telefonnummer: numberSearch },
                { _id: { $in: flokker.map(f => f.eier).flat() } }
            ]
        });

        // Get all flokker related to found eiere
        const eierFlokker = await Flokk.find({ eier: { $in: eiere.map(e => e._id) } });

        // Combine all unique flokk IDs
        const finalFlokkIds = [...new Set([...allFlokkIds, ...eierFlokker.map(f => f._id)])];

        // Final queries to get all related data
        const finalFlokker = await Flokk.find({ _id: { $in: finalFlokkIds } }).populate('eier');
        const finalReinsdyr = await Reinsdyr.find({ flokk: { $in: finalFlokkIds } }).populate('flokk');
        const finalEiere = await Eier.find({ _id: { $in: finalFlokker.map(f => f.eier).flat() } });

        const beiteomraader = await Beiteomraade.find({
            $or: [
                { beiteomraade: regex },
                { fylker: regex }
            ]
        });

        const groupedResults = {
            Flokk: finalFlokker.map(f => ({ ...f.toObject() })),
            Reinsdyr: finalReinsdyr.map(r => ({ ...r.toObject() })),
            Eier: finalEiere.map(e => ({ ...e.toObject() })),
            Beiteområde: beiteomraader.map(b => ({ ...b.toObject() }))
        };

        res.render('index', { title: "Hjem", groupedResults, search });
    } catch (err) {
        console.error('Error in route handler:', err);
        res.status(500).send('Server error');
    }
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