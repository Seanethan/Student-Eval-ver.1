const db = require('../config/database');

const loginStudent = async (req, res) => {
  try {
    const { studentNumber } = req.body;

    if (!studentNumber) {
      return res.status(400).json({ error: 'Student number is required' });
    }

    // Debug: Check current schema
    const schemaResult = await db.execute(`SELECT SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') AS SCHEMA_NAME FROM DUAL`);
    console.log('Current schema:', schemaResult.rows[0]);

    // Debug: Try without WHERE first
    const allResult = await db.execute(`SELECT * FROM Students`);
    console.log('All students (no filter):', allResult.rows.length);
    if (allResult.rows.length > 0) {
      console.log('First student ID:', allResult.rows[0].STUDENT_ID);
    }

    // Debug: Try the actual query
    const sql = `SELECT * FROM Students WHERE STUDENT_ID = :sn`;
    const binds = { sn: studentNumber };
    const result = await db.execute(sql, binds);
    console.log('Filtered result rows:', result.rows.length);

    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Student not found',
        debug: {
          schema: schemaResult.rows[0],
          totalStudents: allResult.rows.length,
          searchedFor: studentNumber
        }
      });
    }

    const student = result.rows[0];
    
    res.json({
      success: true,
      student: {
        studentId: student.STUDENT_ID,
        yearEnrolled: student.YEAR_ENROLLED,
        studentNumber: student.STUDENT_NUMBER,
        campusCode: student.CAMPUS_CODE,
        courseCode: student.COURSE_CODE,
        yearLevel: student.YEAR_LEVEL,
        section: student.SECTION,
        status: student.STATUS
      }
    });
  } catch (error) {
    console.error('Login error details:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

module.exports = { loginStudent };