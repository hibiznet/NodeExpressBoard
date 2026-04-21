const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { idsEqual } = require('../utils/id');
const { createComment, getCommentById, updateComment, softDeleteComment } = require('../services/commentService');
const { getPostById } = require('../services/boardService');

router.post('/', async (req, res, next) => {
  try {
    const post = await getPostById(req.body.post_id);
    if (!post) {
      req.flash('error_msg', '게시글이 존재하지 않습니다.');
      return res.redirect('/boards');
    }

    if (!post.allow_guest_comment && !req.session.user) {
      req.flash('error_msg', '로그인 후 댓글 작성이 가능합니다.');
      return res.redirect(`/boards/${req.body.post_id}`);
    }

    await createComment({
      post_id: req.body.post_id,
      parent_comment_id: req.body.parent_comment_id || null,
      user_id: req.session.user?.id || null,
      guest_name: req.session.user ? null : req.body.guest_name,
      guest_password: req.session.user ? null : req.body.guest_password,
      content: req.body.content,
      created_ip: req.ip
    });

    req.flash('success_msg', '댓글이 등록되었습니다.');
    res.redirect(`/boards/${req.body.post_id}`);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const comment = await getCommentById(req.params.id);
    if (!comment) {
      req.flash('error_msg', '댓글이 없습니다.');
      return res.redirect('/boards');
    }

    let isAllowed = false;
    if (req.session.user && (idsEqual(req.session.user.id, comment.user_id) || req.session.user.role === 'ADMIN')) {
      isAllowed = true;
    } else if (!comment.user_id && req.body.guest_password && await bcrypt.compare(req.body.guest_password, comment.guest_password)) {
      isAllowed = true;
    }

    if (!isAllowed) {
      req.flash('error_msg', '댓글 수정 권한이 없습니다.');
      return res.redirect(`/boards/${comment.post_id}`);
    }

    await updateComment(req.params.id, req.body.content);
    req.flash('success_msg', '댓글이 수정되었습니다.');
    res.redirect(`/boards/${comment.post_id}`);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const comment = await getCommentById(req.params.id);
    if (!comment) {
      req.flash('error_msg', '댓글이 없습니다.');
      return res.redirect('/boards');
    }

    let isAllowed = false;
    if (req.session.user && (idsEqual(req.session.user.id, comment.user_id) || req.session.user.role === 'ADMIN')) {
      isAllowed = true;
    } else if (!comment.user_id && req.body.guest_password && await bcrypt.compare(req.body.guest_password, comment.guest_password)) {
      isAllowed = true;
    }

    if (!isAllowed) {
      req.flash('error_msg', '댓글 삭제 권한이 없습니다.');
      return res.redirect(`/boards/${comment.post_id}`);
    }

    await softDeleteComment(req.params.id);
    req.flash('success_msg', '댓글이 삭제되었습니다.');
    res.redirect(`/boards/${comment.post_id}`);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
