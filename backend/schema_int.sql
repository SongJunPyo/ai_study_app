-- ==========================
-- INT 기반 데이터베이스 스키마 (최종 버전)
-- ==========================
-- 사용법: psql -h localhost -U mymoon -d postgres -f schema_int.sql

-- ==========================
-- 확장 설치 (최초 1회)
-- ==========================
CREATE EXTENSION IF NOT EXISTS "vector";

-- ==========================
-- 사용자 테이블
-- ==========================
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- 폴더 테이블
-- ==========================
CREATE TABLE IF NOT EXISTS folders (
    folder_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    folder_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- 문서 테이블
-- ==========================
CREATE TABLE IF NOT EXISTS documents (
    doc_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    folder_id INTEGER REFERENCES folders(folder_id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    summary_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- 청크 테이블 (RAG 임베딩 저장)
-- ==========================
CREATE TABLE IF NOT EXISTS document_chunks (
    chunk_id SERIAL PRIMARY KEY,
    doc_id INTEGER NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    page_number INTEGER,
    embedding VECTOR(3072),  -- text-embedding-3-large 기준
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- 퀴즈 테이블
-- ==========================
CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id SERIAL PRIMARY KEY,
    doc_id INTEGER NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
    quiz_data JSONB NOT NULL,   -- LLM이 생성한 문제와 답변 저장
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- 인덱스 (검색 최적화)
-- ==========================
-- 문서별 청크 조회
CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON document_chunks(doc_id);

-- 폴더별 문서 조회
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);

-- 사용자별 문서 조회
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- 사용자별 폴더 조회
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);

-- 문서별 퀴즈 조회
CREATE INDEX IF NOT EXISTS idx_quizzes_doc_id ON quizzes(doc_id);

-- ==========================
-- 스키마 생성 완료
-- ==========================
SELECT 'Schema created successfully!' as status;
