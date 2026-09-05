-- EduNexus Migration 005: Assessments Module
-- Safe to run multiple times (IF NOT EXISTS throughout)

-- Assessment definitions
CREATE TABLE IF NOT EXISTS assessments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  skill_id      UUID REFERENCES skills(id) ON DELETE SET NULL,
  difficulty    TEXT NOT NULL CHECK (difficulty IN ('EASY','MEDIUM','HARD')) DEFAULT 'MEDIUM',
  time_limit    INTEGER NOT NULL DEFAULT 30,   -- minutes
  passing_score INTEGER NOT NULL DEFAULT 60,   -- percentage
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','DRAFT')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Questions per assessment
CREATE TABLE IF NOT EXISTS assessment_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id   UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question        TEXT NOT NULL,
  options         JSONB NOT NULL DEFAULT '[]',   -- array of strings
  correct_answer  TEXT NOT NULL,
  explanation     TEXT,
  points          INTEGER NOT NULL DEFAULT 1,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student attempts
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id   UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS','COMPLETED','ABANDONED')),
  score           INTEGER,            -- percentage 0-100
  correct_answers INTEGER DEFAULT 0,
  wrong_answers   INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  new_level       TEXT,               -- skill level awarded
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  UNIQUE (assessment_id, student_id, started_at)  -- allow retakes
);

-- Per-question answers within an attempt
CREATE TABLE IF NOT EXISTS assessment_answers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id      UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
  selected_answer TEXT,
  is_correct      BOOLEAN NOT NULL DEFAULT FALSE,
  points_earned   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment ON assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON assessment_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_answers_attempt ON assessment_answers(attempt_id);
