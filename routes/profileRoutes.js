const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

router.get('/', profileController.renderProfile);

router.get('/flokk/:id', profileController.getFlokkDetails);

router.get('/register-flokk', profileController.renderRegisterFlokk);
router.get('/register-rein', profileController.renderRegisterRein);

router.post('/register-flokk',profileController.registerFlokk);
router.post('/register-rein', profileController.registerRein);

module.exports = router;