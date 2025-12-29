-- Update final_year_projects status check constraint to include 'pending'
-- And make title nullable to allow skeleton records before proposal submission

-- First, drop the existing check constraint
ALTER TABLE final_year_projects DROP CONSTRAINT IF EXISTS final_year_projects_status_check;

-- Add the new check constraint with 'pending'
ALTER TABLE final_year_projects ADD CONSTRAINT final_year_projects_status_check 
  CHECK (status IN ('pending', 'proposal_submitted', 'proposal_approved', 'in_progress', 'ready_for_review', 'completed', 'rejected'));

-- Make title nullable
ALTER TABLE final_year_projects ALTER COLUMN title DROP NOT NULL;

-- Set default status to 'pending' if it was previously 'proposal_submitted'
ALTER TABLE final_year_projects ALTER COLUMN status SET DEFAULT 'pending';
