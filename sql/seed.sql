USE itgboard;

INSERT INTO users (email, password_hash, name, role, status) VALUES
('admin@example.com', '$2a$10$Es1QO3jVY7Myn9.WcMBZ6uJIo0NGdisz8Iky3Uczdlz7YT1Do1B4a', '관리자', 'ADMIN', 'ACTIVE'),
('user1@example.com', '$2a$10$Es1QO3jVY7Myn9.WcMBZ6uJIo0NGdisz8Iky3Uczdlz7YT1Do1B4a', '일반회원1', 'USER', 'ACTIVE'),
('user2@example.com', '$2a$10$Es1QO3jVY7Myn9.WcMBZ6uJIo0NGdisz8Iky3Uczdlz7YT1Do1B4a', '일반회원2', 'USER', 'ACTIVE');

INSERT INTO categories (name, slug, sort_order, is_active) VALUES
('공지', 'notice', 1, 1),
('자유', 'free', 2, 1),
('자료실', 'archive', 3, 1),
('QNA', 'qna', 4, 1);

INSERT INTO boards (category_id, name, description, allow_guest_post, allow_guest_comment, is_active) VALUES
(1, '공지사항', '운영 공지 게시판', 0, 0, 1),
(2, '자유게시판', '자유롭게 글을 작성하는 공간', 1, 1, 1),
(3, '자료실', '파일 업로드 중심 게시판', 0, 1, 1),
(4, '질문답변', '질문과 답변 게시판', 1, 1, 1);

INSERT INTO posts (board_id, category_id, user_id, title, content, is_notice, share_token, created_ip) VALUES
(1, 1, 1, '통합게시판 오픈 안내', '<p>통합게시판 샘플 데이터입니다.</p>', 1, UUID(), '127.0.0.1'),
(2, 2, 2, '첫 자유게시글', '<p>자유게시판 예시 글입니다.</p>', 0, UUID(), '127.0.0.1'),
(4, 4, NULL, '비회원 질문 예시', '<p>비회원도 질문 가능합니다.</p>', 0, UUID(), '127.0.0.1');

UPDATE posts SET guest_name = '비회원작성자', guest_password = '$2a$10$Es1QO3jVY7Myn9.WcMBZ6uJIo0NGdisz8Iky3Uczdlz7YT1Do1B4a' WHERE id = 3;

INSERT INTO comments (post_id, parent_comment_id, user_id, content, created_ip) VALUES
(1, NULL, 2, '오픈 축하드립니다.', '127.0.0.1'),
(2, NULL, 1, '관리자 댓글 예시입니다.', '127.0.0.1');

INSERT INTO comments (post_id, parent_comment_id, guest_name, guest_password, content, created_ip) VALUES
(3, NULL, '비회원댓글러', '$2a$10$Es1QO3jVY7Myn9.WcMBZ6uJIo0NGdisz8Iky3Uczdlz7YT1Do1B4a', '비회원 댓글 예시입니다.', '127.0.0.1');

INSERT INTO likes (post_id, user_id) VALUES
(1, 2),
(2, 1);
