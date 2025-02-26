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
                
            // Fetch reinsdyr for each flock
            for (let flokk of flokker) {
                flokk.reinsdyr = await Rein.find({ flokk: flokk._id });
            }
                
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
            const flokkId = req.params.flokkId;
            res.render('registerRein', { title: 'Registrer reinsdyr', flokkId: flokkId });
        } catch (error) {
            console.error('Feil ved rendering av reinsdyrregistreringsside:', error);
            res.status(500).render('error', { message: 'Serverfeil ved lasting av reinsdyrregistreringsside' });
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
            
            res.redirect(`/profile`);
            // res.json({ msg: 'Flokk og beiteområde registrert', flokk, beiteomraade });
        } catch (error) {
            console.error('Feil ved registrering av flokk:', error);
            res.status(500).json({ msg: "Serverfeil ved registrering av flokk", error: error.message });
        }
    },
    // Update in profileController.js
    registerRein: async (req, res) => {
        try {
            const flokkId = req.params.flokkId;
            
            // Check if the flokk exists
            const flokk = await Flokk.findById(flokkId);
            if (!flokk) {
                return res.status(404).json({ msg: 'Flokk ikke funnet' });
            }

            const reinsdyr = new Rein({
                navn: req.body.navn,
                fodselsdato: req.body.fodselsdato,
                flokk: flokkId,
            });
            await reinsdyr.save();

            // Redirect to the reindeer display page instead of profile
            res.redirect(`/profile/flokk-reindeer/${flokkId}`);
        } catch (error) {
            console.error('Feil ved registrering av reinsdyr:', error);
            res.status(500).json({ msg: "Serverfeil ved registrering av reinsdyr", error: error.message });
        }
    },
    deleteRein: async (req, res) => {
        try {
            const reinId = req.params.id;
            const deletedRein = await Rein.findByIdAndDelete(reinId);
            
            if (!deletedRein) {
                return res.status(404).json({ message: 'Reinsdyr ikke funnet' });
            }
            
            // Return the flokkId so the client can redirect properly
            res.status(200).json({ 
                message: 'Reinsdyr slettet', 
                deletedRein,
                flokkId: deletedRein.flokk 
            });
        } catch (error) {
            console.error('Feil ved sletting av reinsdyr:', error);
            res.status(500).json({ message: 'Kunne ikke slette reinsdyret. Prøv igjen senere.' });
        }
    },
    renderFlokkReindeer: async (req, res) => {
        try {
            const flokkId = req.params.flokkId;
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const skip = (page - 1) * limit;
            
            // Fetch the flokk
            const flokk = await Flokk.findById(flokkId);
            
            if (!flokk) {
                return res.status(404).render('error', { message: 'Flokk ikke funnet' });
            }
            
            // Check if the logged-in user owns this flokk
            if (!flokk.eier.includes(req.user.id)) {
                return res.status(403).render('error', { message: 'Du har ikke tilgang til denne flokken' });
            }
            
            // Count total reindeer in this flokk
            const totalRein = await Rein.countDocuments({ flokk: flokkId });
            
            // Fetch paginated reindeer
            const reinsdyr = await Rein.find({ flokk: flokkId })
                .skip(skip)
                .limit(limit);
                
            // Calculate total pages
            const totalPages = Math.ceil(totalRein / limit);
            
            res.render('reinDisplay', { 
                title: `Reinsdyr i ${flokk.navn}`,
                flokk: flokk,
                reinsdyr: reinsdyr,
                currentPage: page,
                totalPages: totalPages,
                totalRein: totalRein
            });
        } catch (error) {
            console.error('Feil ved henting av reinsdyr:', error);
            res.status(500).render('error', { message: 'Serverfeil ved henting av reinsdyr' });
        }
    },
    renderMoveReindeer: async (req, res) => {
        try {
            const sourceFlokkId = req.params.flokkId;
            
            // Get source flokk
            const sourceFlokk = await Flokk.findById(sourceFlokkId);
            if (!sourceFlokk) {
                return res.status(404).render('error', { message: 'Flokk ikke funnet' });
            }
            
            // Check if user owns the flokk
            if (!sourceFlokk.eier.includes(req.user.id)) {
                return res.status(403).render('error', { message: 'Du har ikke tilgang til denne flokken' });
            }
            
            // Get all reindeer in this flokk
            const reinsdyr = await Rein.find({ flokk: sourceFlokkId });
            
            // Get all other flokks owned by this user
            const otherFlokker = await Flokk.find({ 
                eier: req.user.id,
                _id: { $ne: sourceFlokkId } // Exclude the current flokk
            });
            
            res.render('moveReindeer', {
                title: 'Flytt reinsdyr',
                sourceFlokk: sourceFlokk,
                reinsdyr: reinsdyr,
                targetFlokker: otherFlokker
            });
        } catch (error) {
            console.error('Feil ved rendering av flytt reinsdyr side:', error);
            res.status(500).render('error', { message: 'Serverfeil ved lasting av flytt reinsdyr side' });
        }
    },
    moveReindeer: async (req, res) => {
        try {
            const { reinId, targetFlokkId } = req.body;
            
            // Find the reindeer
            const rein = await Rein.findById(reinId);
            if (!rein) {
                return res.status(404).json({ message: 'Reinsdyr ikke funnet' });
            }
            
            // Find the source flokk
            const sourceFlokk = await Flokk.findById(rein.flokk);
            if (!sourceFlokk) {
                return res.status(404).json({ message: 'Kilde-flokk ikke funnet' });
            }
            
            // Find the target flokk
            const targetFlokk = await Flokk.findById(targetFlokkId);
            if (!targetFlokk) {
                return res.status(404).json({ message: 'Mål-flokk ikke funnet' });
            }
            
            // Check if user owns both flokks
            if (!sourceFlokk.eier.includes(req.user.id) || !targetFlokk.eier.includes(req.user.id)) {
                return res.status(403).json({ message: 'Du har ikke tilgang til å flytte dette reinsdyret' });
            }
            
            // Update the reindeer's flokk
            rein.flokk = targetFlokkId;
            await rein.save();
            
            res.json({ 
                message: 'Reinsdyr flyttet', 
                reinsdyr: rein, 
                sourceFlokkId: sourceFlokk._id,
                targetFlokkId 
            });
        } catch (error) {
            console.error('Feil ved flytting av reinsdyr:', error);
            res.status(500).json({ message: 'Kunne ikke flytte reinsdyret. Prøv igjen senere.' });
        }
    },
    deleteFlokk: async (req, res) => {
        try {
          const flokkId = req.params.id;
          const flokk = await Flokk.findById(flokkId);
    
          if (!flokk) {
            return res.status(404).json({ message: 'Flokk ikke funnet' });
          }
    
          // Delete associated reinsdyr
          await Rein.deleteMany({ flokk: flokkId });
    
          // Delete the image file if it exists
          if (flokk.buemerkeBilde) {
            const imagePath = path.join(__dirname, '..', flokk.buemerkeBilde);
            await fs.unlink(imagePath);
          }
    
          // Delete the flokk
          await Flokk.findByIdAndDelete(flokkId);
    
          res.status(200).json({ message: 'Flokk og tilhørende reinsdyr slettet' });
        } catch (error) {
          console.error('Feil ved sletting av flokk:', error);
          res.status(500).json({ message: 'Kunne ikke slette flokken. Prøv igjen senere.' });
        }
    }
};

module.exports = profileController;