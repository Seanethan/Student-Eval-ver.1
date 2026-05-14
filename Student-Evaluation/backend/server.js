const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const professorRoutes = require('./routes/professorRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const functionRoutes = require('./routes/functionRoutes'); // ✅ ADD THIS LINE

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// MIDDLEWARE
// =========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// ROUTES
// =========================
app.use('/api/auth', authRoutes);
app.use('/api/professors', professorRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/functions', functionRoutes); // ✅ ADD THIS LINE - Function endpoints

// =========================
// HEALTH CHECK
// =========================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// =========================
// ADDITIONAL TEST ENDPOINTS FOR TEACHER DEMONSTRATION
// =========================

// Test endpoint to demonstrate all Oracle functions are working
app.get('/api/demo/functions', async (req, res) => {
  console.log('🧪 DEMO: Testing all Oracle functions');
  
  const results = {
    timestamp: new Date().toISOString(),
    functionTests: {}
  };
  
  try {
    // Test 1: count_enrollments
    const enrollResult = await db.execute(
      `SELECT count_enrollments('24-1234') AS result FROM DUAL`
    );
    results.functionTests.count_enrollments = {
      called: "count_enrollments('24-1234')",
      result: enrollResult.rows[0].RESULT,
      sql: "SELECT count_enrollments('24-1234') FROM DUAL"
    };
    
    // Test 2: get_avg_rating
    const avgResult = await db.execute(
      `SELECT get_avg_rating(1) AS result FROM DUAL`
    );
    results.functionTests.get_avg_rating = {
      called: "get_avg_rating(1)",
      result: avgResult.rows[0].RESULT,
      sql: "SELECT get_avg_rating(1) FROM DUAL"
    };
    
    // Test 3: is_evaluated
    const isEvalResult = await db.execute(
      `SELECT is_evaluated(1) AS result FROM DUAL`
    );
    results.functionTests.is_evaluated = {
      called: "is_evaluated(1)",
      result: isEvalResult.rows[0].RESULT === 1 ? 'YES (1)' : 'NO (0)',
      sql: "SELECT is_evaluated(1) FROM DUAL"
    };
    
    // Test 4: has_completed_all_evaluations
    const completionResult = await db.execute(
      `SELECT has_completed_all_evaluations('24-1234') AS result FROM DUAL`
    );
    results.functionTests.has_completed_all_evaluations = {
      called: "has_completed_all_evaluations('24-1234')",
      result: completionResult.rows[0].RESULT,
      sql: "SELECT has_completed_all_evaluations('24-1234') FROM DUAL"
    };
    
    // Test 5: get_category_avg_rating
    const catResult = await db.execute(
      `SELECT get_category_avg_rating(1, 'Teaching') AS result FROM DUAL`
    );
    results.functionTests.get_category_avg_rating = {
      called: "get_category_avg_rating(1, 'Teaching')",
      result: catResult.rows[0].RESULT,
      sql: "SELECT get_category_avg_rating(1, 'Teaching') FROM DUAL"
    };
    
    // Test 6: get_total_evaluations
    const totalResult = await db.execute(
      `SELECT get_total_evaluations(1) AS result FROM DUAL`
    );
    results.functionTests.get_total_evaluations = {
      called: "get_total_evaluations(1)",
      result: totalResult.rows[0].RESULT,
      sql: "SELECT get_total_evaluations(1) FROM DUAL"
    };
    
    // Test 7: count_responses
    const countRespResult = await db.execute(
      `SELECT count_responses(1) AS result FROM DUAL`
    );
    results.functionTests.count_responses = {
      called: "count_responses(1)",
      result: countRespResult.rows[0].RESULT,
      sql: "SELECT count_responses(1) FROM DUAL"
    };
    
    results.success = true;
    results.message = "All Oracle functions are working correctly!";
    
    console.log('✅ All function tests passed');
    res.json(results);
    
  } catch (error) {
    console.error('❌ Function test failed:', error);
    results.success = false;
    results.error = error.message;
    res.status(500).json(results);
  }
});

// Simple endpoint to list all available functions
app.get('/api/demo/functions-list', async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT 
        object_name AS function_name,
        object_type,
        status
      FROM user_objects 
      WHERE object_type = 'FUNCTION'
      ORDER BY object_name
    `);
    
    res.json({
      success: true,
      functions: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error listing functions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =========================
// 404 HANDLER
// =========================
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

// =========================
// GLOBAL ERROR HANDLER
// =========================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error'
  });
});

// =========================
// START SERVER
// =========================
async function startServer() {
  try {
    await db.initialize();

    app.listen(PORT, () => {
      console.log(`\n=========================================`);
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`=========================================`);
      console.log(`📋 Available endpoints:`);
      console.log(`   - POST   /api/auth/login`);
      console.log(`   - GET    /api/professors/student-professors`);
      console.log(`   - GET    /api/evaluations/questions`);
      console.log(`   - POST   /api/evaluations/submit`);
      console.log(`   - GET    /api/evaluations/status`);
      console.log(`   - GET    /api/functions/list`);
      console.log(`   - GET    /api/functions/get-avg-rating/:id`);
      console.log(`   - GET    /api/functions/count-enrollments/:studentId`);
      console.log(`   - GET    /api/demo/functions (TEST ALL FUNCTIONS)`);
      console.log(`   - GET    /api/demo/functions-list`);
      console.log(`=========================================\n`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// =========================
// GRACEFUL SHUTDOWN
// =========================
process.on('SIGINT', async () => {
  console.log('\n📴 Shutting down server...');
  await db.close();
  process.exit(0);
});

startServer();