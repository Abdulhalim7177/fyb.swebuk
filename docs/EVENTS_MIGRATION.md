# Event Management System - Database Migration

This document contains the complete SQL migration for the Event Management System.

## Migration File

**Filename**: `20251213000000_create_events_tables.sql`

```sql
-- =============================================
-- EVENT MANAGEMENT SYSTEM - DATABASE MIGRATION
-- =============================================

-- =============================================
-- 1. CERTIFICATE TEMPLATES TABLE
-- =============================================

CREATE TABLE certificate_templates (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,

  -- Template Info
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN (
    'participation', 'completion', 'achievement', 'appreciation', 'custom'
  )),

  -- Template Content
  background_image_url TEXT,
  template_html TEXT, -- HTML template with placeholders
  css_styles TEXT,

  -- Placeholders: {{participant_name}}, {{event_title}}, {{event_date}},
  -- {{certificate_number}}, {{issued_date}}, {{organizer_name}}, {{cluster_name}}

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  -- Metadata
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- 2. EVENTS TABLE
-- =============================================

CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  cluster_id UUID REFERENCES public.clusters(id) ON DELETE SET NULL,

  -- Basic Info
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,

  -- Event Type & Category
  event_type TEXT NOT NULL CHECK (event_type IN (
    'workshop', 'seminar', 'hackathon', 'meetup',
    'conference', 'training', 'webinar', 'competition', 'other'
  )),
  category TEXT CHECK (category IN (
    'technical', 'career', 'networking', 'social',
    'academic', 'community', 'other'
  )),

  -- Date & Time
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  registration_deadline TIMESTAMPTZ,

  -- Location
  location_type TEXT NOT NULL CHECK (location_type IN ('physical', 'online', 'hybrid')),
  location TEXT,
  venue_name TEXT,
  meeting_url TEXT,

  -- Capacity & Registration
  max_capacity INTEGER,
  is_registration_required BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,

  -- Media
  banner_image_url TEXT,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'published', 'cancelled', 'completed', 'archived'
  )),

  -- Certificate Settings
  certificate_enabled BOOLEAN DEFAULT false,
  certificate_template_id UUID REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
  minimum_attendance_for_certificate INTEGER DEFAULT 80,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  published_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_registration_deadline CHECK (
    registration_deadline IS NULL OR registration_deadline <= start_date
  )
);

-- =============================================
-- 3. EVENT REGISTRATIONS TABLE
-- =============================================

CREATE TABLE event_registrations (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Registration Status
  status TEXT DEFAULT 'registered' CHECK (status IN (
    'registered', 'waitlisted', 'cancelled', 'attended', 'no_show'
  )),

  -- Timestamps
  registered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Check-in
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  check_in_method TEXT CHECK (check_in_method IN ('qr_code', 'manual', 'self')),

  -- Additional Info
  notes TEXT,

  UNIQUE(event_id, user_id)
);

-- =============================================
-- 4. EVENT ATTENDANCE TABLE (Multi-session)
-- =============================================

CREATE TABLE event_attendance (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE CASCADE,

  -- Session Info
  session_name TEXT,
  session_date DATE NOT NULL,

  -- Attendance
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  duration_minutes INTEGER,

  -- Verification
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verification_method TEXT CHECK (verification_method IN ('qr_scan', 'manual', 'biometric')),

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- 5. EVENT FEEDBACK TABLE
-- =============================================

CREATE TABLE event_feedback (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE CASCADE,

  -- Ratings (1-5)
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  content_rating INTEGER CHECK (content_rating BETWEEN 1 AND 5),
  organization_rating INTEGER CHECK (organization_rating BETWEEN 1 AND 5),
  speaker_rating INTEGER CHECK (speaker_rating BETWEEN 1 AND 5),
  venue_rating INTEGER CHECK (venue_rating BETWEEN 1 AND 5),

  -- Written Feedback
  feedback_text TEXT,
  highlights TEXT,
  improvements TEXT,

  -- Metadata
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(event_id, user_id)
);

-- =============================================
-- 6. EVENT CERTIFICATES TABLE
-- =============================================

CREATE TABLE event_certificates (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE CASCADE,

  -- Certificate Details
  certificate_number TEXT UNIQUE NOT NULL,
  certificate_url TEXT,

  -- Verification
  verification_code TEXT UNIQUE NOT NULL,
  is_verified BOOLEAN DEFAULT true,

  -- Issuance
  issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Download tracking
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,

  UNIQUE(event_id, user_id)
);

-- =============================================
-- 7. EVENT TAGS TABLE
-- =============================================

CREATE TABLE event_tags (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(event_id, tag)
);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tags ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CERTIFICATE TEMPLATES RLS POLICIES
-- =============================================

-- Anyone can view active templates
CREATE POLICY "Anyone can view active templates" ON certificate_templates
  FOR SELECT USING (is_active = true);

-- Admins can manage templates
CREATE POLICY "Admins can manage templates" ON certificate_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- EVENTS RLS POLICIES
-- =============================================

-- 1. Anyone can view published public events
CREATE POLICY "Anyone can view published public events" ON events
  FOR SELECT USING (status = 'published' AND is_public = true);

-- 2. Users can view events they're registered for
CREATE POLICY "Users can view registered events" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_registrations
      WHERE event_registrations.event_id = events.id
      AND event_registrations.user_id = auth.uid()
    )
  );

-- 3. Cluster members can view cluster events
CREATE POLICY "Cluster members can view cluster events" ON events
  FOR SELECT USING (
    cluster_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM cluster_members
      WHERE cluster_members.cluster_id = events.cluster_id
      AND cluster_members.user_id = auth.uid()
      AND cluster_members.status = 'approved'
    )
  );

-- 4. Staff and Admins can view all events
CREATE POLICY "Staff and Admins can view all events" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- 5. Organizers can view own events
CREATE POLICY "Organizers can view own events" ON events
  FOR SELECT USING (organizer_id = auth.uid());

-- 6. Staff and Admins can create events
CREATE POLICY "Staff and Admins can create events" ON events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- 7. Organizers can update own events
CREATE POLICY "Organizers can update own events" ON events
  FOR UPDATE USING (organizer_id = auth.uid());

-- 8. Staff and Admins can update any event
CREATE POLICY "Staff and Admins can update any event" ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- 9. Admins can delete events
CREATE POLICY "Admins can delete events" ON events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- EVENT REGISTRATIONS RLS POLICIES
-- =============================================

-- 1. Users can view own registrations
CREATE POLICY "Users can view own registrations" ON event_registrations
  FOR SELECT USING (user_id = auth.uid());

-- 2. Organizers can view event registrations
CREATE POLICY "Organizers can view event registrations" ON event_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- 3. Staff and Admins can view all registrations
CREATE POLICY "Staff and Admins can view all registrations" ON event_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- 4. Users can register for events
CREATE POLICY "Users can register for events" ON event_registrations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.status = 'published'
      AND (events.registration_deadline IS NULL OR events.registration_deadline > NOW())
    )
  );

-- 5. Users can update own registration (cancel)
CREATE POLICY "Users can update own registration" ON event_registrations
  FOR UPDATE USING (user_id = auth.uid());

-- 6. Organizers can update registrations
CREATE POLICY "Organizers can update registrations" ON event_registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- 7. Staff and Admins can update any registration
CREATE POLICY "Staff and Admins can update any registration" ON event_registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- =============================================
-- EVENT ATTENDANCE RLS POLICIES
-- =============================================

-- 1. Users can view own attendance
CREATE POLICY "Users can view own attendance" ON event_attendance
  FOR SELECT USING (user_id = auth.uid());

-- 2. Organizers can view event attendance
CREATE POLICY "Organizers can view event attendance" ON event_attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_attendance.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- 3. Staff and Admins can view all attendance
CREATE POLICY "Staff and Admins can view all attendance" ON event_attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- 4. Staff and Admins can record attendance
CREATE POLICY "Staff and Admins can record attendance" ON event_attendance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- 5. Staff and Admins can update attendance
CREATE POLICY "Staff and Admins can update attendance" ON event_attendance
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- =============================================
-- EVENT FEEDBACK RLS POLICIES
-- =============================================

-- 1. Anyone can view non-anonymous feedback on completed events
CREATE POLICY "Anyone can view public feedback" ON event_feedback
  FOR SELECT USING (
    is_anonymous = false AND
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_feedback.event_id
      AND events.status IN ('completed', 'archived')
    )
  );

-- 2. Users can view own feedback
CREATE POLICY "Users can view own feedback" ON event_feedback
  FOR SELECT USING (user_id = auth.uid());

-- 3. Organizers can view all event feedback
CREATE POLICY "Organizers can view event feedback" ON event_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_feedback.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- 4. Staff and Admins can view all feedback
CREATE POLICY "Staff and Admins can view all feedback" ON event_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- 5. Attendees can submit feedback
CREATE POLICY "Attendees can submit feedback" ON event_feedback
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM event_registrations
      WHERE event_registrations.event_id = event_feedback.event_id
      AND event_registrations.user_id = auth.uid()
      AND event_registrations.status = 'attended'
    )
  );

-- 6. Users can update own feedback
CREATE POLICY "Users can update own feedback" ON event_feedback
  FOR UPDATE USING (user_id = auth.uid());

-- =============================================
-- EVENT CERTIFICATES RLS POLICIES
-- =============================================

-- 1. Anyone can view certificates (for verification)
CREATE POLICY "Anyone can view certificates" ON event_certificates
  FOR SELECT USING (true);

-- 2. Staff and Admins can issue certificates
CREATE POLICY "Staff and Admins can issue certificates" ON event_certificates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- 3. Staff and Admins can update certificates
CREATE POLICY "Staff and Admins can update certificates" ON event_certificates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- =============================================
-- EVENT TAGS RLS POLICIES
-- =============================================

-- 1. Anyone can view tags of published events
CREATE POLICY "Anyone can view tags of published events" ON event_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_tags.event_id
      AND events.status = 'published'
    )
  );

-- 2. Staff and Admins can manage tags
CREATE POLICY "Staff and Admins can manage tags" ON event_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- =============================================
-- INDEXES
-- =============================================

-- Events indexes
CREATE INDEX events_organizer_id_idx ON events(organizer_id);
CREATE INDEX events_cluster_id_idx ON events(cluster_id);
CREATE INDEX events_status_idx ON events(status);
CREATE INDEX events_event_type_idx ON events(event_type);
CREATE INDEX events_start_date_idx ON events(start_date);
CREATE INDEX events_slug_idx ON events(slug);
CREATE INDEX events_is_public_idx ON events(is_public) WHERE is_public = true;
CREATE INDEX events_published_status_idx ON events(status) WHERE status = 'published';

-- Registrations indexes
CREATE INDEX event_registrations_event_id_idx ON event_registrations(event_id);
CREATE INDEX event_registrations_user_id_idx ON event_registrations(user_id);
CREATE INDEX event_registrations_status_idx ON event_registrations(status);

-- Attendance indexes
CREATE INDEX event_attendance_event_id_idx ON event_attendance(event_id);
CREATE INDEX event_attendance_user_id_idx ON event_attendance(user_id);
CREATE INDEX event_attendance_session_date_idx ON event_attendance(session_date);

-- Feedback indexes
CREATE INDEX event_feedback_event_id_idx ON event_feedback(event_id);
CREATE INDEX event_feedback_user_id_idx ON event_feedback(user_id);

-- Certificates indexes
CREATE INDEX event_certificates_event_id_idx ON event_certificates(event_id);
CREATE INDEX event_certificates_user_id_idx ON event_certificates(user_id);
CREATE INDEX event_certificates_number_idx ON event_certificates(certificate_number);
CREATE INDEX event_certificates_verification_idx ON event_certificates(verification_code);

-- Tags indexes
CREATE INDEX event_tags_event_id_idx ON event_tags(event_id);
CREATE INDEX event_tags_tag_idx ON event_tags(tag);

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamps
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_event_feedback_updated_at
  BEFORE UPDATE ON event_feedback
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_certificate_templates_updated_at
  BEFORE UPDATE ON certificate_templates
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- VIEWS
-- =============================================

-- Detailed Events View
CREATE OR REPLACE VIEW detailed_events AS
SELECT
  e.id,
  e.title,
  e.slug,
  e.description,
  e.short_description,
  e.event_type,
  e.category,
  e.start_date,
  e.end_date,
  e.registration_deadline,
  e.location_type,
  e.location,
  e.venue_name,
  e.meeting_url,
  e.max_capacity,
  e.is_registration_required,
  e.is_public,
  e.banner_image_url,
  e.status,
  e.certificate_enabled,
  e.minimum_attendance_for_certificate,
  e.certificate_template_id,
  e.created_at,
  e.updated_at,
  e.published_at,
  e.organizer_id,
  org.full_name AS organizer_name,
  org.avatar_url AS organizer_avatar,
  org.email AS organizer_email,
  e.cluster_id,
  c.name AS cluster_name,
  (
    SELECT COUNT(*)
    FROM event_registrations er
    WHERE er.event_id = e.id AND er.status IN ('registered', 'attended')
  ) AS registrations_count,
  (
    SELECT COUNT(*)
    FROM event_registrations er
    WHERE er.event_id = e.id AND er.status = 'attended'
  ) AS attendees_count,
  (
    SELECT COUNT(*)
    FROM event_registrations er
    WHERE er.event_id = e.id AND er.status = 'waitlisted'
  ) AS waitlist_count,
  (
    SELECT COALESCE(ROUND(AVG(overall_rating)::numeric, 1), 0)
    FROM event_feedback ef
    WHERE ef.event_id = e.id
  ) AS average_rating,
  (
    SELECT COUNT(*)
    FROM event_feedback ef
    WHERE ef.event_id = e.id
  ) AS feedback_count,
  (
    SELECT array_agg(et.tag)
    FROM event_tags et
    WHERE et.event_id = e.id
  ) AS tags,
  CASE
    WHEN e.max_capacity IS NOT NULL THEN
      GREATEST(0, e.max_capacity - (
        SELECT COUNT(*)
        FROM event_registrations er
        WHERE er.event_id = e.id AND er.status IN ('registered', 'attended')
      ))
    ELSE NULL
  END AS available_spots,
  CASE
    WHEN e.max_capacity IS NOT NULL AND (
      SELECT COUNT(*)
      FROM event_registrations er
      WHERE er.event_id = e.id AND er.status IN ('registered', 'attended')
    ) >= e.max_capacity THEN true
    ELSE false
  END AS is_full
FROM events e
LEFT JOIN profiles org ON e.organizer_id = org.id
LEFT JOIN clusters c ON e.cluster_id = c.id;

-- User Event Registrations View
CREATE OR REPLACE VIEW user_event_registrations AS
SELECT
  er.id AS registration_id,
  er.event_id,
  er.user_id,
  er.status AS registration_status,
  er.registered_at,
  er.cancelled_at,
  er.checked_in_at,
  er.check_in_method,
  er.notes,
  e.title AS event_title,
  e.slug AS event_slug,
  e.short_description,
  e.event_type,
  e.start_date,
  e.end_date,
  e.location_type,
  e.location,
  e.venue_name,
  e.status AS event_status,
  e.banner_image_url,
  e.certificate_enabled,
  e.organizer_id,
  org.full_name AS organizer_name,
  EXISTS (
    SELECT 1 FROM event_certificates ec
    WHERE ec.event_id = e.id AND ec.user_id = er.user_id
  ) AS has_certificate,
  EXISTS (
    SELECT 1 FROM event_feedback ef
    WHERE ef.event_id = e.id AND ef.user_id = er.user_id
  ) AS has_feedback
FROM event_registrations er
JOIN events e ON er.event_id = e.id
LEFT JOIN profiles org ON e.organizer_id = org.id;

-- Event Registrations with User Details View
CREATE OR REPLACE VIEW detailed_event_registrations AS
SELECT
  er.id AS registration_id,
  er.event_id,
  er.user_id,
  er.status AS registration_status,
  er.registered_at,
  er.cancelled_at,
  er.cancellation_reason,
  er.checked_in_at,
  er.checked_in_by,
  er.check_in_method,
  er.notes,
  u.full_name AS user_name,
  u.email AS user_email,
  u.avatar_url AS user_avatar,
  u.academic_level,
  u.department,
  checker.full_name AS checked_in_by_name
FROM event_registrations er
JOIN profiles u ON er.user_id = u.id
LEFT JOIN profiles checker ON er.checked_in_by = checker.id;

-- Event Feedback with User Details View
CREATE OR REPLACE VIEW detailed_event_feedback AS
SELECT
  ef.id,
  ef.event_id,
  ef.user_id,
  ef.overall_rating,
  ef.content_rating,
  ef.organization_rating,
  ef.speaker_rating,
  ef.venue_rating,
  ef.feedback_text,
  ef.highlights,
  ef.improvements,
  ef.is_anonymous,
  ef.created_at,
  ef.updated_at,
  CASE
    WHEN ef.is_anonymous THEN 'Anonymous'
    ELSE u.full_name
  END AS user_name,
  CASE
    WHEN ef.is_anonymous THEN NULL
    ELSE u.avatar_url
  END AS user_avatar
FROM event_feedback ef
JOIN profiles u ON ef.user_id = u.id;

-- Grant select on views
GRANT SELECT ON detailed_events TO authenticated;
GRANT SELECT ON detailed_events TO anon;
GRANT SELECT ON user_event_registrations TO authenticated;
GRANT SELECT ON detailed_event_registrations TO authenticated;
GRANT SELECT ON detailed_event_feedback TO authenticated;
GRANT SELECT ON detailed_event_feedback TO anon;

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to generate unique event slug
CREATE OR REPLACE FUNCTION generate_event_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate base slug from title
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  base_slug := substring(base_slug from 1 for 80);

  final_slug := base_slug;

  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM events WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  cert_number TEXT;
BEGIN
  year_part := to_char(NOW(), 'YYYY');

  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(
    CAST(
      substring(certificate_number from 'SWEBUK-' || year_part || '-(\d+)')
      AS INTEGER
    )
  ), 0) + 1
  INTO seq_num
  FROM event_certificates
  WHERE certificate_number LIKE 'SWEBUK-' || year_part || '-%';

  cert_number := 'SWEBUK-' || year_part || '-' || lpad(seq_num::text, 6, '0');

  RETURN cert_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate verification code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can register for event
CREATE OR REPLACE FUNCTION can_register_for_event(event_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  event_record RECORD;
  current_registrations INTEGER;
BEGIN
  -- Get event details
  SELECT * INTO event_record FROM events WHERE id = event_uuid;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if event is published
  IF event_record.status != 'published' THEN
    RETURN false;
  END IF;

  -- Check registration deadline
  IF event_record.registration_deadline IS NOT NULL
     AND event_record.registration_deadline < NOW() THEN
    RETURN false;
  END IF;

  -- Check if user already registered
  IF EXISTS (
    SELECT 1 FROM event_registrations
    WHERE event_id = event_uuid
    AND user_id = user_uuid
    AND status != 'cancelled'
  ) THEN
    RETURN false;
  END IF;

  -- Check capacity
  IF event_record.max_capacity IS NOT NULL THEN
    SELECT COUNT(*) INTO current_registrations
    FROM event_registrations
    WHERE event_id = event_uuid
    AND status IN ('registered', 'attended');

    IF current_registrations >= event_record.max_capacity THEN
      RETURN false; -- Would need to be waitlisted
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INSERT DEFAULT CERTIFICATE TEMPLATE
-- =============================================

INSERT INTO certificate_templates (
  name,
  description,
  template_type,
  is_active,
  is_default,
  template_html
) VALUES (
  'Default Participation Certificate',
  'Standard certificate template for event participation',
  'participation',
  true,
  true,
  '<div class="certificate">
    <h1>Certificate of Participation</h1>
    <p>This is to certify that</p>
    <h2>{{participant_name}}</h2>
    <p>has successfully participated in</p>
    <h3>{{event_title}}</h3>
    <p>held on {{event_date}}</p>
    <div class="footer">
      <p>Certificate No: {{certificate_number}}</p>
      <p>Issued on: {{issued_date}}</p>
      <p>Organized by: {{organizer_name}}</p>
    </div>
  </div>'
);
```

---

## Storage Bucket Migration

**Filename**: `20251213000001_create_events_storage.sql`

```sql
-- Create bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for event images bucket

-- Staff and Admins can upload event images
CREATE POLICY "Staff and Admins can upload event images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'event-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);

-- Anyone can view event images (with signed URL)
CREATE POLICY "Anyone can view event images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'event-images');

CREATE POLICY "Anon can view event images"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'event-images');

-- Staff and Admins can update event images
CREATE POLICY "Staff and Admins can update event images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'event-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);

-- Staff and Admins can delete event images
CREATE POLICY "Staff and Admins can delete event images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'event-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);

-- Create bucket for certificates
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for certificates bucket

-- System can upload certificates
CREATE POLICY "Staff and Admins can upload certificates"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);

-- Users can view their own certificates
CREATE POLICY "Users can view own certificates"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'certificates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Staff and Admins can view all certificates
CREATE POLICY "Staff and Admins can view all certificates"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);
```

---

## Running the Migration

```bash
# Generate the migration files in supabase/migrations/
# Then push to Supabase
npx supabase db push

# Or if using local development
npx supabase db reset
```
