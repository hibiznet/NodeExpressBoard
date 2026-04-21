require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const dayjs = require('dayjs');
const { normalizeBigInt, normalizeSessionUser } = require('./utils/normalize');

const authRoutes = require('./routes/authRoutes');
const boardRoutes = require('./routes/boardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const commentRoutes = require('./routes/commentRoutes');
const { loadCommonData } = require('./middleware/commonData');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(expressLayouts);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  if (req.session) {
    if (req.session.user) {
      req.session.user = normalizeSessionUser(req.session.user);
    }
    Object.assign(req.session, normalizeBigInt(req.session));
  }
  next();
});

app.use(flash());

app.locals.dayjs = dayjs;

app.use(loadCommonData);

app.get('/', (req, res) => {
  res.redirect('/boards');
});

app.use('/', authRoutes);
app.use('/boards', boardRoutes);
app.use('/comments', commentRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('error', { title: '404', message: '페이지를 찾을 수 없습니다.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', {
    title: '오류',
    message: err.message || '서버 오류가 발생했습니다.'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
