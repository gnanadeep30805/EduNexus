-- EduNexus Migration 006: Learning & Career Path Module
-- Safe to run multiple times

-- Curated learning resources
CREATE TABLE IF NOT EXISTS learning_resources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  url             TEXT,
  resource_type   TEXT NOT NULL DEFAULT 'COURSE' CHECK (resource_type IN ('COURSE','VIDEO','ARTICLE','BOOK','PROJECT','PRACTICE')),
  skill_id        UUID REFERENCES skills(id) ON DELETE CASCADE,
  target_level    TEXT CHECK (target_level IN ('BASIC','INTERMEDIATE','ADVANCED','EXPERT')),
  duration_hours  NUMERIC(6,1),
  provider        TEXT,
  is_free         BOOLEAN NOT NULL DEFAULT TRUE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student progress on resources
CREATE TABLE IF NOT EXISTS student_learning_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  resource_id     UUID NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'SAVED' CHECK (status IN ('SAVED','IN_PROGRESS','COMPLETED')),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, resource_id)
);

-- Career path templates (role → skills required)
CREATE TABLE IF NOT EXISTS career_paths (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_title      TEXT NOT NULL,
  category        TEXT,
  description     TEXT,
  avg_salary      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skills required for each career path
CREATE TABLE IF NOT EXISTS career_path_skills (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_path_id  UUID NOT NULL REFERENCES career_paths(id) ON DELETE CASCADE,
  skill_id        UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  required_level  TEXT NOT NULL CHECK (required_level IN ('BASIC','INTERMEDIATE','ADVANCED','EXPERT')),
  priority        TEXT NOT NULL DEFAULT 'PREFERRED' CHECK (priority IN ('MANDATORY','PREFERRED')),
  UNIQUE (career_path_id, skill_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_learning_resources_skill ON learning_resources(skill_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_student ON student_learning_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_career_path_skills_path ON career_path_skills(career_path_id);
