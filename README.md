# 통합게시판 샘플 프로젝트

## 기술 스택
- Node.js
- Express
- MariaDB
- EJS
- Multer
- Express Session
- Quill Editor

## 포함 기능
1. 대댓글 포함 댓글 기능
2. 파일 업로드 기능
3. 좋아요 기능
4. 카테고리 기능
5. 글 공유 기능
6. 글쓰기 에디터 기능(Quill)
7. 게시판 / 글 / 회원 관리 기능
8. 회원/비회원 글쓰기 및 댓글 권한 기능

## 디렉터리 구조
- `app.js`: 애플리케이션 진입점
- `config/db.js`: DB 연결
- `routes/`: 인증/게시판/댓글/관리자 라우트
- `services/`: 게시글, 댓글, 인증, 업로드 처리
- `views/`: EJS 화면
- `sql/schema.sql`: DDL
- `sql/seed.sql`: 초기 데이터
- `sql/dml_examples.sql`: 대표 DML 예시

## 설치 방법
```bash
npm install
cp .env.example .env
```

`.env` 수정:
```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=1234
DB_NAME=integrated_board
SESSION_SECRET=change_this_secret
BASE_URL=http://localhost:3000
```

## DB 초기화
```sql
SOURCE sql/schema.sql;
SOURCE sql/seed.sql;
```

또는 MariaDB 콘솔에서:
```bash
mysql -u root -p < sql/schema.sql
mysql -u root -p integrated_board < sql/seed.sql
```

## 실행
```bash
npm install
npm start
```

브라우저 접속:
- `http://localhost:3000/boards`
- 관리자: `admin@example.com / 123456`
- 일반회원: `user1@example.com / 123456`

## 주요 화면
- 게시글 목록: `/boards`
- 게시글 상세: `/boards/:id`
- 게시글 작성: `/boards/new`
- 관리자 화면: `/admin`

## 권한 정책
- 게시판별로 `allow_guest_post`, `allow_guest_comment` 설정 가능
- 회원 글은 작성자 본인 또는 관리자만 수정/삭제 가능
- 비회원 댓글은 비밀번호 검증 후 수정/삭제 가능
- 공지글은 관리자만 등록 가능

## 보완 포인트
실서비스 적용 시 아래 추가 권장:
- CSRF 방어
- XSS sanitizing
- 이미지 썸네일 처리
- 파일 확장자 화이트리스트
- 관리자 로그/audit
- 비회원 게시글 수정용 비밀번호 검증 별도 구현
- Redis 세션 저장소
- API/SSR 분리

## 주의
이 프로젝트는 빠른 PoC 및 내부 시연용 템플릿입니다. 운영 투입 전 보안/예외처리/검증을 강화해야 합니다.


## BigInt compatibility

This project normalizes MariaDB `BIGINT` values before they reach session serialization or view rendering.
- Safe-range `BIGINT` values are converted to JavaScript `Number`.
- Out-of-range `BIGINT` values are converted to `String`.
- Session user IDs are always stored as strings to avoid `JSON.stringify` failures in `express-session`.
