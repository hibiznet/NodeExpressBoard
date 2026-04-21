const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

async function createComment(data) {
  const hash = data.guest_password ? await bcrypt.hash(data.guest_password, 10) : null;
  await query(`
    INSERT INTO comments (post_id, parent_comment_id, user_id, guest_name, guest_password, content, created_ip)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    data.post_id,
    data.parent_comment_id || null,
    data.user_id || null,
    data.guest_name || null,
    hash,
    data.content,
    data.created_ip || null
  ]);
}

async function getCommentById(id) {
  const rows = await query('SELECT * FROM comments WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function updateComment(id, content) {
  await query('UPDATE comments SET content = ?, updated_at = NOW() WHERE id = ?', [content, id]);
}

async function softDeleteComment(id) {
  await query('UPDATE comments SET deleted_at = NOW() WHERE id = ?', [id]);
}

module.exports = { createComment, getCommentById, updateComment, softDeleteComment };
