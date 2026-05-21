const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
  timezone:           'Z',
});

pool.getConnection()
  .then(c => { console.log('✅  MySQL connected'); c.release(); })
  .catch(e => { console.error('❌  MySQL error:', e.message); process.exit(1); });

module.exports = pool;
