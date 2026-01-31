-- Enable Realtime for chat tables
-- This is necessary for 'postgres_changes' subscriptions to work

DO $$
BEGIN
  -- Try to add fyp_chat
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE fyp_chat;
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Already exists
  WHEN others THEN
    NULL; -- Ignore other errors (like if publication doesn't exist, though unlikely)
  END;

  -- Try to add project_chat
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_chat;
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Already exists
  WHEN others THEN
    NULL;
  END;
END $$;