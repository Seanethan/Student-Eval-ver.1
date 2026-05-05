const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const auth = require('../middleware/auth');

router.get('/questions', evaluationController.getQuestions);
router.post('/submit', auth, evaluationController.submitEvaluation);
router.get('/status', auth, evaluationController.getEvaluationStatus);

module.exports = router;