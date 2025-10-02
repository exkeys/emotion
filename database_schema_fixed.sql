-- ===========================================
-- 기존 테이블/뷰/함수 모두 삭제 (완전 초기화)
-- ===========================================

-- 함수 삭제
DROP FUNCTION IF EXISTS get_fatigue_trend(TEXT, DATE, DATE) CASCADE;

-- 뷰 삭제
DROP VIEW IF EXISTS weekly_analysis CASCADE;
DROP VIEW IF EXISTS monthly_analysis CASCADE;
DROP VIEW IF EXISTS yearly_analysis CASCADE;
DROP VIEW IF EXISTS monthly_trends CASCADE;

-- 테이블 삭제 (CASCADE로 정책도 함께 삭제됨)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
DROP TABLE IF EXISTS records CASCADE;

-- ===========================================
-- 간단한 2개 테이블로 새로 생성
-- ===========================================

-- 1. records 테이블 (기록 저장용)
CREATE TABLE records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    fatigue INTEGER NOT NULL CHECK (fatigue >= 1 AND fatigue <= 10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- 2. chat_messages 테이블 (AI 채팅용 - 백엔드 호환성 유지)
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- 사용자 ID  
    user_chat TEXT NOT NULL, -- 사용자가 한 질문/메시지
    ai_answer TEXT, -- AI가 제공한 답변 (NULL 가능 - 아직 답변 안 온 경우)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 필수 인덱스 (성능 최적화)
CREATE INDEX idx_records_user_date ON records(user_id, date);
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- RLS 완전 비활성화 (개발/테스트용)
ALTER TABLE records DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;


