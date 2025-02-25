const Eier = require('../models/EierSchema');
bcrypt = require('bcrypt');
const { get } = require('mongoose');
const jwt = require('jsonwebtoken');

const saltRounds = parseInt(process.env.SALT_ROUNDS);

const authController = {
    login: async (req, res) => {
      try {
        const { epost, passord } = req.body;

        // Check if email and password are provided
        if (!epost || !passord) {
            return res.status(400).json({ msg: "Vennligst fyll ut både e-post og passord" });
        }

        // Find user by email
        const user = await Eier.findOne({ epost });
        if (!user) {
            return res.status(401).json({ msg: "Ugyldig e-post eller passord" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(passord, user.passord);
        if (!isMatch) {
            return res.status(401).json({ msg: "Ugyldig e-post eller passord" });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, epost: user.epost },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        // Set cookie
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV, // Use secure in production
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000, // 1 hour
        });
        
        console.log('User from request:', req.user);

        // Send success response
        // res.status(200).json({ msg: "Innlogging vellykket" });
        res.render('profilePage', { title: 'Profile' })

    } catch (error) {
        console.error('Innloggingsfeil:', error);
        res.status(500).json({ msg: "Serverfeil under innlogging" });
    }

    },
    renderLogin: (req, res) => {
        res.render('login', { title: 'Login' });
    },
    register: async (req, res) => {
      try {
        const { navn, email, passord, repeatPassord, kontaktsprak, telefonnummer } = req.body;
    
        // Input validation
        if (!navn || !email || !passord || !repeatPassord || !kontaktsprak || !telefonnummer) {
          return res.status(400).json({ msg: "Alle felt må fylles ut" });
        }
    
        console.log(navn, email, passord, repeatPassord, kontaktsprak, telefonnummer);
    
        if (passord !== repeatPassord) {
          return res.status(400).json({ msg: "Passordene samsvarer ikke" });
        }
    
        // Check if email already exists
        const existingUser = await Eier.findOne({ epost: email });
        if (existingUser) {
          return res.status(400).json({ msg: "E-postadressen er allerede i bruk" });
        }
    
        // Hash password
        const hashedPassword = await bcrypt.hash(passord, saltRounds);
    
        // Create new user
        const newUser = new Eier({
          navn,
          epost: email,
          passord: hashedPassword,
          kontaktsprak,
          telefonnummer: parseInt(telefonnummer, 10)
        });
    
        // Save user to database
        await newUser.save();
    
        // Create JWT token
        const token = jwt.sign(
          { userId: newUser._id, epost: newUser.epost },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );
    
        // Set cookie
        res.cookie('jwt', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV, // Use secure in production
          sameSite: 'strict',
          maxAge: 60 * 60 * 1000, // 1 hour
        });
   
        res.render('profilePage', { title: 'Profile' })
    
      } catch (err) {
        console.error('Registreringsfeil:', err);
        res.status(500).json({ msg: "Serverfeil under registrering" });
      }
    },
    renderRegister: (req, res) => {
        res.render('register', { title: 'Register' });
    },
    logout: async (req, res) => {
        try {
          res.clearCookie('jwt');
          res.redirect('/');
        } catch (error) {
          console.error(error);
          res.status(500).send({ msg: "Error logging out" });
        }
      },

      
};

module.exports = authController;