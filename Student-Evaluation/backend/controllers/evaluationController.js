const oracledb = require('oracledb');
const db = require('../config/database');

const getQuestions = async (req, res) => {
  try {
    const sql = `
      SELECT c.category_name, q.question_id, q.question_text
      FROM system.questions q
      JOIN system.categories c ON q.category_id = c.category_id
      JOIN system.forms f ON c.form_id = f.form_id
      WHERE f.form_name = 'Student Evaluation Form'
      ORDER BY c.category_id, q.question_id
    `;

    const result = await db.execute(sql);

    if (!result.rows || result.rows.length === 0) {
      return res.json({
        success: true,
        categories: []
      });
    }

    const categoriesMap = {};
    result.rows.forEach(row => {
      const categoryName = row.CATEGORY_NAME;
      if (!categoriesMap[categoryName]) {
        categoriesMap[categoryName] = [];
      }
      categoriesMap[categoryName].push({
        questionId: row.QUESTION_ID,
        questionText: row.QUESTION_TEXT
      });
    });

    const categories = Object.keys(categoriesMap).map(name => ({
      category: name,
      questions: categoriesMap[name]
    }));

    res.json({
      success: true,
      categories
    });

  } catch (err) {
    console.error('Get questions error:', err);
    res.status(500).json({ error: err.message });
  }
};

const getEvaluationStatus = async (req, res) => {
  try {
    const studentNo = req.studentNo || req.studentId || req.headers['x-student-number'];

    const sql = `
      SELECT 
        p.name,
        s.subject_code,
        s.subject_name,
        c.section,
        c.school_year,
        CASE WHEN ev.evaluation_id IS NOT NULL THEN 1 ELSE 0 END AS evaluated
      FROM system.students st
      JOIN system.enrollments e ON st.student_id = e.student_id
      JOIN system.classes c ON e.class_id = c.class_id
      JOIN system.professors p ON c.professor_id = p.professor_id
      JOIN system.subjects s ON c.subject_code = s.subject_code
      LEFT JOIN system.evaluations ev ON e.enrollment_id = ev.enrollment_id
      WHERE st.student_id = :studentNo
    `;

    const result = await db.execute(sql, { studentNo });

    res.json({
      success: true,
      status: result.rows
    });

  } catch (err) {
    console.error('Get status error:', err);
    res.status(500).json({ error: err.message });
  }
};

const submitEvaluation = async (req, res) => {
  let connection;

  try {
    console.log("SUBMIT CONTROLLER HIT");
    console.log("BODY:", JSON.stringify(req.body, null, 2));
    console.log("STUDENT:", req.studentId);

    const { enrollmentId, responses, remarks } = req.body;

    if (!enrollmentId || !Array.isArray(responses)) {
      return res.status(400).json({
        error: "Invalid evaluation data"
      });
    }

    connection = await oracledb.getConnection();

    // 1. INSERT EVALUATION
    const evalResult = await connection.execute(
      `
      INSERT INTO system.evaluations (enrollment_id, date_submitted)
      VALUES (:enrollmentId, CURRENT_TIMESTAMP)
      RETURNING evaluation_id INTO :id
      `,
      {
        enrollmentId,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );

    const evaluationId = evalResult.outBinds.id[0];
    console.log("EVALUATION ID:", evaluationId);

    // 2. INSERT RESPONSES
    for (const r of responses) {
      await connection.execute(
        `
        INSERT INTO system.responses (evaluation_id, question_id, rating)
        VALUES (:evaluationId, :questionId, :rating)
        `,
        {
          evaluationId,
          questionId: r.questionId,
          rating: r.rating
        }
      );
    }
    console.log("RESPONSES INSERTED:", responses.length);

    // 3. INSERT REMARKS
    const remarksText = remarks ? String(remarks).trim() : "";

    console.log(">>> REMARKS VALUE:", `"${remarks}"`);
    console.log(">>> REMARKS TYPE:", typeof remarks);
    console.log(">>> REMARKS TEXT TO INSERT:", `"${remarksText}"`);

    await connection.execute(
      `
      INSERT INTO system.remarks (evaluation_id, remarks_text)
      VALUES (:evaluationId, :remarksText)
      `,
      {
        evaluationId,
        remarksText: remarksText
      }
    );

    console.log("REMARKS INSERTED SUCCESSFULLY");

    await connection.commit();
    console.log("TRANSACTION COMMITTED");

    return res.json({
      success: true,
      evaluationId
    });

  } catch (err) {
    console.error("SUBMIT ERROR:", err);

    if (connection) {
      try {
        await connection.rollback();
        console.log("TRANSACTION ROLLED BACK");
      } catch (rollbackErr) {
        console.error("ROLLBACK ERROR:", rollbackErr);
      }
    }

    return res.status(500).json({
      error: err.message
    });

  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error("CLOSE ERROR:", closeErr);
      }
    }
  }
};

module.exports = {
  getQuestions,
  getEvaluationStatus,
  submitEvaluation
};