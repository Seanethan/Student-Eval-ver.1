

const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const auth = require('../middleware/auth');

// Get evaluation questions
router.get('/questions', evaluationController.getQuestions);

// Submit evaluation (protected)
router.post('/submit', auth, evaluationController.submitEvaluation);

// Get student evaluation status (protected)
router.get('/status', auth, evaluationController.getEvaluationStatus);

module.exports = router;