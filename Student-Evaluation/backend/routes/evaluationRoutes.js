const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const auth = require('../middleware/auth');

// Get evaluation questions (public)
router.get('/questions', evaluationController.getQuestions);

// Get evaluation status (protected)
router.get('/status', auth, evaluationController.getEvaluationStatus);

// Submit evaluation (protected)
router.post('/submit', auth, evaluationController.submitEvaluation);

// NEW: Professor statistics using functions (protected)
router.get('/professor-stats/:professorId', auth, evaluationController.getProfessorStatistics);

// NEW: Test a specific function (protected - for teacher demo)
router.post('/test-function', auth, evaluationController.testFunction);

module.exports = router;