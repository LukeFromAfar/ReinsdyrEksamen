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



app.get(['/'], async (req, res) => {
    try {
        const search = req.query.search || '';
        
        // If search is empty, just show empty results
        if (!search.trim()) {
            return res.render('index', { 
                title: "Hjem", 
                groupedResults: {
                    Flokk: [],
                    Reinsdyr: [],
                    Eier: [],
                    Beiteområde: []
                }, 
                search 
            });
        }
        
        const regex = new RegExp(search, 'i');
        const numberSearch = !isNaN(search) ? Number(search) : null;

        // Try to parse date from search
        let dateSearch = null;
        
        // Common date formats: DD.MM.YYYY, YYYY-MM-DD, etc.
        const dateParts = search.match(/^(\d{1,2})[.-/](\d{1,2})[.-/](\d{2,4})$/);
        if (dateParts) {
            // Norwegian format DD.MM.YYYY is commonly used
            const day = parseInt(dateParts[1]);
            const month = parseInt(dateParts[2]) - 1; // JS months are 0-indexed
            const year = parseInt(dateParts[3]);
            const fullYear = year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year;
            
            const date = new Date(fullYear, month, day);
            if (!isNaN(date.getTime())) {
                dateSearch = date;
            }
        }

        // Search for each entity type directly
        const flokker = await Flokk.find({
            $or: [
                { navn: regex },
                { buemerkeNavn: regex },
                { serieinndeling: regex }
            ]
        }).populate('eier');

        // Build reinsdyr query
        let reinsdyrQuery = {
            $or: [
                { navn: regex },
                { serienummer: regex }
            ]
        };
        
        // Add date search if valid date found
        if (dateSearch) {
            // Create date range for the whole day (start to end)
            const startDate = new Date(dateSearch);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(dateSearch);
            endDate.setHours(23, 59, 59, 999);
            
            reinsdyrQuery.$or.push({ 
                fodselsdato: { 
                    $gte: startDate, 
                    $lte: endDate 
                } 
            });
        }
        
        const reinsdyr = await Reinsdyr.find(reinsdyrQuery).populate('flokk');

        // Handle the telefonnummer field correctly for number type
        let eierQuery = {
            $or: [
                { navn: regex },
                { epost: regex },
                { kontaktsprak: regex }
            ]
        };
        
        // Only add telefonnummer to query if search is a valid number
        if (numberSearch !== null) {
            eierQuery.$or.push({ telefonnummer: numberSearch });
        }
        
        const eiere = await Eier.find(eierQuery);

        const beiteomraader = await Beiteomraade.find({
            $or: [
                { beiteomraade: regex },
                { fylker: regex }
            ]
        });

        const groupedResults = {
            Flokk: flokker.map(f => ({ ...f.toObject() })),
            Reinsdyr: reinsdyr.map(r => ({ ...r.toObject() })),
            Eier: eiere.map(e => ({ ...e.toObject() })),
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