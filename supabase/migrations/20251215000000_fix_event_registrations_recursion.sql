-- =============================================
-- FIX INFINITE RECURSION IN EVENT_REGISTRATIONS RLS
-- =============================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Organizers can view event registrations" ON event_registrations;
DROP POLICY IF EXISTS "Organizers can update registrations" ON event_registrations;

-- Recreate without recursion by using a direct organizer_id check
-- This avoids querying the events table which has policies that query event_registrations

CREATE POLICY "Organizers can view event registrations" ON event_registrations
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can update registrations" ON event_registrations
  FOR UPDATE USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
  );
