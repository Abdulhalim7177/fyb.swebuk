-- Allow anyone to view basic registration info for published public events
-- This enables showing registered user avatars and counts on event cards

CREATE POLICY "Anyone can view registrations for public events" ON event_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.status = 'published'
      AND events.is_public = true
    )
  );
