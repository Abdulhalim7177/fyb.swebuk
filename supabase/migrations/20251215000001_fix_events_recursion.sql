-- =============================================
-- FIX INFINITE RECURSION IN EVENTS AND EVENT_REGISTRATIONS RLS
-- =============================================

-- The issue is that:
-- 1. "Users can view registered events" policy on events queries event_registrations
-- 2. "Organizers can view event registrations" policy queries events
-- This creates infinite recursion

-- Solution: Use security definer functions to break the recursion chain

-- Drop the problematic event policy
DROP POLICY IF EXISTS "Users can view registered events" ON events;

-- Create a security definer function to check if user is registered
-- This function runs with the permissions of the function creator, not the caller
-- Breaking the RLS recursion chain
CREATE OR REPLACE FUNCTION is_user_registered_for_event(event_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM event_registrations
    WHERE event_id = event_uuid
    AND user_id = user_uuid
  );
END;
$$;

-- Recreate the policy using the function
CREATE POLICY "Users can view registered events" ON events
  FOR SELECT USING (
    is_user_registered_for_event(id, auth.uid())
  );

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_user_registered_for_event(UUID, UUID) TO authenticated;
