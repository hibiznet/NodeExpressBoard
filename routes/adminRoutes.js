const express = require('express');
const router = express.Router();
const { ensureAdmin } = require('../middleware/auth');
const { query } = require('../config/db');

router.use(ensureAdmin);

router.get('/', async (req, res, next) => {
  try {
    const users = await query('SELECT id, email, name, role, status, created_at FROM users ORDER BY id DESC');
    const boards = await query(`SELECT b.*, c.name AS category_name FROM boards b LEFT JOIN categories c ON c.id = b.category_id ORDER BY b.id DESC`);
    const posts = await query(`
      SELECT p.id, p.title, p.created_at, p.deleted_at, b.name AS board_name, COALESCE(u.name, p.guest_name) AS author_name
      FROM posts p
      JOIN boards b ON b.id = p.board_id
      LEFT JOIN users u ON u.id = p.user_id
      ORDER BY p.id DESC LIMIT 20
    `);
    const categories = await query('SELECT * FROM categories ORDER BY sort_order ASC, id ASC');
    res.render('admin/dashboard', { title: '관리자', users, boards, posts, categories });
  } catch (error) {
    next(error);
  }
});

router.post('/boards', async (req, res, next) => {
  try {
    await query(`
      INSERT INTO boards (category_id, name, description, allow_guest_post, allow_guest_comment, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.body.category_id || null,
      req.body.name,
      req.body.description || null,
      req.body.allow_guest_post === 'on' ? 1 : 0,
      req.body.allow_guest_comment === 'on' ? 1 : 0,
      req.body.is_active === 'on' ? 1 : 0
    ]);
    req.flash('success_msg', '게시판이 등록되었습니다.');
    res.redirect('/admin');
  } catch (error) {
    next(error);
  }
});

router.put('/boards/:id', async (req, res, next) => {
  try {
    await query(`
      UPDATE boards
      SET category_id = ?, name = ?, description = ?, allow_guest_post = ?, allow_guest_comment = ?, is_active = ?
      WHERE id = ?
    `, [
      req.body.category_id || null,
      req.body.name,
      req.body.description || null,
      req.body.allow_guest_post === 'on' ? 1 : 0,
      req.body.allow_guest_comment === 'on' ? 1 : 0,
      req.body.is_active === 'on' ? 1 : 0,
      req.params.id
    ]);
    req.flash('success_msg', '게시판이 수정되었습니다.');
    res.redirect('/admin');
  } catch (error) {
    next(error);
  }
});

router.post('/categories', async (req, res, next) => {
  try {
    await query('INSERT INTO categories (name, slug, sort_order, is_active) VALUES (?, ?, ?, ?)', [
      req.body.name,
      req.body.slug,
      req.body.sort_order || 0,
      req.body.is_active === 'on' ? 1 : 0
    ]);
    req.flash('success_msg', '카테고리가 등록되었습니다.');
    res.redirect('/admin');
  } catch (error) {
    next(error);
  }
});

router.put('/categories/:id', async (req, res, next) => {
  try {
    await query('UPDATE categories SET name = ?, slug = ?, sort_order = ?, is_active = ? WHERE id = ?', [
      req.body.name,
      req.body.slug,
      req.body.sort_order || 0,
      req.body.is_active === 'on' ? 1 : 0,
      req.params.id
    ]);
    req.flash('success_msg', '카테고리가 수정되었습니다.');
    res.redirect('/admin');
  } catch (error) {
    next(error);
  }
});

router.put('/users/:id', async (req, res, next) => {
  try {
    await query('UPDATE users SET role = ?, status = ? WHERE id = ?', [req.body.role, req.body.status, req.params.id]);
    req.flash('success_msg', '회원 정보가 수정되었습니다.');
    res.redirect('/admin');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
