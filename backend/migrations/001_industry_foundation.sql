CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  description TEXT,
  industry VARCHAR(120),
  website VARCHAR(255),
  location VARCHAR(160),
  verification_status VARCHAR(24) NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  title VARCHAR(180) NOT NULL,
  type VARCHAR(32) NOT NULL CHECK (type IN ('INTERNSHIP', 'JOB', 'LIVE_PROJECT', 'TRAINING', 'WORKSHOP', 'MENTORSHIP')),
  description TEXT NOT NULL,
  location VARCHAR(160),
  work_mode VARCHAR(24) CHECK (work_mode IN ('ONSITE', 'HYBRID', 'REMOTE')),
  status VARCHAR(24) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'PAUSED', 'CLOSED')),
  openings INTEGER NOT NULL DEFAULT 1 CHECK (openings > 0),
  application_deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS industry_skill_demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL,
  required_level VARCHAR(24) NOT NULL CHECK (required_level IN ('BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
  priority VARCHAR(16) NOT NULL DEFAULT 'PREFERRED' CHECK (priority IN ('MANDATORY', 'PREFERRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS opportunities_company_status_idx ON opportunities(company_id, status);
CREATE INDEX IF NOT EXISTS skill_demands_company_idx ON industry_skill_demands(company_id);
