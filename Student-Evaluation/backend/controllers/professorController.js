const db = require('../config/database');
const oracledb = require('oracledb');

const getStudentProfessors = async (req, res) => {
  try {
    const studentNo = req.studentNo || req.studentId || req.headers['x-student-number'];

    if (!studentNo) {
      return res.status(400).json({ error: 'Student number is required' });
    }

    console.log("FETCHING PROFESSORS FOR:", studentNo);

    // Check if student exists
    const studentCheck = await db.execute(
      'SELECT * FROM system.students WHERE student_id = :studentNo',
      { studentNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log("STUDENT EXISTS?", studentCheck.rows.length);

    // Check enrollments
    const enrollCheck = await db.execute(
      'SELECT * FROM system.enrollments WHERE student_id = :studentNo',
      { studentNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log("ENROLLMENTS FOUND:", enrollCheck.rows.length);

    // Main query - only current school year
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
        CASE WHEN ev.evaluation_id IS NOT NULL THEN 1 ELSE 0 END AS evaluated
      FROM system.students st
      JOIN system.enrollments e ON st.student_id = e.student_id
      JOIN system.classes c ON e.class_id = c.class_id
      JOIN system.professors p ON c.professor_id = p.professor_id
      JOIN system.subjects s ON c.subject_code = s.subject_code
      LEFT JOIN system.evaluations ev ON e.enrollment_id = ev.enrollment_id
      WHERE st.student_id = :studentNo
        AND c.school_year = '2025-2026'
      ORDER BY e.enrollment_id
    `;

    const result = await db.execute(
      sql,
      { studentNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log("PROFESSORS FOUND:", result.rows.length);
    if (result.rows.length > 0) {
      console.log("FIRST ROW:", result.rows[0]);
    }

    res.json({
      success: true,
      professors: result.rows
    });

  } catch (err) {
    console.error("Professor fetch error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getStudentProfessors };