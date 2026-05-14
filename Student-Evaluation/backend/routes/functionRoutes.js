// routes/functionRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// =============================================
// ORACLE DATABASE FUNCTION ENDPOINTS
// These endpoints call the functions you created
// =============================================

/**
 * FUNCTION 1: get_avg_rating(professor_id)
 * Returns average rating for a professor
 * GET /api/functions/get-avg-rating/:professorId
 */
router.get('/get-avg-rating/:professorId', async (req, res) => {
    const { professorId } = req.params;
    
    console.log(`📞 [FUNCTION CALL] get_avg_rating(${professorId})`);
    
    try {
        const result = await db.execute(
            `SELECT get_avg_rating(:prof_id) AS avg_rating FROM DUAL`,
            { prof_id: professorId }
        );
        
        const avgRating = result.rows[0]?.AVG_RATING || 0;
        
        console.log(`✅ [FUNCTION RESULT] get_avg_rating(${professorId}) = ${avgRating}`);
        
        res.json({
            success: true,
            functionName: 'get_avg_rating',
            professorId: professorId,
            averageRating: avgRating
        });
    } catch (error) {
        console.error(`❌ [FUNCTION ERROR] get_avg_rating:`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * FUNCTION 2: count_responses(evaluation_id)
 * Returns number of responses for an evaluation
 * GET /api/functions/count-responses/:evaluationId
 */
router.get('/count-responses/:evaluationId', async (req, res) => {
    const { evaluationId } = req.params;
    
    console.log(`📞 [FUNCTION CALL] count_responses(${evaluationId})`);
    
    try {
        const result = await db.execute(
            `SELECT count_responses(:eval_id) AS response_count FROM DUAL`,
            { eval_id: evaluationId }
        );
        
        const responseCount = result.rows[0]?.RESPONSE_COUNT || 0;
        
        console.log(`✅ [FUNCTION RESULT] count_responses(${evaluationId}) = ${responseCount}`);
        
        res.json({
            success: true,
            functionName: 'count_responses',
            evaluationId: evaluationId,
            responseCount: responseCount
        });
    } catch (error) {
        console.error(`❌ [FUNCTION ERROR] count_responses:`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * FUNCTION 3: get_remarks(evaluation_id)
 * Returns remarks text for an evaluation
 * GET /api/functions/get-remarks/:evaluationId
 */
router.get('/get-remarks/:evaluationId', async (req, res) => {
    const { evaluationId } = req.params;
    
    console.log(`📞 [FUNCTION CALL] get_remarks(${evaluationId})`);
    
    try {
        const result = await db.execute(
            `SELECT get_remarks(:eval_id) AS remarks_text FROM DUAL`,
            { eval_id: evaluationId }
        );
        
        const remarksText = result.rows[0]?.REMARKS_TEXT || "";
        
        console.log(`✅ [FUNCTION RESULT] get_remarks(${evaluationId}) = "${remarksText.substring(0, 50)}..."`);
        
        res.json({
            success: true,
            functionName: 'get_remarks',
            evaluationId: evaluationId,
            remarksText: remarksText
        });
    } catch (error) {
        console.error(`❌ [FUNCTION ERROR] get_remarks:`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * FUNCTION 4: is_evaluated(enrollment_id)
 * Checks if an enrollment has been evaluated
 * GET /api/functions/is-evaluated/:enrollmentId
 */
router.get('/is-evaluated/:enrollmentId', async (req, res) => {
    const { enrollmentId } = req.params;
    
    console.log(`📞 [FUNCTION CALL] is_evaluated(${enrollmentId})`);
    
    try {
        const result = await db.execute(
            `SELECT is_evaluated(:enrollment_id) AS is_evaluated FROM DUAL`,
            { enrollment_id: enrollmentId }
        );
        
        const isEvaluated = result.rows[0]?.IS_EVALUATED || 0;
        
        console.log(`✅ [FUNCTION RESULT] is_evaluated(${enrollmentId}) = ${isEvaluated === 1 ? 'YES' : 'NO'}`);
        
        res.json({
            success: true,
            functionName: 'is_evaluated',
            enrollmentId: enrollmentId,
            isEvaluated: isEvaluated
        });
    } catch (error) {
        console.error(`❌ [FUNCTION ERROR] is_evaluated:`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * FUNCTION 5: count_enrollments(student_id)
 * Returns number of enrollments for a student
 * GET /api/functions/count-enrollments/:studentId
 */
router.get('/count-enrollments/:studentId', async (req, res) => {
    const { studentId } = req.params;
    
    console.log(`📞 [FUNCTION CALL] count_enrollments('${studentId}')`);
    
    try {
        const result = await db.execute(
            `SELECT count_enrollments(:student_id) AS enrollment_count FROM DUAL`,
            { student_id: studentId }
        );
        
        const enrollmentCount = result.rows[0]?.ENROLLMENT_COUNT || 0;
        
        console.log(`✅ [FUNCTION RESULT] count_enrollments('${studentId}') = ${enrollmentCount}`);
        
        res.json({
            success: true,
            functionName: 'count_enrollments',
            studentId: studentId,
            enrollmentCount: enrollmentCount
        });
    } catch (error) {
        console.error(`❌ [FUNCTION ERROR] count_enrollments:`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * FUNCTION 6: has_completed_all_evaluations(student_id)
 * Returns completion status for a student
 * GET /api/functions/completion-status/:studentId
 */
router.get('/completion-status/:studentId', async (req, res) => {
    const { studentId } = req.params;
    
    console.log(`📞 [FUNCTION CALL] has_completed_all_evaluations('${studentId}')`);
    
    try {
        const result = await db.execute(
            `SELECT has_completed_all_evaluations(:student_id) AS status FROM DUAL`,
            { student_id: studentId }
        );
        
        const status = result.rows[0]?.STATUS || "UNKNOWN";
        
        console.log(`✅ [FUNCTION RESULT] has_completed_all_evaluations('${studentId}') = ${status}`);
        
        res.json({
            success: true,
            functionName: 'has_completed_all_evaluations',
            studentId: studentId,
            status: status
        });
    } catch (error) {
        console.error(`❌ [FUNCTION ERROR] has_completed_all_evaluations:`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * FUNCTION 7: get_category_avg_rating(professor_id, category_name)
 * Returns average rating for a specific category
 * GET /api/functions/category-rating/:professorId/:categoryName
 */
router.get('/category-rating/:professorId/:categoryName', async (req, res) => {
    const { professorId, categoryName } = req.params;
    
    console.log(`📞 [FUNCTION CALL] get_category_avg_rating(${professorId}, '${categoryName}')`);
    
    try {
        const result = await db.execute(
            `SELECT get_category_avg_rating(:prof_id, :cat_name) AS category_rating FROM DUAL`,
            { 
                prof_id: professorId,
                cat_name: categoryName
            }
        );
        
        const categoryRating = result.rows[0]?.CATEGORY_RATING || 0;
        
        console.log(`✅ [FUNCTION RESULT] get_category_avg_rating(${professorId}, '${categoryName}') = ${categoryRating}`);
        
        res.json({
            success: true,
            functionName: 'get_category_avg_rating',
            professorId: professorId,
            categoryName: categoryName,
            categoryRating: categoryRating
        });
    } catch (error) {
        console.error(`❌ [FUNCTION ERROR] get_category_avg_rating:`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * FUNCTION 8: get_total_evaluations(professor_id)
 * Returns total number of evaluations for a professor
 * GET /api/functions/total-evaluations/:professorId
 */
router.get('/total-evaluations/:professorId', async (req, res) => {
    const { professorId } = req.params;
    
    console.log(`📞 [FUNCTION CALL] get_total_evaluations(${professorId})`);
    
    try {
        const result = await db.execute(
            `SELECT get_total_evaluations(:prof_id) AS total_evals FROM DUAL`,
            { prof_id: professorId }
        );
        
        const totalEvaluations = result.rows[0]?.TOTAL_EVALS || 0;
        
        console.log(`✅ [FUNCTION RESULT] get_total_evaluations(${professorId}) = ${totalEvaluations}`);
        
        res.json({
            success: true,
            functionName: 'get_total_evaluations',
            professorId: professorId,
            totalEvaluations: totalEvaluations
        });
    } catch (error) {
        console.error(`❌ [FUNCTION ERROR] get_total_evaluations:`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * LIST: Get all available functions in the database
 * GET /api/functions/list
 */
router.get('/list', async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT 
                object_name AS function_name,
                status,
                created,
                last_ddl_time
            FROM user_objects 
            WHERE object_type = 'FUNCTION'
            ORDER BY object_name
        `);
        
        res.json({
            success: true,
            count: result.rows.length,
            functions: result.rows
        });
    } catch (error) {
        console.error('Error listing functions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;