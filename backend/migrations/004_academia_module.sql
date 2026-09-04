CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  website VARCHAR(255),
  location VARCHAR(160),
  institution_type VARCHAR(80),
  verification_status VARCHAR(24) NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS institution_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(40) NOT NULL DEFAULT 'FACULTY' CHECK (role IN ('INSTITUTION_ADMIN', 'PLACEMENT_OFFICER', 'FACULTY', 'DEPARTMENT_COORDINATOR', 'ACADEMIC_COORDINATOR')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (institution_id, user_id)
);

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  code VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (institution_id, code)
);

ALTER TABLE students ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS internship_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  mentor_name VARCHAR(160),
  start_date DATE,
  end_date DATE,
  status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('UPCOMING', 'ACTIVE', 'COMPLETED', 'AT_RISK')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS internship_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID NOT NULL REFERENCES internship_monitoring(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  due_date DATE,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS institution_users_user_idx ON institution_users(user_id, is_active);
CREATE INDEX IF NOT EXISTS students_institution_idx ON students(institution_id);
CREATE INDEX IF NOT EXISTS internship_monitoring_status_idx ON internship_monitoring(status);