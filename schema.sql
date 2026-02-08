-- Hanja Olympics v2: Supabase Database Schema
-- Run this in Supabase SQL Editor

-- 사용자 프로필 (auth.users에 연결)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  icon TEXT DEFAULT '🇰🇷',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 게임 점수 기록
CREATE TABLE scores (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  score INT NOT NULL,
  total INT NOT NULL DEFAULT 0,
  medal TEXT, -- 'gold', 'silver', 'bronze', null
  detail TEXT,
  wrong_answers JSONB DEFAULT '[]',
  played_at TIMESTAMPTZ DEFAULT NOW()
);

-- 멀티플레이어 방
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  host_id UUID REFERENCES profiles(id),
  game_id TEXT NOT NULL,
  status TEXT DEFAULT 'waiting', -- waiting, playing, finished
  max_players INT DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 방 참가자
CREATE TABLE room_players (
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score INT DEFAULT 0,
  finished BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- 일일 도전
CREATE TABLE daily_challenges (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  score INT NOT NULL,
  medal TEXT,
  PRIMARY KEY (user_id, challenge_date)
);

-- RLS 정책
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

-- 프로필: 누구나 읽기, 본인만 수정
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Own profile insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 점수: 누구나 읽기, 본인만 쓰기
CREATE POLICY "Public scores" ON scores FOR SELECT USING (true);
CREATE POLICY "Own scores" ON scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 방: 누구나 읽기/참가
CREATE POLICY "Public rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Create rooms" ON rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host update rooms" ON rooms FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Public players" ON room_players FOR SELECT USING (true);
CREATE POLICY "Join room" ON room_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own player" ON room_players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Leave room" ON room_players FOR DELETE USING (auth.uid() = user_id);

-- 일일 도전: 본인만 읽기/쓰기
CREATE POLICY "Own daily read" ON daily_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own daily insert" ON daily_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own daily update" ON daily_challenges FOR UPDATE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_scores_user_game ON scores(user_id, game_id);
CREATE INDEX idx_scores_game_score ON scores(game_id, score DESC);
CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_daily_user_date ON daily_challenges(user_id, challenge_date DESC);

-- ========================================
-- 급수 시스템 (Grade System)
-- ========================================

-- 1. 프로필 테이블에 급수 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT '8급';

-- 2. 점수 테이블에 급수 컬럼 추가
ALTER TABLE scores ADD COLUMN IF NOT EXISTS grade TEXT;
CREATE INDEX IF NOT EXISTS idx_scores_grade ON scores(grade);
CREATE INDEX IF NOT EXISTS idx_scores_grade_game_score ON scores(grade, game_id, score DESC);

-- 3. 문제 풀이 로그 테이블
CREATE TABLE IF NOT EXISTS answer_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  hanja_char TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  user_grade TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_answer_log_user_hanja ON answer_log(user_id, hanja_char);
CREATE INDEX IF NOT EXISTS idx_answer_log_created ON answer_log(created_at);

-- RLS policies for answer_log
ALTER TABLE answer_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own answers" ON answer_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own answers" ON answer_log FOR SELECT USING (auth.uid() = user_id);

-- 4. 한자별 통계 테이블
CREATE TABLE IF NOT EXISTS hanja_stats (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  hanja_char TEXT NOT NULL,
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, hanja_char)
);

CREATE INDEX IF NOT EXISTS idx_hanja_stats_user ON hanja_stats(user_id);

-- RLS policies for hanja_stats
ALTER TABLE hanja_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own stats" ON hanja_stats FOR ALL USING (auth.uid() = user_id);

-- 5. 한자 통계 업데이트 함수 (upsert)
CREATE OR REPLACE FUNCTION upsert_hanja_stat(
  p_user_id UUID,
  p_hanja_char TEXT,
  p_is_correct BOOLEAN
) RETURNS VOID AS $$
BEGIN
  INSERT INTO hanja_stats (user_id, hanja_char, correct_count, wrong_count, last_attempt_at)
  VALUES (p_user_id, p_hanja_char,
    CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    CASE WHEN p_is_correct THEN 0 ELSE 1 END,
    NOW())
  ON CONFLICT (user_id, hanja_char)
  DO UPDATE SET
    correct_count = hanja_stats.correct_count + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    wrong_count = hanja_stats.wrong_count + CASE WHEN p_is_correct THEN 0 ELSE 1 END,
    last_attempt_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 오래된 로그 정리 함수 (90일 이상)
CREATE OR REPLACE FUNCTION cleanup_old_answer_logs() RETURNS VOID AS $$
BEGIN
  DELETE FROM answer_log WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
