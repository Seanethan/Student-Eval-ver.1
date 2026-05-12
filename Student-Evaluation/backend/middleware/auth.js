const authMiddleware = (req, res, next) => {
  const studentId = req.headers['x-student-number'];

  if (!studentId || studentId.trim() === "") {
    return res.status(401).json({ error: 'Student ID is required' });
  }

  req.studentId = studentId.trim();
  next();
};

module.exports = authMiddleware;