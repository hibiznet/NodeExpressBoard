const mariadb = require('mariadb');
const { normalizeBigInt } = require('../utils/normalize');

const pool = mariadb.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'integrated_board',
  connectionLimit: 10,
  multipleStatements: true
});

async function query(sql, params = []) {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(sql, params);
    return normalizeBigInt(result);
  } finally {
    if (conn) conn.release();
  }
}

async function getConnection() {
  return pool.getConnection();
}

module.exports = { query, getConnection, pool };
