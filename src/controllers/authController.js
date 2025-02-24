const Eier = require('../models/EierSchema');
bcrypt = require('bcrypt');
const { get } = require('mongoose');

const saltRounds = parseInt(process.env.SALT_ROUNDS);

const authController = {
    login: async (req, res) => {
        const { navn, passord } = req.body;
        res.render('\/login', { title: 'Login' });
        // try {
        //     const user = await Eier.findOne({ navn, passord });
        //     if (user) {
        //         req.session.user = user;
        //         res.redirect('/auth/register');
        //     } else {
        //         res.render('pages/login', { title: 'Login' });
        //     }
        // } catch (err) {
        //     console.log(err);
        // }
    },
    register: async (req, res) => {
        const { navn, passord } = req.body;
        res.render('/register', { title: 'Register' });
        // try {
        //     const user = await Eier.findOne({ navn });
        //     if (user) {
        //         res.render('pages/register', { title: 'Register' });
        //     } else {
        //         const salt = await bcrypt.genSalt(saltRounds);
        //         const hashedPassord = await bcrypt.hash(passord, salt);
        //         const newUser = new Eier({ navn, passord: hashedPassord });
        //         await newUser.save();
        //         req.session.user = newUser;
        //         res.redirect('/auth/login');
        //     }
        // } catch (err) {
        //     console.log(err);
        // }
    },
    logout: async (req, res) => {
        try {
          res.clearCookie('jwt');
          res.status(200).send({ msg: "Logged out successfully" });
        } catch (error) {
          console.error(error);
          res.status(500).send({ msg: "Error logging out" });
        }
      },

};

module.exports = authController;