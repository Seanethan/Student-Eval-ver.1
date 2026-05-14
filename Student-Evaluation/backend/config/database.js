const oracledb = require('oracledb');
require('dotenv').config();

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// ⚠️ Turn OFF global autoCommit (important for transactions)
oracledb.autoCommit = false;

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1
};

// =========================
// HELPER: Set schema for connection
// =========================
async function setSchema(connection) {
  try {
    await connection.execute(`ALTER SESSION SET CURRENT_SCHEMA = system`);
    console.log('✅ Schema set to SYSTEM');
  } catch (err) {
    console.error('❌ Failed to set schema:', err);
    throw err;
  }
}

// =========================
// INIT POOL
// =========================
async function initialize() {
  try {
    await oracledb.createPool(dbConfig);
    console.log('✅ Oracle DB pool created');
    
    // Test connection and set schema
    let testConn;
    try {
      testConn = await oracledb.getConnection();
      await setSchema(testConn);
      console.log('✅ Schema verified');
    } catch (err) {
      console.error('⚠️ Schema test failed:', err.message);
    } finally {
      if (testConn) await testConn.close();
    }
    
  } catch (err) {
    console.error('❌ Pool creation error:', err);
    throw err;
  }
}

// =========================
// CLOSE POOL
// =========================
async function close() {
  try {
    await oracledb.getPool().close(10);
    console.log('✅ Pool closed');
  } catch (err) {
    console.error('❌ Pool close error:', err);
  }
}

// =========================
// SIMPLE EXECUTE (AUTO COMMIT OPTION)
// =========================
async function execute(sql, binds = {}, options = {}) {
  let connection;

  try {
    connection = await oracledb.getConnection();
    
    // Set the schema for this connection
    await setSchema(connection);

    const result = await connection.execute(sql, binds, {
      autoCommit: true,
      ...options
    });

    return result;
  } catch (err) {
    console.error('❌ DB Execute Error:', err);
    throw err;
  } finally {
    if (connection) await connection.close();
  }
}

// =========================
// TRANSACTION SUPPORT (IMPORTANT FOR EVALUATIONS)
// =========================
async function executeTransaction(callback) {
  let connection;

  try {
    connection = await oracledb.getConnection();
    
    // Set the schema for this connection
    await setSchema(connection);

    const result = await callback(connection);

    await connection.commit();
    return result;

  } catch (err) {
    if (connection) await connection.rollback();
    console.error('❌ Transaction Error:', err);
    throw err;

  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  initialize,
  close,
  execute,
  executeTransaction
};