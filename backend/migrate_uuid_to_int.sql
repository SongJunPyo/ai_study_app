-- ==========================
-- UUID → INT 마이그레이션 스크립트
-- ==========================
-- 경고: 이 스크립트는 기존 데이터를 모두 삭제합니다!
-- 중요한 데이터가 있다면 먼저 백업하세요!

BEGIN;

-- ==========================
-- 1단계: 기존 데이터 백업 (선택사항)
-- ==========================
-- 필요시 주석 해제하여 백업 테이블 생성
-- CREATE TABLE users_backup AS SELECT * FROM users;
-- CREATE TABLE folders_backup AS SELECT * FROM folders;
-- CREATE TABLE documents_backup AS SELECT * FROM documents;
-- CREATE TABLE document_chunks_backup AS SELECT * FROM document_chunks;
-- CREATE TABLE quizzes_backup AS SELECT * FROM quizzes;

-- ==========================
-- 2단계: 기존 테이블 삭제 (CASCADE로 종속 테이블도 정리)
-- ==========================
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS document_chunks CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==========================
-- 3단계: INT 기반 새 테이블 생성
-- ==========================

-- 사용자 테이블
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 폴더 테이블
CREATE TABLE folders (
    folder_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    folder_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 문서 테이블
CREATE TABLE documents (
    doc_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    folder_id INTEGER REFERENCES folders(folder_id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    summary_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 청크 테이블 (RAG 임베딩 저장)
CREATE TABLE document_chunks (
    chunk_id SERIAL PRIMARY KEY,
    doc_id INTEGER NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    page_number INTEGER,
    embedding VECTOR(3072),  -- text-embedding-3-large 기준
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 퀴즈 테이블
CREATE TABLE quizzes (
    quiz_id SERIAL PRIMARY KEY,
    doc_id INTEGER NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
    quiz_data JSONB NOT NULL,   -- LLM이 생성한 문제와 답변 저장
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- 4단계: 인덱스 생성 (검색 최적화)
-- ==========================
-- 문서별 청크 조회
CREATE INDEX idx_chunks_doc_id ON document_chunks(doc_id);

-- 폴더별 문서 조회
CREATE INDEX idx_documents_folder_id ON documents(folder_id);

-- 사용자별 문서 조회
CREATE INDEX idx_documents_user_id ON documents(user_id);

-- 사용자별 폴더 조회
CREATE INDEX idx_folders_user_id ON folders(user_id);

-- 문서별 퀴즈 조회
CREATE INDEX idx_quizzes_doc_id ON quizzes(doc_id);

-- ==========================
-- 5단계: 샘플 데이터 삽입 (선택사항)
-- ==========================
-- 테스트용 사용자 생성
INSERT INTO users (email, password) VALUES
    ('test@example.com', 'hashed_password_123'),
    ('admin@example.com', 'hashed_password_456');

-- 테스트용 폴더 생성
INSERT INTO folders (user_id, folder_name) VALUES
    (1, '데이터베이스'),
    (1, '인공지능'),
    (2, '프로젝트');

COMMIT;

-- ==========================
-- 마이그레이션 완료 확인
-- ==========================
SELECT 'Migration completed successfully!' as status;
SELECT 'Users count: ' || COUNT(*) FROM users;
SELECT 'Folders count: ' || COUNT(*) FROM folders;
SELECT 'Documents count: ' || COUNT(*) FROM documents;
