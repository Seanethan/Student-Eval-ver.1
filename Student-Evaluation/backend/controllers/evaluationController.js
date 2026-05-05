const db = require('../config/database');
const oracledb = require('oracledb');

const getQuestions = async (req, res) => {
  try {
    const sql = `
      SELECT 
        q.QUESTION_ID,
        q.QUESTION_TEXT,
        c.CATEGORY_ID,
        c.CATEGORY_NAME,
        f.FORM_ID,
        f.FORM_NAME
      FROM Questions q
      JOIN Categories c ON q.CATEGORY_ID = c.CATEGORY_ID
      JOIN Forms f ON c.FORM_ID = f.FORM_ID
      ORDER BY f.FORM_ID, c.CATEGORY_ID, q.QUESTION_ID
    `;

    const result = await db.execute(sql);

    const categoriesMap = {};
    result.rows.forEach(row => {
      if (!categoriesMap[row.CATEGORY_ID]) {
        categoriesMap[row.CATEGORY_ID] = {
          categoryId: row.CATEGORY_ID,
          categoryName: row.CATEGORY_NAME,
          questions: []
        };
      }
      categoriesMap[row.CATEGORY_ID].questions.push({
        questionId: row.QUESTION_ID,
        questionText: row.QUESTION_TEXT
      });
    });

    res.json({
      success: true,
      categories: Object.values(categoriesMap)
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const submitEvaluation = async (req, res) => {
  let connection;
  try {
    const { enrollmentId, responses } = req.body;

    console.log('Received evaluation:', { enrollmentId, responseCount: responses?.length });

    if (!enrollmentId || !responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: 'Invalid evaluation data' });
    }

    connection = await oracledb.getConnection();

    // Insert evaluation
    const evalSql = `
      INSERT INTO Evaluations (ENROLLMENT_ID, DATE_SUBMITTED) 
      VALUES (:enrollmentId, CURRENT_TIMESTAMP)
      RETURNING EVALUATION_ID INTO :evaluationId
    `;
    
    const evalResult = await connection.execute(
      evalSql,
      {
        enrollmentId: enrollmentId,
        evaluationId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      }
    );
    
    const evaluationId = evalResult.outBinds.evaluationId[0];
    console.log('Created evaluation ID:', evaluationId);

    // Insert responses
    for (const response of responses) {
      const respSql = `
        INSERT INTO Responses (EVALUATION_ID, QUESTION_ID, RATING) 
        VALUES (:evaluationId, :questionId, :rating)
      `;
      
      await connection.execute(respSql, {
        evaluationId: evaluationId,
        questionId: response.questionId,
        rating: response.rating
      });
    }

    await connection.commit();
    console.log('Evaluation submitted successfully');

    res.json({
      success: true,
      message: 'Evaluation submitted successfully',
      evaluationId: evaluationId
    });
  } catch (error) {
    console.error('Submit evaluation error:', error);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
};

const getEvaluationStatus = async (req, res) => {
  try {
    const studentNo = req.studentNo;

    const sql = `
      SELECT 
        p.NAME as PROFESSOR_NAME,
        s.SUBJECT_CODE,
        e.ENROLLMENT_ID,
        CASE WHEN ev.EVALUATION_ID IS NOT NULL THEN 1 ELSE 0 END as EVALUATED
      FROM Students st
      JOIN Enrollments e ON st.STUDENT_ID = e.STUDENT_ID
      JOIN Classes c ON e.CLASS_ID = c.CLASS_ID
      JOIN Professors p ON c.PROFESSOR_ID = p.PROFESSOR_ID
      JOIN Subjects s ON c.SUBJECT_CODE = s.SUBJECT_CODE
      LEFT JOIN Evaluations ev ON e.ENROLLMENT_ID = ev.ENROLLMENT_ID
      WHERE st.STUDENT_ID = :studentNo
      ORDER BY p.NAME
    `;

    const result = await db.execute(sql, [studentNo]);

    res.json({
      success: true,
      evaluations: result.rows.map(row => ({
        professorName: row.PROFESSOR_NAME,
        subjectCode: row.SUBJECT_CODE,
        enrollmentId: row.ENROLLMENT_ID,
        evaluated: row.EVALUATED === 1
      }))
    });
  } catch (error) {
    console.error('Error fetching evaluation status:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = { getQuestions, submitEvaluation, getEvaluationStatus };