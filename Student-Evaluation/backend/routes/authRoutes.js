const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login student
router.post('/login', authController.loginStudent);

module.exports = router;