const express = require('express');
const router = express.Router();
const { createUser, findUserByEmail, verifyPassword } = require('../services/authService');
const { normalizeSessionUser } = require('../utils/normalize');

router.get('/login', (req, res) => {
  res.render('auth/login', { title: '로그인' });
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) {
      req.flash('error_msg', '이메일 또는 비밀번호가 올바르지 않습니다.');
      return res.redirect('/login');
    }
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      req.flash('error_msg', '이메일 또는 비밀번호가 올바르지 않습니다.');
      return res.redirect('/login');
    }
    req.session.user = normalizeSessionUser(user);
    req.flash('success_msg', '로그인되었습니다.');
    res.redirect('/boards');
  } catch (error) {
    next(error);
  }
});

router.get('/register', (req, res) => {
  res.render('auth/register', { title: '회원가입' });
});

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const exists = await findUserByEmail(email);
    if (exists) {
      req.flash('error_msg', '이미 사용 중인 이메일입니다.');
      return res.redirect('/register');
    }
    await createUser({ email, password, name });
    req.flash('success_msg', '회원가입이 완료되었습니다. 로그인해주세요.');
    res.redirect('/login');
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
