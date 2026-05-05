const db = require('../config/database');

const getStudentProfessors = async (req, res) => {
  try {
    const studentNo = req.studentNo;

    const sql = `
      SELECT DISTINCT 
        p.PROFESSOR_ID,
        p.NAME as PROFESSOR_NAME,
        s.SUBJECT_CODE,
        s.SUBJECT_NAME,
        c.CLASS_ID,
        c.SECTION,
        c.SCHOOL_YEAR,
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
      professors: result.rows.map(row => ({
        professorId: row.PROFESSOR_ID,
        name: row.PROFESSOR_NAME,
        course: row.SUBJECT_CODE,
        subjectName: row.SUBJECT_NAME,
        classId: row.CLASS_ID,
        section: row.SECTION,
        schoolYear: row.SCHOOL_YEAR,
        enrollmentId: row.ENROLLMENT_ID,
        evaluated: row.EVALUATED === 1
      }))
    });
  } catch (error) {
    console.error('Error fetching professors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getStudentProfessors };