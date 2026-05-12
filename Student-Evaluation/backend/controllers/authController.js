const db = require('../config/database');

const loginStudent = async (req, res) => {
  try {
    const studentNumber = req.body.studentNumber?.trim();

    if (!studentNumber) {
      return res.status(400).json({ error: 'Student number is required' });
    }

    const sql = `
      SELECT * FROM system.Students
      WHERE student_id = :studentNumber
    `;

    const result = await db.execute(sql, { studentNumber });

    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({ error: 'Student not found' });
    }

    const student = result.rows[0];

    res.json({
      success: true,
      student: {
        studentId: student.STUDENT_ID,
        courseCode: student.COURSE_CODE,
        yearLevel: student.YEAR_LEVEL,
        section: student.SECTION
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { loginStudent };