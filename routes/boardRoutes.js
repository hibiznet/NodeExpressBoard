const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { idsEqual } = require('../utils/id');
const { upload } = require('../services/fileUpload');
const {
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
} = require('../services/boardService');
const { canWritePost } = require('../middleware/permissions');
const { query } = require('../config/db');

router.get('/', async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const boardId = req.query.board_id || '';
    const categoryId = req.query.category_id || '';
    const keyword = req.query.keyword || '';

    const boards = await getBoards();
    const result = await listPosts({
      boardId: boardId || null,
      categoryId: categoryId || null,
      keyword,
      page,
      pageSize: 10
    });

    res.render('boards/index', {
      title: '통합게시판',
      boards,
      posts: result.list,
      pagination: {
        page,
        total: result.total,
        pageSize: 10,
        totalPages: Math.ceil(result.total / 10)
      },
      filters: { boardId, categoryId, keyword }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/new', async (req, res, next) => {
  try {
    const boards = await getBoards();
    res.render('boards/form', {
      title: '글쓰기',
      boards,
      post: null,
      files: []
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', upload.array('attachments', 5), async (req, res, next) => {
  try {
    const board = await getBoardById(req.body.board_id);
    if (!canWritePost(req, board)) {
      req.flash('error_msg', '해당 게시판은 로그인 후 작성 가능합니다.');
      return res.redirect('/boards');
    }

    const payload = {
      board_id: req.body.board_id,
      category_id: req.body.category_id || null,
      user_id: req.session.user?.id || null,
      guest_name: req.session.user ? null : req.body.guest_name,
      guest_password: req.session.user ? null : req.body.guest_password ? await bcrypt.hash(req.body.guest_password, 10) : null,
      title: req.body.title,
      content: req.body.content,
      is_notice: req.session.user?.role === 'ADMIN' && req.body.is_notice === 'on',
      created_ip: req.ip
    };

    const postId = await createPost(payload, req.files || []);
    req.flash('success_msg', '게시글이 등록되었습니다.');
    res.redirect(`/boards/${postId}`);
  } catch (error) {
    next(error);
  }
});

router.get('/share/:token', async (req, res, next) => {
  try {
    const rows = await query(`
      SELECT p.*, b.name AS board_name, c.name AS category_name,
             COALESCE(u.name, p.guest_name) AS author_name,
             (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count
      FROM posts p
      JOIN boards b ON b.id = p.board_id
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN users u ON u.id = p.user_id
      WHERE p.share_token = ? AND p.deleted_at IS NULL
      LIMIT 1
    `, [req.params.token]);

    const post = rows[0];
    if (!post) return res.status(404).render('error', { title: '404', message: '공유 게시글이 없습니다.' });

    const files = await getFilesByPostId(post.id);
    const comments = await getCommentsByPostId(post.id);
    res.render('boards/shared', { title: `공유 - ${post.title}`, post, files, comments });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    await increaseViewCount(req.params.id);
    const post = await getPostById(req.params.id);
    if (!post) return res.status(404).render('error', { title: '404', message: '게시글이 없습니다.' });

    const files = await getFilesByPostId(req.params.id);
    const comments = await getCommentsByPostId(req.params.id);
    const likedRows = await query(
      'SELECT id FROM likes WHERE post_id = ? AND ((user_id IS NOT NULL AND user_id = ?) OR (guest_ip IS NOT NULL AND guest_ip = ?))',
      [req.params.id, req.session.user?.id || 0, req.ip]
    );

    res.render('boards/detail', {
      title: post.title,
      post,
      files,
      comments,
      liked: likedRows.length > 0
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/edit', async (req, res, next) => {
  try {
    const boards = await getBoards();
    const post = await getPostById(req.params.id);
    if (!post) return res.status(404).render('error', { title: '404', message: '게시글이 없습니다.' });

    const isOwner = req.session.user && (idsEqual(req.session.user.id, post.user_id) || req.session.user.role === 'ADMIN');
    if (!isOwner) {
      req.flash('error_msg', '수정 권한이 없습니다.');
      return res.redirect(`/boards/${req.params.id}`);
    }

    const files = await getFilesByPostId(req.params.id);
    res.render('boards/form', {
      title: '글 수정',
      boards,
      post,
      files
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', upload.array('attachments', 5), async (req, res, next) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) return res.status(404).render('error', { title: '404', message: '게시글이 없습니다.' });

    const isOwner = req.session.user && (idsEqual(req.session.user.id, post.user_id) || req.session.user.role === 'ADMIN');
    if (!isOwner) {
      req.flash('error_msg', '수정 권한이 없습니다.');
      return res.redirect(`/boards/${req.params.id}`);
    }

    await updatePost(req.params.id, {
      board_id: req.body.board_id,
      category_id: req.body.category_id || null,
      title: req.body.title,
      content: req.body.content,
      is_notice: req.session.user?.role === 'ADMIN' && req.body.is_notice === 'on'
    }, req.files || []);

    req.flash('success_msg', '게시글이 수정되었습니다.');
    res.redirect(`/boards/${req.params.id}`);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) return res.status(404).render('error', { title: '404', message: '게시글이 없습니다.' });

    const isOwner = req.session.user && (idsEqual(req.session.user.id, post.user_id) || req.session.user.role === 'ADMIN');
    if (!isOwner) {
      req.flash('error_msg', '삭제 권한이 없습니다.');
      return res.redirect(`/boards/${req.params.id}`);
    }

    await softDeletePost(req.params.id);
    req.flash('success_msg', '게시글이 삭제되었습니다.');
    res.redirect('/boards');
  } catch (error) {
    next(error);
  }
});

router.post('/:id/like', async (req, res, next) => {
  try {
    const liked = await toggleLike(req.params.id, req.session.user?.id || null, req.ip);
    req.flash('success_msg', liked ? '좋아요를 눌렀습니다.' : '좋아요를 취소했습니다.');
    res.redirect(`/boards/${req.params.id}`);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/share', async (req, res, next) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) return res.status(404).render('error', { title: '404', message: '게시글이 없습니다.' });
    req.flash('success_msg', `공유 링크: ${(process.env.BASE_URL || 'http://localhost:3000')}/boards/share/${post.share_token}`);
    res.redirect(`/boards/${req.params.id}`);
  } catch (error) {
    next(error);
  }
});

router.delete('/:postId/files/:fileId', async (req, res, next) => {
  try {
    const post = await getPostById(req.params.postId);
    const isOwner = req.session.user && (idsEqual(req.session.user.id, post.user_id) || req.session.user.role === 'ADMIN');
    if (!isOwner) {
      req.flash('error_msg', '파일 삭제 권한이 없습니다.');
      return res.redirect(`/boards/${req.params.postId}/edit`);
    }
    await deleteFile(req.params.fileId);
    req.flash('success_msg', '첨부파일이 삭제되었습니다.');
    res.redirect(`/boards/${req.params.postId}/edit`);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
