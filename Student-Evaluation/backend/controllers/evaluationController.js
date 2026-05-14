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

// =============================================
// UPDATED: getEvaluationStatus with FUNCTION CALLS
// =============================================
const getEvaluationStatus = async (req, res) => {
  try {
    const studentNo = req.studentNo || req.studentId || req.headers['x-student-number'];

    console.log(`📊 Getting evaluation status for student: ${studentNo}`);

    // =============================================
    // FUNCTION CALL 1: count_enrollments(student_id)
    // =============================================
    const enrollCountResult = await db.execute(
      `SELECT count_enrollments(:student_id) AS enrollment_count FROM DUAL`,
      { student_id: studentNo }
    );
    const totalEnrollments = enrollCountResult.rows[0]?.ENROLLMENT_COUNT || 0;
    console.log(`📞 [FUNCTION] count_enrollments('${studentNo}') = ${totalEnrollments}`);

    // =============================================
    // FUNCTION CALL 2: has_completed_all_evaluations(student_id)
    // =============================================
    const completionResult = await db.execute(
      `SELECT has_completed_all_evaluations(:student_id) AS status FROM DUAL`,
      { student_id: studentNo }
    );
    const completionStatus = completionResult.rows[0]?.STATUS || "UNKNOWN";
    console.log(`📞 [FUNCTION] has_completed_all_evaluations('${studentNo}') = ${completionStatus}`);

    // Get detailed enrollment info with evaluation status
    const sql = `
      SELECT 
        p.name,
        p.professor_id,
        s.subject_code,
        s.subject_name,
        c.section,
        c.school_year,
        e.enrollment_id,
        -- FUNCTION CALL 3: is_evaluated(enrollment_id) for each row
        is_evaluated(e.enrollment_id) AS evaluated
      FROM system.students st
      JOIN system.enrollments e ON st.student_id = e.student_id
      JOIN system.classes c ON e.class_id = c.class_id
      JOIN system.professors p ON c.professor_id = p.professor_id
      JOIN system.subjects s ON c.subject_code = s.subject_code
      WHERE st.student_id = :studentNo
      ORDER BY s.subject_code
    `;

    const result = await db.execute(sql, { studentNo });
    console.log(`📞 [FUNCTION] is_evaluated() called for ${result.rows.length} enrollments`);

    // Count completed evaluations
    let completedCount = 0;
    const enrollments = [];

    for (const row of result.rows) {
      const isEvaluated = row.EVALUATED === 1;
      if (isEvaluated) completedCount++;
      
      enrollments.push({
        professorName: row.NAME,
        professorId: row.PROFESSOR_ID,
        subjectCode: row.SUBJECT_CODE,
        subjectName: row.SUBJECT_NAME,
        section: row.SECTION,
        schoolYear: row.SCHOOL_YEAR,
        enrollmentId: row.ENROLLMENT_ID,
        evaluated: isEvaluated
      });
    }

    // =============================================
    // FUNCTION CALL 4: Get average ratings for professors
    // =============================================
    const professorRatings = {};
    for (const enrollment of enrollments) {
      if (enrollment.professorId && !professorRatings[enrollment.professorId]) {
        const avgResult = await db.execute(
          `SELECT get_avg_rating(:prof_id) AS avg FROM DUAL`,
          { prof_id: enrollment.professorId }
        );
        professorRatings[enrollment.professorId] = avgResult.rows[0]?.AVG || 0;
        console.log(`📞 [FUNCTION] get_avg_rating(${enrollment.professorId}) = ${professorRatings[enrollment.professorId]}`);
      }
    }

    res.json({
      success: true,
      studentId: studentNo,
      summary: {
        totalEnrollments: totalEnrollments,
        completedEvaluations: completedCount,
        pendingEvaluations: totalEnrollments - completedCount,
        completionStatus: completionStatus
      },
      enrollments: enrollments,
      professorRatings: professorRatings,
      // For teacher demonstration - show which functions were used
      functionsCalled: [
        'count_enrollments()',
        'has_completed_all_evaluations()',
        'is_evaluated()',
        'get_avg_rating()'
      ]
    });

  } catch (err) {
    console.error('Get status error:', err);
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// UPDATED: submitEvaluation with FUNCTION CALLS
// =============================================
const submitEvaluation = async (req, res) => {
  let connection;

  try {
    console.log("📝 SUBMIT CONTROLLER HIT");
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
    console.log("✅ EVALUATION ID:", evaluationId);

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
    console.log("✅ RESPONSES INSERTED:", responses.length);

    // 3. INSERT REMARKS
    const remarksText = remarks ? String(remarks).trim() : "";
    console.log("💬 REMARKS TO INSERT:", `"${remarksText}"`);

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
    console.log("✅ REMARKS INSERTED SUCCESSFULLY");

    await connection.commit();
    console.log("✅ TRANSACTION COMMITTED");

    // =============================================
    // NOW CALL ORACLE FUNCTIONS TO VERIFY SUBMISSION
    // =============================================
    
    // FUNCTION CALL 5: count_responses(evaluation_id)
    const countResult = await db.execute(
      `SELECT count_responses(:eval_id) AS response_count FROM DUAL`,
      { eval_id: evaluationId }
    );
    const responseCount = countResult.rows[0]?.RESPONSE_COUNT || 0;
    console.log(`📞 [FUNCTION] count_responses(${evaluationId}) = ${responseCount}`);

    // FUNCTION CALL 6: get_remarks(evaluation_id)
    const remarksResult = await db.execute(
      `SELECT get_remarks(:eval_id) AS remarks_text FROM DUAL`,
      { eval_id: evaluationId }
    );
    const retrievedRemarks = remarksResult.rows[0]?.REMARKS_TEXT || '';
    console.log(`📞 [FUNCTION] get_remarks(${evaluationId}) = "${retrievedRemarks.substring(0, 50)}..."`);

    // Get professor_id for this enrollment to calculate updated average
    const profResult = await db.execute(
      `SELECT c.professor_id
       FROM system.enrollments e
       JOIN system.classes c ON e.class_id = c.class_id
       WHERE e.enrollment_id = :enrollment_id`,
      { enrollment_id: enrollmentId }
    );
    const professorId = profResult.rows[0]?.PROFESSOR_ID;

    // FUNCTION CALL 7: get_avg_rating(professor_id) - updated average
    let updatedAvgRating = 0;
    if (professorId) {
      const avgResult = await db.execute(
        `SELECT get_avg_rating(:prof_id) AS avg_rating FROM DUAL`,
        { prof_id: professorId }
      );
      updatedAvgRating = avgResult.rows[0]?.AVG_RATING || 0;
      console.log(`📞 [FUNCTION] get_avg_rating(${professorId}) = ${updatedAvgRating}`);
    }

    // FUNCTION CALL 8: get_total_evaluations(professor_id)
    let totalEvals = 0;
    if (professorId) {
      const totalResult = await db.execute(
        `SELECT get_total_evaluations(:prof_id) AS total FROM DUAL`,
        { prof_id: professorId }
      );
      totalEvals = totalResult.rows[0]?.TOTAL || 0;
      console.log(`📞 [FUNCTION] get_total_evaluations(${professorId}) = ${totalEvals}`);
    }

    return res.json({
      success: true,
      evaluationId: evaluationId,
      verification: {
        responsesRecorded: responseCount,
        remarksRecorded: retrievedRemarks ? 'Yes' : 'No',
        professorId: professorId,
        professorNewAverageRating: updatedAvgRating,
        professorTotalEvaluations: totalEvals
      },
      // For teacher demonstration - show which functions were called
      functionsCalled: [
        'count_responses()',
        'get_remarks()',
        'get_avg_rating()',
        'get_total_evaluations()'
      ]
    });

  } catch (err) {
    console.error("❌ SUBMIT ERROR:", err);

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

// =============================================
// NEW: Get professor statistics using functions
// =============================================
const getProfessorStatistics = async (req, res) => {
  const { professorId } = req.params;

  try {
    console.log(`📊 Getting statistics for professor: ${professorId}`);

    // Call multiple functions in parallel
    const [avgRating, totalEvals, teachingRating, profNameResult] = await Promise.all([
      db.execute(`SELECT get_avg_rating(:id) AS val FROM DUAL`, { id: professorId }),
      db.execute(`SELECT get_total_evaluations(:id) AS val FROM DUAL`, { id: professorId }),
      db.execute(`SELECT get_category_avg_rating(:id, 'Teaching') AS val FROM DUAL`, { id: professorId }),
      db.execute(`SELECT name FROM system.professors WHERE professor_id = :id`, { id: professorId })
    ]);

    const stats = {
      professorId: professorId,
      professorName: profNameResult.rows[0]?.NAME || 'Unknown',
      averageRating: avgRating.rows[0]?.VAL || 0,
      totalEvaluations: totalEvals.rows[0]?.VAL || 0,
      teachingCategoryRating: teachingRating.rows[0]?.VAL || 0
    };

    console.log(`📞 [FUNCTIONS] get_avg_rating(), get_total_evaluations(), get_category_avg_rating() called for professor ${professorId}`);
    console.log(`📊 Results: Avg=${stats.averageRating}, Total=${stats.totalEvaluations}, Teaching=${stats.teachingCategoryRating}`);

    res.json({
      success: true,
      stats: stats,
      functionsCalled: [
        'get_avg_rating()',
        'get_total_evaluations()', 
        'get_category_avg_rating()'
      ]
    });

  } catch (err) {
    console.error('Get professor statistics error:', err);
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// NEW: Test a specific function (for teacher demo)
// =============================================
const testFunction = async (req, res) => {
  const { functionName, param } = req.body;

  const functionMap = {
    'get_avg_rating': `SELECT get_avg_rating(:param) AS result FROM DUAL`,
    'count_enrollments': `SELECT count_enrollments(:param) AS result FROM DUAL`,
    'has_completed_all_evaluations': `SELECT has_completed_all_evaluations(:param) AS result FROM DUAL`,
    'is_evaluated': `SELECT is_evaluated(:param) AS result FROM DUAL`,
    'count_responses': `SELECT count_responses(:param) AS result FROM DUAL`,
    'get_total_evaluations': `SELECT get_total_evaluations(:param) AS result FROM DUAL`,
    'get_remarks': `SELECT get_remarks(:param) AS result FROM DUAL`
  };

  if (!functionMap[functionName]) {
    return res.status(400).json({
      success: false,
      message: `Function '${functionName}' not found. Available: ${Object.keys(functionMap).join(', ')}`
    });
  }

  try {
    console.log(`🧪 TESTING FUNCTION: ${functionName}(${param})`);
    
    const result = await db.execute(
      functionMap[functionName],
      { param: param }
    );

    console.log(`✅ RESULT: ${result.rows[0]?.RESULT}`);

    res.json({
      success: true,
      functionName: functionName,
      parameter: param,
      result: result.rows[0]?.RESULT,
      sql: functionMap[functionName]
    });

  } catch (err) {
    console.error(`❌ Function test error:`, err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = {
  getQuestions,
  getEvaluationStatus,
  submitEvaluation,
  getProfessorStatistics,
  testFunction
};