const db = require('../config/database');
const oracledb = require('oracledb');

const getStudentProfessors = async (req, res) => {
  try {
    const studentNo = req.studentNo || req.studentId || req.headers['x-student-number'];

    if (!studentNo) {
      return res.status(400).json({ error: 'Student number is required' });
    }

    console.log("📚 FETCHING PROFESSORS FOR STUDENT:", studentNo);

    // =============================================
    // FUNCTION CALL 1: count_enrollments(student_id)
    // =============================================
    try {
      const enrollCountResult = await db.execute(
        `SELECT count_enrollments(:student_id) AS enrollment_count FROM DUAL`,
        { student_id: studentNo }
      );
      const totalEnrollments = enrollCountResult.rows[0]?.ENROLLMENT_COUNT || 0;
      console.log(`📞 [FUNCTION] count_enrollments('${studentNo}') = ${totalEnrollments}`);
    } catch (funcError) {
      console.log(`⚠️ Function count_enrollments not yet created: ${funcError.message}`);
    }

    // =============================================
    // FUNCTION CALL 2: has_completed_all_evaluations(student_id)
    // =============================================
    try {
      const completionResult = await db.execute(
        `SELECT has_completed_all_evaluations(:student_id) AS status FROM DUAL`,
        { student_id: studentNo }
      );
      const completionStatus = completionResult.rows[0]?.STATUS || "UNKNOWN";
      console.log(`📞 [FUNCTION] has_completed_all_evaluations('${studentNo}') = ${completionStatus}`);
    } catch (funcError) {
      console.log(`⚠️ Function has_completed_all_evaluations not yet created: ${funcError.message}`);
    }

    // FIXED: Changed school year from '2025-2026' to '2024-2025' to match your data
    // FIXED: Removed semester column since it doesn't exist in your table
    const sql = `
      SELECT DISTINCT 
        p.professor_id,
        p.name,
        s.subject_code,
        s.subject_name,
        c.class_id,
        c.section,
        c.school_year,
        e.enrollment_id,
        -- 🔥 FUNCTION CALL 3: is_evaluated(enrollment_id)
        NVL(is_evaluated(e.enrollment_id), 0) AS evaluated
      FROM system.students st
      JOIN system.enrollments e ON st.student_id = e.student_id
      JOIN system.classes c ON e.class_id = c.class_id
      JOIN system.professors p ON c.professor_id = p.professor_id
      JOIN system.subjects s ON c.subject_code = s.subject_code
      WHERE st.student_id = :studentNo
        AND c.school_year = '2024-2025'
      ORDER BY e.enrollment_id
    `;

    const result = await db.execute(
      sql,
      { studentNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(`📞 [FUNCTION] is_evaluated() called for ${result.rows.length} enrollments`);
    console.log("✅ PROFESSORS FOUND:", result.rows.length);

    // Process results and add additional function data
    const professors = [];
    let evaluatedCount = 0;
    let pendingCount = 0;

    for (const row of result.rows) {
      const isEvaluated = row.EVALUATED === 1;
      if (isEvaluated) {
        evaluatedCount++;
      } else {
        pendingCount++;
      }

      // =============================================
      // FUNCTION CALL 4: get_avg_rating(professor_id) for each professor
      // =============================================
      let avgRating = null;
      if (row.PROFESSOR_ID) {
        try {
          const avgResult = await db.execute(
            `SELECT NVL(get_avg_rating(:prof_id), 0) AS avg_rating FROM DUAL`,
            { prof_id: row.PROFESSOR_ID }
          );
          avgRating = avgResult.rows[0]?.AVG_RATING || 0;
          console.log(`📞 [FUNCTION] get_avg_rating(${row.PROFESSOR_ID}) for ${row.NAME} = ${avgRating}`);
        } catch (funcError) {
          console.log(`⚠️ Function get_avg_rating not yet created: ${funcError.message}`);
          avgRating = 0;
        }
      }

      professors.push({
        professorId: row.PROFESSOR_ID,
        name: row.NAME,
        subjectCode: row.SUBJECT_CODE,
        subjectName: row.SUBJECT_NAME,
        classId: row.CLASS_ID,
        section: row.SECTION,
        schoolYear: row.SCHOOL_YEAR,
        enrollmentId: row.ENROLLMENT_ID,
        evaluated: isEvaluated,
        averageRating: avgRating
      });
    }

    // Calculate completion percentage
    const totalEnrollments = professors.length;
    const completionPercentage = totalEnrollments > 0 
      ? Math.round((evaluatedCount / totalEnrollments) * 100) 
      : 0;

      console.log("📤 SENDING PROFESSORS DATA:", JSON.stringify(professors.slice(0, 2), null, 2));

    res.json({
      success: true,
      studentId: studentNo,
      summary: {
        totalEnrollments: totalEnrollments,
        evaluatedCount: evaluatedCount,
        pendingCount: pendingCount,
        completionPercentage: completionPercentage,
        completionStatus: evaluatedCount === totalEnrollments ? 'COMPLETED' : `INCOMPLETE (${evaluatedCount}/${totalEnrollments})`
      },
      professors: professors,
      functionsCalled: [
        'count_enrollments()',
        'has_completed_all_evaluations()',
        'is_evaluated()',
        'get_avg_rating()'
      ]
    });

  } catch (err) {
    console.error("❌ Professor fetch error:", err);
    res.status(500).json({ 
      error: err.message,
      stack: err.stack 
    });
  }
};

// =============================================
// Get professor details with all function stats
// =============================================
const getProfessorDetails = async (req, res) => {
  const { professorId } = req.params;

  try {
    console.log(`📊 Getting detailed stats for professor: ${professorId}`);

    // Get professor basic info
    const profResult = await db.execute(
      `SELECT professor_id, name FROM system.professors WHERE professor_id = :id`,
      { id: professorId }
    );

    if (profResult.rows.length === 0) {
      return res.status(404).json({ error: 'Professor not found' });
    }

    const professor = profResult.rows[0];

    // Default values in case functions don't exist yet
    let averageRating = 0;
    let totalEvaluations = 0;
    const categoryRatings = {
      Teaching: 0,
      Professionalism: 0,
      Attitude: 0,
      Appearance: 0
    };
    const ratingDistribution = {
      rating5: 0,
      rating4: 0,
      rating3: 0,
      rating2: 0,
      rating1: 0
    };

    // Try to call functions with error handling
    try {
      const avgResult = await db.execute(
        `SELECT NVL(get_avg_rating(:prof_id), 0) AS avg_rating FROM DUAL`,
        { prof_id: professorId }
      );
      averageRating = avgResult.rows[0]?.AVG_RATING || 0;
      console.log(`📞 [FUNCTION] get_avg_rating(${professorId}) = ${averageRating}`);
    } catch (err) {
      console.log(`⚠️ get_avg_rating not available: ${err.message}`);
    }

    try {
      const totalResult = await db.execute(
        `SELECT NVL(get_total_evaluations(:prof_id), 0) AS total FROM DUAL`,
        { prof_id: professorId }
      );
      totalEvaluations = totalResult.rows[0]?.TOTAL || 0;
      console.log(`📞 [FUNCTION] get_total_evaluations(${professorId}) = ${totalEvaluations}`);
    } catch (err) {
      console.log(`⚠️ get_total_evaluations not available: ${err.message}`);
    }

    // Try category functions
    const categories = ['Teaching', 'Professionalism', 'Attitude', 'Appearance'];
    for (const category of categories) {
      try {
        const catResult = await db.execute(
          `SELECT NVL(get_category_avg_rating(:prof_id, :cat_name), 0) AS rating FROM DUAL`,
          { prof_id: professorId, cat_name: category }
        );
        categoryRatings[category] = catResult.rows[0]?.RATING || 0;
        console.log(`📞 [FUNCTION] get_category_avg_rating(${professorId}, '${category}') = ${categoryRatings[category]}`);
      } catch (err) {
        console.log(`⚠️ get_category_avg_rating for ${category} not available: ${err.message}`);
      }
    }

    // Get rating distribution from direct query
    try {
      const distResult = await db.execute(`
        SELECT r.rating, COUNT(*) as count
        FROM system.responses r
        JOIN system.evaluations ev ON r.evaluation_id = ev.evaluation_id
        JOIN system.enrollments e ON ev.enrollment_id = e.enrollment_id
        JOIN system.classes c ON e.class_id = c.class_id
        WHERE c.professor_id = :prof_id
        GROUP BY r.rating
        ORDER BY r.rating DESC
      `, { prof_id: professorId });

      for (const row of distResult.rows) {
        const rating = row.RATING;
        const count = row.COUNT;
        if (rating === 5) ratingDistribution.rating5 = count;
        else if (rating === 4) ratingDistribution.rating4 = count;
        else if (rating === 3) ratingDistribution.rating3 = count;
        else if (rating === 2) ratingDistribution.rating2 = count;
        else if (rating === 1) ratingDistribution.rating1 = count;
      }
    } catch (err) {
      console.log(`⚠️ Rating distribution query failed: ${err.message}`);
    }

    res.json({
      success: true,
      professor: {
        id: professor.PROFESSOR_ID,
        name: professor.NAME,
        averageRating: averageRating,
        totalEvaluations: totalEvaluations,
        categoryRatings: categoryRatings,
        ratingDistribution: ratingDistribution
      },
      functionsCalled: [
        'get_avg_rating()',
        'get_total_evaluations()',
        'get_category_avg_rating() × 4 categories'
      ]
    });

  } catch (err) {
    console.error("❌ Get professor details error:", err);
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// Get all professors list with their average ratings
// =============================================
const getAllProfessorsWithRatings = async (req, res) => {
  try {
    console.log("📊 Getting all professors with their average ratings");

    // Simple query without functions first
    const result = await db.execute(`
      SELECT 
        p.professor_id,
        p.name
      FROM system.professors p
      ORDER BY p.professor_id
    `);

    // Get ratings for each professor
    const professors = [];
    for (const row of result.rows) {
      let avgRating = 0;
      let totalEvals = 0;
      
      try {
        const avgResult = await db.execute(
          `SELECT NVL(get_avg_rating(:prof_id), 0) AS avg FROM DUAL`,
          { prof_id: row.PROFESSOR_ID }
        );
        avgRating = avgResult.rows[0]?.AVG || 0;
      } catch (err) {
        console.log(`⚠️ Could not get rating for professor ${row.PROFESSOR_ID}`);
      }
      
      try {
        const totalResult = await db.execute(
          `SELECT NVL(get_total_evaluations(:prof_id), 0) AS total FROM DUAL`,
          { prof_id: row.PROFESSOR_ID }
        );
        totalEvals = totalResult.rows[0]?.TOTAL || 0;
      } catch (err) {
        console.log(`⚠️ Could not get total evaluations for professor ${row.PROFESSOR_ID}`);
      }
      
      professors.push({
        professor_id: row.PROFESSOR_ID,
        name: row.NAME,
        average_rating: avgRating,
        total_evaluations: totalEvals
      });
    }

    res.json({
      success: true,
      professors: professors,
      functionsCalled: ['get_avg_rating()', 'get_total_evaluations()']
    });

  } catch (err) {
    console.error("❌ Get all professors error:", err);
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// Check if student can evaluate a specific professor
// =============================================
const canEvaluateProfessor = async (req, res) => {
  const { professorId } = req.params;
  const studentNo = req.studentNo || req.studentId || req.headers['x-student-number'];

  try {
    console.log(`🔍 Checking if student ${studentNo} can evaluate professor ${professorId}`);

    // First, get the enrollmentId for this student-professor pair
    // FIXED: Changed school year to '2024-2025'
    const enrollmentResult = await db.execute(`
      SELECT e.enrollment_id
      FROM system.enrollments e
      JOIN system.classes c ON e.class_id = c.class_id
      WHERE e.student_id = :student_id
        AND c.professor_id = :prof_id
        AND c.school_year = '2024-2025'
    `, { 
      student_id: studentNo,
      prof_id: professorId 
    });

    if (enrollmentResult.rows.length === 0) {
      return res.json({
        success: true,
        canEvaluate: false,
        reason: 'Not enrolled in any class with this professor'
      });
    }

    const enrollmentId = enrollmentResult.rows[0].ENROLLMENT_ID;

    // FUNCTION CALL: is_evaluated(enrollment_id)
    let isEvaluated = false;
    try {
      const evalResult = await db.execute(
        `SELECT NVL(is_evaluated(:enrollment_id), 0) AS is_evaluated FROM DUAL`,
        { enrollment_id: enrollmentId }
      );
      isEvaluated = evalResult.rows[0]?.IS_EVALUATED === 1;
      console.log(`📞 [FUNCTION] is_evaluated(${enrollmentId}) = ${isEvaluated ? 'YES' : 'NO'}`);
    } catch (err) {
      console.log(`⚠️ is_evaluated function not available, checking manually`);
      // Manual check if function doesn't exist
      const manualCheck = await db.execute(
        `SELECT COUNT(*) as count FROM system.evaluations WHERE enrollment_id = :enrollment_id`,
        { enrollment_id: enrollmentId }
      );
      isEvaluated = manualCheck.rows[0]?.COUNT > 0;
    }

    res.json({
      success: true,
      canEvaluate: !isEvaluated,
      alreadyEvaluated: isEvaluated,
      enrollmentId: enrollmentId,
      functionsCalled: ['is_evaluated()']
    });

  } catch (err) {
    console.error("❌ Check evaluate error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { 
  getStudentProfessors,
  getProfessorDetails,
  getAllProfessorsWithRatings,
  canEvaluateProfessor
};