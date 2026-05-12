const db = require('../config/database');
const oracledb = require('oracledb');

const getStudentProfessors = async (req, res) => {
  try {
    const studentNo = req.studentNo;

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
    `;

    const result = await db.execute(
      sql,
      { studentNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT } // 🔥 IMPORTANT FIX
    );

    res.json({
      success: true,
      professors: result.rows
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getStudentProfessors };