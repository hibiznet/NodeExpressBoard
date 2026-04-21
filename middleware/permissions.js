function canWritePost(req, board) {
  if (!board || !board.allow_guest_post) {
    return !!req.session.user;
  }
  return true;
}

function canWriteComment(req, board) {
  if (!board || !board.allow_guest_comment) {
    return !!req.session.user;
  }
  return true;
}

module.exports = { canWritePost, canWriteComment };
