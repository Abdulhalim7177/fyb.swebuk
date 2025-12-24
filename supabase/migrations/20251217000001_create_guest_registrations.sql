-- Create guest registrations table for users without accounts
-- This allows anyone to register for events without creating an account

CREATE TABLE guest_registrations (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'registered' CHECK (status IN (
    'registered', 'waitlisted', 'cancelled', 'attended', 'no_show'
  )),
  registered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(event_id, email)
);

-- Enable RLS
ALTER TABLE guest_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guest_registrations

-- Staff and Admins can view all guest registrations
CREATE POLICY "Staff and Admins can view all guest registrations" ON guest_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- Event organizers can view guest registrations for their events
CREATE POLICY "Organizers can view guest registrations for their events" ON guest_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guest_registrations.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Allow service role to insert guest registrations (via API)
CREATE POLICY "Service role can insert guest registrations" ON guest_registrations
  FOR INSERT WITH CHECK (true);

-- Staff and Admins can update guest registrations
CREATE POLICY "Staff and Admins can update guest registrations" ON guest_registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- Create indexes
CREATE INDEX guest_registrations_event_id_idx ON guest_registrations(event_id);
CREATE INDEX guest_registrations_email_idx ON guest_registrations(email);
CREATE INDEX guest_registrations_status_idx ON guest_registrations(status);

-- Create trigger for updated_at
CREATE TRIGGER update_guest_registrations_updated_at
  BEFORE UPDATE ON guest_registrations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create view that combines both authenticated and guest registrations for event counts
CREATE OR REPLACE VIEW all_event_registrations AS
SELECT
  r.id,
  r.event_id,
  r.user_id,
  p.full_name,
  p.avatar_url,
  r.status,
  r.registered_at,
  r.checked_in_at,
  'authenticated' as registration_type
FROM event_registrations r
JOIN profiles p ON r.user_id = p.id
UNION ALL
SELECT
  gr.id,
  gr.event_id,
  NULL as user_id,
  gr.full_name,
  NULL as avatar_url,
  gr.status,
  gr.registered_at,
  gr.checked_in_at,
  'guest' as registration_type
FROM guest_registrations gr;

-- Grant access to the view
GRANT SELECT ON all_event_registrations TO authenticated;
GRANT SELECT ON all_event_registrations TO anon;
