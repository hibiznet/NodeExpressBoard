function ensureAuthenticated(req, res, next) {
  if (!req.session.user) {
    req.flash('error_msg', '로그인이 필요합니다.');
    return res.redirect('/login');
  }
  next();
}

function ensureAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'ADMIN') {
    req.flash('error_msg', '관리자 권한이 필요합니다.');
    return res.redirect('/boards');
  }
  next();
}

module.exports = { ensureAuthenticated, ensureAdmin };
