USE itgboard;

-- 게시글 등록
INSERT INTO posts (board_id, category_id, user_id, title, content, share_token, created_ip)
VALUES (2, 2, 2, '새 글 제목', '<p>본문 내용</p>', UUID(), '127.0.0.1');

-- 게시글 목록 조회
SELECT p.id, p.title, p.view_count, p.created_at, b.name AS board_name,
       COALESCE(u.name, p.guest_name) AS author_name
FROM posts p
JOIN boards b ON b.id = p.board_id
LEFT JOIN users u ON u.id = p.user_id
WHERE p.deleted_at IS NULL
ORDER BY p.is_notice DESC, p.id DESC;

-- 게시글 단건 상세 조회
SELECT * FROM posts WHERE id = 1 AND deleted_at IS NULL;

-- 게시글 수정
UPDATE posts
SET title = '수정된 제목', content = '<p>수정된 본문</p>', updated_at = NOW()
WHERE id = 1;

-- 게시글 삭제(소프트 삭제)
UPDATE posts SET deleted_at = NOW() WHERE id = 1;

-- 댓글 등록
INSERT INTO comments (post_id, user_id, content, created_ip)
VALUES (1, 2, '댓글 내용', '127.0.0.1');

-- 좋아요 등록
INSERT INTO likes (post_id, user_id) VALUES (1, 2);

-- 게시판 등록
INSERT INTO boards (category_id, name, description, allow_guest_post, allow_guest_comment, is_active)
VALUES (2, '신규게시판', '설명', 1, 1, 1);
