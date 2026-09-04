-- Extends 001_industry_foundation.sql
-- Industry & Recruitment Module entities

-- Users (shared identity for the platform)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  role VARCHAR(32) NOT NULL DEFAULT 'RECRUITER' CHECK (role IN ('STUDENT', 'RECRUITER', 'ADMIN', 'ACADEMIA')),
  avatar VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Company profiles (extends companies table)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_size VARCHAR(40);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS domains TEXT[];
ALTER TABLE companies ADD COLUMN IF NOT EXISTS technology_areas TEXT[];
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(64);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Recruiter / company member
CREATE TABLE IF NOT EXISTS company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(32) NOT NULL DEFAULT 'RECRUITER' CHECK (role IN ('COMPANY_ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'MENTOR')),
  designation VARCHAR(120),
  department VARCHAR(120),
  phone VARCHAR(64),
  areas_of_hiring TEXT[],
  skills_of_interest UUID[],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- Recruiters (profile details)
CREATE TABLE IF NOT EXISTS recruiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  designation VARCHAR(120),
  department VARCHAR(120),
  phone VARCHAR(64),
  areas_of_hiring TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mentors
CREATE TABLE IF NOT EXISTS mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(160),
  bio TEXT,
  contact VARCHAR(255),
  responsibilities TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skill taxonomy (shared)
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL UNIQUE,
  category VARCHAR(80),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  alias VARCHAR(120) NOT NULL UNIQUE
);

-- Opportunities (extend foundation table with additional fields)
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS role_title VARCHAR(180);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS eligibility TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS duration VARCHAR(80);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS stipend VARCHAR(80);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS salary VARCHAR(80);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS selection_process TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS responsibilities TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS contact VARCHAR(255);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

DROP TABLE IF EXISTS opportunity_skills;
CREATE TABLE IF NOT EXISTS opportunity_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  required_level VARCHAR(24) NOT NULL CHECK (required_level IN ('BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
  priority VARCHAR(16) NOT NULL DEFAULT 'PREFERRED' CHECK (priority IN ('MANDATORY', 'PREFERRED')),
  years_experience NUMERIC(4,1),
  UNIQUE(opportunity_id, skill_id)
);

-- Role requirements (skill demand definition)
CREATE TABLE IF NOT EXISTS role_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role_title VARCHAR(180) NOT NULL,
  description TEXT,
  years_experience_min INTEGER,
  years_experience_max INTEGER,
  education VARCHAR(255),
  location VARCHAR(160),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Students (candidate records, read through shared APIs)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(120),
  last_name VARCHAR(120),
  institution_name VARCHAR(200),
  course VARCHAR(160),
  graduation_year INTEGER,
  location VARCHAR(160),
  bio TEXT,
  portfolio_url VARCHAR(255),
  career_interests TEXT[],
  internship_availability BOOLEAN,
  verification_status VARCHAR(24) NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'INSTITUTION_VERIFIED', 'VERIFIED')),
  consent_public_visibility BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student skills with evidence
CREATE TABLE IF NOT EXISTS student_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  self_level VARCHAR(24) NOT NULL CHECK (self_level IN ('BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
  verified_level VARCHAR(24) CHECK (verified_level IN ('BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
  years_experience NUMERIC(4,1),
  UNIQUE(student_id, skill_id)
);

CREATE TABLE IF NOT EXISTS student_skill_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_skill_id UUID NOT NULL REFERENCES student_skills(id) ON DELETE CASCADE,
  evidence_type VARCHAR(32) NOT NULL CHECK (evidence_type IN ('PROJECT', 'ASSESSMENT', 'INTERNSHIP', 'CERTIFICATION', 'COURSE')),
  title VARCHAR(255),
  description TEXT,
  credential_url VARCHAR(255),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student education
CREATE TABLE IF NOT EXISTS student_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  institution VARCHAR(200),
  degree VARCHAR(160),
  field VARCHAR(160),
  start_year INTEGER,
  end_year INTEGER
);

-- Student projects
CREATE TABLE IF NOT EXISTS student_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title VARCHAR(255),
  description TEXT,
  skills UUID[],
  project_url VARCHAR(255),
  start_date DATE,
  end_date DATE
);

-- Student certifications
CREATE TABLE IF NOT EXISTS student_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name VARCHAR(255),
  issuer VARCHAR(200),
  credential_url VARCHAR(255),
  issue_date DATE
);

-- Student work / internship experience
CREATE TABLE IF NOT EXISTS student_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  organization VARCHAR(200),
  role VARCHAR(160),
  start_date DATE,
  end_date DATE,
  description TEXT,
  skills UUID[]
);

-- Applications
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status VARCHAR(24) NOT NULL DEFAULT 'APPLIED' CHECK (status IN ('APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN')),
  match_score NUMERIC(5,2),
  match_strength VARCHAR(20) CHECK (match_strength IN ('STRONG', 'GOOD', 'MODERATE', 'WEAK')),
  application_note TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(opportunity_id, student_id)
);

CREATE TABLE IF NOT EXISTS application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_status VARCHAR(24),
  to_status VARCHAR(24) NOT NULL,
  changed_by UUID REFERENCES users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Matches (AI recommendations)
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL,
  strength VARCHAR(20) NOT NULL CHECK (strength IN ('STRONG', 'GOOD', 'MODERATE', 'WEAK')),
  explanation JSONB,
  matching_skills JSONB,
  missing_skills JSONB,
  source VARCHAR(32) NOT NULL DEFAULT 'AI',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(opportunity_id, student_id)
);

-- Interviews
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  interviewer_id UUID REFERENCES users(id),
  round_number INTEGER NOT NULL DEFAULT 1,
  round_name VARCHAR(120),
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 45,
  mode VARCHAR(24) CHECK (mode IN ('ONLINE', 'ONSITE', 'PHONE')),
  meeting_link VARCHAR(255),
  notes TEXT,
  status VARCHAR(24) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Offers
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  role_title VARCHAR(180),
  compensation VARCHAR(120),
  offer_date DATE,
  joining_date DATE,
  status VARCHAR(24) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Placement outcomes
CREATE TABLE IF NOT EXISTS placement_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  joined BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at DATE,
  role_title VARCHAR(180),
  compensation VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Collaborations (industry <-> academia)
CREATE TABLE IF NOT EXISTS collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  type VARCHAR(40) NOT NULL CHECK (type IN ('GUEST_LECTURE', 'WORKSHOP', 'FDP', 'MENTORSHIP', 'LIVE_PROJECT', 'CURRICULUM_CONSULTATION', 'RESEARCH_COLLABORATION', 'TRAINING', 'INTERNSHIP_PARTNERSHIP')),
  description TEXT,
  target_audience VARCHAR(160),
  location VARCHAR(160),
  mode VARCHAR(24),
  proposed_date DATE,
  status VARCHAR(24) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PROPOSED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
  contact VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Industry skill feedback for students
CREATE TABLE IF NOT EXISTS industry_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES users(id),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  observed_level VARCHAR(24) CHECK (observed_level IN ('BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
  performance VARCHAR(20) CHECK (performance IN ('EXCELLENT', 'GOOD', 'AVERAGE', 'BELOW_AVERAGE')),
  strengths TEXT,
  improvement_areas TEXT,
  comments TEXT,
  status VARCHAR(24) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'ACKNOWLEDGED', 'VERIFIED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  company_id UUID,
  action VARCHAR(80) NOT NULL,
  resource VARCHAR(80) NOT NULL,
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(40),
  title VARCHAR(200) NOT NULL,
  body TEXT,
  related_type VARCHAR(60),
  related_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Matching weight configuration (stored centrally, not duplicated)
CREATE TABLE IF NOT EXISTS matching_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_compatibility NUMERIC(5,2) NOT NULL DEFAULT 35,
  skill_evidence NUMERIC(5,2) NOT NULL DEFAULT 20,
  assessment NUMERIC(5,2) NOT NULL DEFAULT 15,
  experience NUMERIC(5,2) NOT NULL DEFAULT 10,
  career_preference NUMERIC(5,2) NOT NULL DEFAULT 10,
  eligibility NUMERIC(5,2) NOT NULL DEFAULT 5,
  stated_preferences NUMERIC(5,2) NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS applications_company_status_idx ON applications(company_id, status);
CREATE INDEX IF NOT EXISTS applications_student_idx ON applications(student_id);
CREATE INDEX IF NOT EXISTS matches_company_idx ON matches(company_id);
CREATE INDEX IF NOT EXISTS matches_opportunity_idx ON matches(opportunity_id);
CREATE INDEX IF NOT EXISTS interviews_company_status_idx ON interviews(company_id, status);
CREATE INDEX IF NOT EXISTS offers_company_idx ON offers(company_id);
CREATE INDEX IF NOT EXISTS student_skills_student_idx ON student_skills(student_id);
CREATE INDEX IF NOT EXISTS audit_logs_company_idx ON audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, is_read);
