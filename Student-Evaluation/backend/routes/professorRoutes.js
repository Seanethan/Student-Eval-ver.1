const express = require('express');
const router = express.Router();
const professorController = require('../controllers/professorController');
const auth = require('../middleware/auth');

// Get professors for logged in student
router.get('/student-professors', auth, professorController.getStudentProfessors);

// NEW: Get professor details with all stats (uses multiple functions)
router.get('/professor-details/:professorId', auth, professorController.getProfessorDetails);

// NEW: Get all professors with their average ratings
router.get('/all-with-ratings', auth, professorController.getAllProfessorsWithRatings);

// NEW: Check if student can evaluate a specific professor
router.get('/can-evaluate/:professorId', auth, professorController.canEvaluateProfessor);

module.exports = router;