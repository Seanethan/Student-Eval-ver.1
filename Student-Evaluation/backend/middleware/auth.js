const authMiddleware = (req, res, next) => {
  const studentNo = req.headers['x-student-number'];
  
  if (!studentNo) {
    return res.status(401).json({ error: 'Student number is required' });
  }
  
  req.studentNo = studentNo;
  next();
};

module.exports = authMiddleware;