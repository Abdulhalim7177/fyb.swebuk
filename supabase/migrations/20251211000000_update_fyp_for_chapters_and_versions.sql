-- Migration: Update FYP system for chapter-based tracking and version control
-- Date: 2025-12-11

-- 1. Add GitHub repository field to final_year_projects
ALTER TABLE final_year_projects
ADD COLUMN IF NOT EXISTS github_repo_url TEXT,
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

-- 2. Update submission types to include all chapters
-- First, drop the old constraint
ALTER TABLE fyp_submissions
DROP CONSTRAINT IF EXISTS fyp_submissions_submission_type_check;

-- Migrate existing data: map old types to new types
UPDATE fyp_submissions
SET submission_type = CASE
  WHEN submission_type = 'progress_report' THEN 'chapter_1'
  WHEN submission_type = 'draft' THEN 'chapter_2'
  WHEN submission_type = 'final' THEN 'final_thesis'
  ELSE submission_type
END
WHERE submission_type NOT IN ('proposal', 'chapter_1', 'chapter_2', 'chapter_3', 'chapter_4', 'chapter_5', 'final_thesis');

-- Add new constraint with chapter types
ALTER TABLE fyp_submissions
ADD CONSTRAINT fyp_submissions_submission_type_check
CHECK (submission_type IN (
  'proposal',
  'chapter_1',
  'chapter_2',
  'chapter_3',
  'chapter_4',
  'chapter_5',
  'final_thesis'
));

-- 3. Add version tracking columns to fyp_submissions
ALTER TABLE fyp_submissions
ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS previous_version_id UUID REFERENCES fyp_submissions(id);

-- 4. Create index for version queries
CREATE INDEX IF NOT EXISTS fyp_submissions_version_idx ON fyp_submissions(fyp_id, submission_type, version_number DESC);
CREATE INDEX IF NOT EXISTS fyp_submissions_latest_idx ON fyp_submissions(fyp_id, submission_type, is_latest_version) WHERE is_latest_version = true;

-- 5. Create function to handle version tracking on new submission
CREATE OR REPLACE FUNCTION handle_fyp_submission_version()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a new submission for an existing type, mark old versions as not latest
  IF TG_OP = 'INSERT' THEN
    -- Update previous submissions of same type to not be latest
    UPDATE fyp_submissions
    SET is_latest_version = false
    WHERE fyp_id = NEW.fyp_id
      AND submission_type = NEW.submission_type
      AND id != NEW.id
      AND is_latest_version = true;

    -- Set version number based on previous versions
    NEW.version_number := COALESCE(
      (SELECT MAX(version_number) + 1
       FROM fyp_submissions
       WHERE fyp_id = NEW.fyp_id
         AND submission_type = NEW.submission_type
         AND id != NEW.id),
      1
    );

    -- Link to previous version if exists
    NEW.previous_version_id := (
      SELECT id
      FROM fyp_submissions
      WHERE fyp_id = NEW.fyp_id
        AND submission_type = NEW.submission_type
        AND id != NEW.id
      ORDER BY version_number DESC
      LIMIT 1
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for version tracking
DROP TRIGGER IF EXISTS fyp_submission_version_trigger ON fyp_submissions;
CREATE TRIGGER fyp_submission_version_trigger
  BEFORE INSERT ON fyp_submissions
  FOR EACH ROW
  EXECUTE FUNCTION handle_fyp_submission_version();

-- 7. Create function to calculate FYP progress based on chapters
CREATE OR REPLACE FUNCTION calculate_fyp_progress(fyp_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_components INTEGER := 7; -- proposal + 5 chapters + final thesis
  completed_components INTEGER := 0;
  progress INTEGER;
BEGIN
  -- Count approved submissions for each type (only latest versions)
  SELECT COUNT(DISTINCT submission_type) INTO completed_components
  FROM fyp_submissions
  WHERE fyp_id = fyp_uuid
    AND is_latest_version = true
    AND status = 'approved';

  -- Calculate percentage
  progress := ROUND((completed_components::DECIMAL / total_components) * 100);

  -- Update the FYP record
  UPDATE final_year_projects
  SET progress_percentage = progress
  WHERE id = fyp_uuid;

  RETURN progress;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger to auto-update progress when submission status changes
CREATE OR REPLACE FUNCTION update_fyp_progress_on_submission_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate progress when submission status changes
  IF TG_OP = 'UPDATE' AND (OLD.status != NEW.status) THEN
    PERFORM calculate_fyp_progress(NEW.fyp_id);
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM calculate_fyp_progress(NEW.fyp_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fyp_progress_trigger ON fyp_submissions;
CREATE TRIGGER update_fyp_progress_trigger
  AFTER INSERT OR UPDATE OF status ON fyp_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_fyp_progress_on_submission_change();

-- 9. Update existing submissions to set version numbers (migration of old data)
WITH ranked_submissions AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY fyp_id, submission_type ORDER BY submitted_at) as version_num
  FROM fyp_submissions
)
UPDATE fyp_submissions s
SET version_number = rs.version_num
FROM ranked_submissions rs
WHERE s.id = rs.id AND s.version_number IS NULL;

-- 10. Mark latest versions for existing submissions
WITH latest_submissions AS (
  SELECT DISTINCT ON (fyp_id, submission_type)
    id
  FROM fyp_submissions
  ORDER BY fyp_id, submission_type, version_number DESC
)
UPDATE fyp_submissions s
SET is_latest_version = (s.id IN (SELECT id FROM latest_submissions));

-- 11. Calculate initial progress for all existing FYPs
DO $$
DECLARE
  fyp_record RECORD;
BEGIN
  FOR fyp_record IN SELECT id FROM final_year_projects LOOP
    PERFORM calculate_fyp_progress(fyp_record.id);
  END LOOP;
END $$;

-- 12. Create view for chapter progress tracking
CREATE OR REPLACE VIEW fyp_chapter_progress AS
SELECT
  fyp.id as fyp_id,
  fyp.title,
  fyp.student_id,
  fyp.supervisor_id,
  fyp.progress_percentage,
  fyp.github_repo_url,
  COUNT(DISTINCT CASE WHEN s.status = 'approved' AND s.is_latest_version THEN s.submission_type END) as completed_chapters,
  BOOL_OR(CASE WHEN s.submission_type = 'proposal' AND s.status = 'approved' AND s.is_latest_version THEN true ELSE false END) as proposal_approved,
  BOOL_OR(CASE WHEN s.submission_type = 'chapter_1' AND s.status = 'approved' AND s.is_latest_version THEN true ELSE false END) as chapter_1_approved,
  BOOL_OR(CASE WHEN s.submission_type = 'chapter_2' AND s.status = 'approved' AND s.is_latest_version THEN true ELSE false END) as chapter_2_approved,
  BOOL_OR(CASE WHEN s.submission_type = 'chapter_3' AND s.status = 'approved' AND s.is_latest_version THEN true ELSE false END) as chapter_3_approved,
  BOOL_OR(CASE WHEN s.submission_type = 'chapter_4' AND s.status = 'approved' AND s.is_latest_version THEN true ELSE false END) as chapter_4_approved,
  BOOL_OR(CASE WHEN s.submission_type = 'chapter_5' AND s.status = 'approved' AND s.is_latest_version THEN true ELSE false END) as chapter_5_approved,
  BOOL_OR(CASE WHEN s.submission_type = 'final_thesis' AND s.status = 'approved' AND s.is_latest_version THEN true ELSE false END) as final_thesis_approved
FROM final_year_projects fyp
LEFT JOIN fyp_submissions s ON fyp.id = s.fyp_id
GROUP BY fyp.id, fyp.title, fyp.student_id, fyp.supervisor_id, fyp.progress_percentage, fyp.github_repo_url;

-- Grant permissions on the view
GRANT SELECT ON fyp_chapter_progress TO authenticated;

COMMENT ON COLUMN final_year_projects.github_repo_url IS 'GitHub repository URL for the project code';
COMMENT ON COLUMN final_year_projects.progress_percentage IS 'Auto-calculated progress based on approved chapters (0-100)';
COMMENT ON COLUMN fyp_submissions.version_number IS 'Version number for this submission type (auto-incremented)';
COMMENT ON COLUMN fyp_submissions.is_latest_version IS 'Whether this is the latest version of this submission type';
COMMENT ON COLUMN fyp_submissions.previous_version_id IS 'Link to the previous version of this submission';
