const Eier = require('../models/EierSchema');
bcrypt = require('bcrypt');
const { get } = require('mongoose');
const jwt = require('jsonwebtoken');

const saltRounds = parseInt(process.env.SALT_ROUNDS);

const authController = {
    login: async (req, res) => {

        res.render('login', { title: 'Login' });
    },
    renderLogin: (req, res) => {
        res.render('login', { title: 'Login' });
    },
    register: async (req, res) => {
      try {
        console.log("logging in");
        res.render('register',{ title: 'Register' });
      } catch (err) {
        console.log(err);
      }

      
        
    },
    renderRegister: (req, res) => {
        res.render('register', { title: 'Register' });
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