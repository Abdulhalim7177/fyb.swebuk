-- =============================================
-- COMPREHENSIVE FIX FOR RLS RECURSION
-- =============================================

-- Drop all problematic policies
DROP POLICY IF EXISTS "Users can view registered events" ON events;
DROP POLICY IF EXISTS "Organizers can view event registrations" ON event_registrations;
DROP POLICY IF EXISTS "Organizers can update registrations" ON event_registrations;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS is_user_registered_for_event(UUID, UUID);

-- Create security definer functions to break recursion chains
-- These functions bypass RLS and run with elevated permissions

CREATE OR REPLACE FUNCTION check_user_is_event_organizer(event_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events
    WHERE id = event_uuid
    AND organizer_id = user_uuid
  );
$$;

CREATE OR REPLACE FUNCTION check_user_registered_for_event(event_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM event_registrations
    WHERE event_id = event_uuid
    AND user_id = user_uuid
  );
$$;

-- Recreate policies using security definer functions

-- Events policy: Users can view events they're registered for
CREATE POLICY "Users can view registered events" ON events
  FOR SELECT USING (
    check_user_registered_for_event(id, auth.uid())
  );

-- Event registrations policy: Organizers can view registrations
CREATE POLICY "Organizers can view event registrations" ON event_registrations
  FOR SELECT USING (
    check_user_is_event_organizer(event_id, auth.uid())
  );

-- Event registrations policy: Organizers can update registrations
CREATE POLICY "Organizers can update registrations" ON event_registrations
  FOR UPDATE USING (
    check_user_is_event_organizer(event_id, auth.uid())
  );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_user_is_event_organizer(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_registered_for_event(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_is_event_organizer(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION check_user_registered_for_event(UUID, UUID) TO anon;
