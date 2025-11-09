-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'deputy_lead', 'lead_student', 'staff', 'administrator', 'manager_staff')),

  -- Common fields for all roles
  first_name TEXT NOT NULL,
  surname TEXT NOT NULL,
  middle_name TEXT,
  department TEXT DEFAULT 'Software Engineering',
  institution TEXT DEFAULT 'Bayero University Kano',
  skills JSONB DEFAULT '[]', -- Array of skill strings
  linkedin_handle TEXT,
  github_handle TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID, -- Optional reference to creator, no FK constraint to avoid circular dependency

  -- Student-specific fields
  academic_level INTEGER CHECK (academic_level BETWEEN 100 AND 500), -- 100-400 for students, 500 for graduates
  registration_number TEXT UNIQUE,

  -- Staff-specific fields
  staff_number TEXT UNIQUE,
  staff_type TEXT CHECK (staff_type IN ('supervisor', 'manager', 'administrator')), -- For staff roles

  -- Status and permissions
  is_active BOOLEAN DEFAULT true,
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,
  suspension_until TIMESTAMP WITH TIME ZONE,

  -- Cluster assignments (cluster_id will be added after clusters table is created)
  -- cluster_id UUID REFERENCES clusters(id), -- For lead/deputy roles
  managed_cluster_ids UUID[] DEFAULT '{}', -- For staff managers

  -- FYP supervision (for staff)
  supervised_student_ids UUID[] DEFAULT '{}'
);

-- Indexes for user_profiles
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_registration_number ON user_profiles(registration_number);
CREATE INDEX idx_user_profiles_staff_number ON user_profiles(staff_number);
CREATE INDEX idx_user_profiles_academic_level ON user_profiles(academic_level);

-- Trigger for updated_at on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();