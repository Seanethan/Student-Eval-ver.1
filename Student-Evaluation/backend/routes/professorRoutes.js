const express = require('express');
const router = express.Router();
const professorController = require('../controllers/professorController');
const auth = require('../middleware/auth');

// Get professors assigned to logged-in student
router.get('/student-professors', auth, professorController.getStudentProfessors);

module.exports = router;