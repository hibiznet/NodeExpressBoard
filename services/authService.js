const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

async function findUserByEmail(email) {
  const rows = await query('SELECT * FROM users WHERE email = ? AND status = ? LIMIT 1', [email, 'ACTIVE']);
  return rows[0];
}

async function createUser({ email, password, name }) {
  const hash = await bcrypt.hash(password, 10);
  const result = await query('INSERT INTO users (email, password_hash, name, role, status) VALUES (?, ?, ?, ?, ?)', [email, hash, name, 'USER', 'ACTIVE']);
  return result.insertId;
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { findUserByEmail, createUser, verifyPassword };
