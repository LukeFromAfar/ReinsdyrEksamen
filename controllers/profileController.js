const Rein = require('../models/ReinsdyrSchema');
const Flokk = require('../models/FlokkSchema');
const Beiteomraade = require('../models/BeiteomradeSchema');
const  authenticateUser  = require('../middleware/authenticateUser');

const path = require('path');
const fs = require('fs').promises;

const { get } = require('mongoose');


const profileController = {
    renderProfile: async (req, res) => {
        try {
            console.log('User in profile render:', req.user);
            
            if (!req.user || !req.user.id) {
                console.log('User not authenticated properly in profile render');
                return res.redirect('/auth/login');
            }
            
            // Fetch flocks for this user
            const flokker = await Flokk.find({ eier: req.user.id })
                .populate('beiteomraader');
                
            console.log('Found flocks for user:', flokker.length);
            
            res.render('profilePage', { 
                title: 'Profile',
                flokker: flokker 
            });
        } catch (error) {
            console.error('Feil ved rendering av profile:', error);
            res.status(500).render('error', { message: 'Serverfeil ved lasting av profile' });
        }
    },
    getFlokkDetails: async (req, res) => {
        try {
            const flokkId = req.params.id;
            
            // Find the flokk and populate related data
            const flokk = await Flokk.findById(flokkId)
                .populate('beiteomraader');
                
            // Find all reindeer in this flock
            const reinsdyr = await Rein.find({ flokk: flokkId });
            
            if (!flokk) {
                return res.status(404).render('error', { message: 'Flokk ikke funnet' });
            }
            
            // Check if the logged-in user owns this flokk
            if (!flokk.eier.includes(req.user.id)) {
                return res.status(403).render('error', { message: 'Du har ikke tilgang til denne flokken' });
            }
            
            res.render('flokkDetails', { 
                title: flokk.navn,
                flokk: flokk,
                reinsdyr: reinsdyr
            });
        } catch (error) {
            console.error('Feil ved henting av flokkdetaljer:', error);
            res.status(500).render('error', { message: 'Serverfeil ved henting av flokkdetaljer' });
        }
    },
    renderRegisterFlokk: async (req, res) => {
        try {
            res.render('registerFlokk', { title: 'Registrer flokk' });
        } catch (error) {
            console.error('Feil ved rendering av flokkregistreringsside:', error);
        }
    },
    renderRegisterRein: async (req, res) => {
        try {
            res.render('registerRein', { title: 'Registrer reinsdyr' });
        } catch (error) {
            console.error('Feil ved rendering av reinsdyrregistreringsside:', error);
        }
    },
    registerFlokk: async (req, res) => {
        try {
            // console.log('========= Register Flokk Function Start =========');
            // console.log('Full Request Keys:', Object.keys(req));
            // console.log('Request User Object:', req.user);
            
            if (!req.user || !req.user.id) {
                console.log('User not authenticated or no user ID found');
                return res.status(401).json({ msg: "Bruker ikke autentisert" });
            }
            
            // Handle file upload
            let buemerkeBildePath = '';
            if (req.files && req.files.buemerkeBilde) {
                const buemerkeBilde = req.files.buemerkeBilde;
                const fileName = Date.now() + '-' + buemerkeBilde.name;
                buemerkeBildePath = path.join('public', 'uploads', fileName);
                await buemerkeBilde.mv(path.join(__dirname, '..', buemerkeBildePath));
            }
    
            // Create Beiteomraade
            const beiteomraade = new Beiteomraade({
                beiteomraade: req.body.beiteomraadeNavn,
                fylker: Array.isArray(req.body.fylker) ? req.body.fylker : req.body.fylker.split(',').map(f => f.trim())
            });
            await beiteomraade.save();
    
            // Create Flokk with the authenticated user's ID
            const flokk = new Flokk({
                eier: [req.user.id],  // This is the critical line
                navn: req.body.flokkNavn,
                buemerkeNavn: req.body.buemerkeNavn,
                buemerkeBilde: buemerkeBildePath,
                beiteomraader: [beiteomraade._id]
            });
            
            console.log('Saving flokk with owner:', req.user.id);
            await flokk.save();
    
            res.json({ msg: 'Flokk og beiteområde registrert', flokk, beiteomraade });
        } catch (error) {
            console.error('Feil ved registrering av flokk:', error);
            res.status(500).json({ msg: "Serverfeil ved registrering av flokk", error: error.message });
        }
    },
    registerRein: async (req, res) => {
        try {
            // Check if the flokk exists
            const flokk = await Flokk.findById(req.body.flokk);
            if (!flokk) {
                return res.status(404).json({ msg: 'Flokk ikke funnet' });
            }
    
            const reinsdyr = new Rein({
                navn: req.body.navn,
                fodselsdato: req.body.fodselsdato,
                flokk: flokk._id,
            });
            await reinsdyr.save();
    
            res.json({ msg: 'Reinsdyr registrert', reinsdyr });
        } catch (error) {
            console.error('Feil ved registrering av reinsdyr:', error);
            res.status(500).json({ msg: "Serverfeil ved registrering av reinsdyr", error: error.message });
        }
    }
};

module.exports = profileController;