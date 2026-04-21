const { query } = require('../config/db');

async function loadCommonData(req, res, next) {
  try {
    const categories = await query('SELECT id, name, slug FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC');
    res.locals.currentUser = req.session.user || null;
    res.locals.categories = categories;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { loadCommonData };
