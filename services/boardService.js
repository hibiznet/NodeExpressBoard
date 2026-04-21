const { query, getConnection } = require('../config/db');

async function getBoards() {
  return query(`
    SELECT b.*, c.name AS category_name,
           (SELECT COUNT(*) FROM posts p WHERE p.board_id = b.id AND p.deleted_at IS NULL) AS post_count
    FROM boards b
    LEFT JOIN categories c ON c.id = b.category_id
    WHERE b.is_active = 1
    ORDER BY b.id ASC
  `);
}

async function getBoardById(id) {
  const rows = await query('SELECT * FROM boards WHERE id = ?', [id]);
  return rows[0];
}

async function listPosts({ boardId, categoryId, keyword, page = 1, pageSize = 10 }) {
  const offset = (page - 1) * pageSize;
  let where = 'WHERE p.deleted_at IS NULL';
  const params = [];

  if (boardId) {
    where += ' AND p.board_id = ?';
    params.push(boardId);
  }
  if (categoryId) {
    where += ' AND p.category_id = ?';
    params.push(categoryId);
  }
  if (keyword) {
    where += ' AND (p.title LIKE ? OR p.content LIKE ? OR COALESCE(u.name, p.guest_name) LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const list = await query(`
    SELECT p.*, b.name AS board_name, c.name AS category_name,
           COALESCE(u.name, p.guest_name) AS author_name,
           (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id AND cm.deleted_at IS NULL) AS comment_count,
           (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
           (SELECT COUNT(*) FROM files f WHERE f.post_id = p.id) AS file_count
    FROM posts p
    JOIN boards b ON b.id = p.board_id
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN users u ON u.id = p.user_id
    ${where}
    ORDER BY p.is_notice DESC, p.id DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset]);

  const totalRows = await query(`SELECT COUNT(*) AS cnt FROM posts p ${where}`, params);
  return { list, total: Number(totalRows[0].cnt) };
}

async function getPostById(id) {
  const rows = await query(`
    SELECT p.*, b.name AS board_name, b.allow_guest_post, b.allow_guest_comment,
           c.name AS category_name, COALESCE(u.name, p.guest_name) AS author_name,
           u.email AS author_email,
           (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count
    FROM posts p
    JOIN boards b ON b.id = p.board_id
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN users u ON u.id = p.user_id
    WHERE p.id = ? AND p.deleted_at IS NULL
  `, [id]);
  return rows[0];
}

async function getFilesByPostId(postId) {
  return query('SELECT * FROM files WHERE post_id = ? ORDER BY id ASC', [postId]);
}

async function getCommentsByPostId(postId) {
  return query(`
    SELECT c.*, COALESCE(u.name, c.guest_name) AS author_name
    FROM comments c
    LEFT JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ? AND c.deleted_at IS NULL
    ORDER BY c.parent_comment_id ASC, c.id ASC
  `, [postId]);
}

async function createPost(data, files = []) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const result = await conn.query(`
      INSERT INTO posts
      (board_id, category_id, user_id, guest_name, guest_password, title, content, is_notice, share_token, created_ip)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, UUID(), ?)
    `, [
      data.board_id,
      data.category_id || null,
      data.user_id || null,
      data.guest_name || null,
      data.guest_password || null,
      data.title,
      data.content,
      data.is_notice ? 1 : 0,
      data.created_ip || null
    ]);

    const postId = Number(result.insertId);
    for (const file of files) {
      await conn.query(`
        INSERT INTO files (post_id, original_name, saved_name, file_path, mime_type, file_size)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [postId, file.originalname, file.filename, `/uploads/${file.filename}`, file.mimetype, file.size]);
    }

    await conn.commit();
    return postId;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function updatePost(id, data, files = []) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`
      UPDATE posts
      SET board_id = ?, category_id = ?, title = ?, content = ?, is_notice = ?, updated_at = NOW()
      WHERE id = ?
    `, [data.board_id, data.category_id || null, data.title, data.content, data.is_notice ? 1 : 0, id]);

    for (const file of files) {
      await conn.query(`
        INSERT INTO files (post_id, original_name, saved_name, file_path, mime_type, file_size)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, file.originalname, file.filename, `/uploads/${file.filename}`, file.mimetype, file.size]);
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function softDeletePost(id) {
  await query('UPDATE posts SET deleted_at = NOW() WHERE id = ?', [id]);
}

async function increaseViewCount(id) {
  await query('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [id]);
}

async function toggleLike(postId, userId, guestIp) {
  const exists = await query('SELECT id FROM likes WHERE post_id = ? AND ((user_id IS NOT NULL AND user_id = ?) OR (guest_ip IS NOT NULL AND guest_ip = ?))', [postId, userId || 0, guestIp || '']);
  if (exists.length) {
    await query('DELETE FROM likes WHERE id = ?', [exists[0].id]);
    return false;
  }
  await query('INSERT INTO likes (post_id, user_id, guest_ip) VALUES (?, ?, ?)', [postId, userId || null, guestIp || null]);
  return true;
}

async function deleteFile(fileId) {
  await query('DELETE FROM files WHERE id = ?', [fileId]);
}

module.exports = {
  getBoards,
  getBoardById,
  listPosts,
  getPostById,
  getFilesByPostId,
  getCommentsByPostId,
  createPost,
  updatePost,
  softDeletePost,
  increaseViewCount,
  toggleLike,
  deleteFile
};
