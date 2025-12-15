# Event Management System - Implementation Guide

## Overview

The Event Management System enables Staff and Administrators to create and manage events within the Swebuk platform. Students can register for events, track attendance, provide feedback, and receive certificates upon completion.

## Module Features

### 1. Event Creation and Management (Staff/Admins)
- Create new events with details (title, description, date, time, location)
- Set event types (workshop, seminar, hackathon, meetup, etc.)
- Configure event capacity and registration deadlines
- Associate events with specific clusters (optional)
- Publish, cancel, or archive events
- View event analytics and reports

### 2. Event Registration (Students)
- Browse upcoming events (public listing)
- Register for events
- View registered events on dashboard
- Cancel registration (before deadline)
- Receive registration confirmations

### 3. Event Attendance Tracking
- Check-in attendees (QR code or manual)
- Track attendance records
- Generate attendance reports
- Export attendance data

### 4. Feedback System
- Post-event feedback forms
- Rating system (1-5 stars)
- Written feedback/reviews
- Feedback analytics for organizers

### 5. Certificate Issuance
- Generate participation certificates
- Download certificates (PDF)
- Verify certificate authenticity
- Certificate templates management (Admin)

---

## Database Schema

### Core Tables

#### 1. `events` - Main Events Table
```sql
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
  location TEXT, -- Physical address or "Online"
  venue_name TEXT,
  meeting_url TEXT, -- For online/hybrid events

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
  certificate_template_id UUID REFERENCES public.certificate_templates(id),
  minimum_attendance_for_certificate INTEGER DEFAULT 80, -- Percentage

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
```

#### 2. `event_registrations` - Registration Records
```sql
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
  checked_in_by UUID REFERENCES public.profiles(id),
  check_in_method TEXT CHECK (check_in_method IN ('qr_code', 'manual', 'self')),

  -- Additional Info
  notes TEXT,

  -- Unique constraint (one registration per user per event)
  UNIQUE(event_id, user_id)
);
```

#### 3. `event_attendance` - Detailed Attendance Tracking (for multi-session events)
```sql
CREATE TABLE event_attendance (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE CASCADE,

  -- Session Info (for multi-day/multi-session events)
  session_name TEXT,
  session_date DATE NOT NULL,

  -- Attendance
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  duration_minutes INTEGER, -- Calculated from check-in/out

  -- Verification
  verified_by UUID REFERENCES public.profiles(id),
  verification_method TEXT CHECK (verification_method IN ('qr_scan', 'manual', 'biometric')),

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

#### 4. `event_feedback` - Feedback and Ratings
```sql
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
  highlights TEXT, -- What they liked most
  improvements TEXT, -- Suggestions for improvement

  -- Metadata
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- One feedback per user per event
  UNIQUE(event_id, user_id)
);
```

#### 5. `event_certificates` - Issued Certificates
```sql
CREATE TABLE event_certificates (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE CASCADE,

  -- Certificate Details
  certificate_number TEXT UNIQUE NOT NULL, -- e.g., "SWEBUK-2024-001234"
  certificate_url TEXT, -- Generated PDF URL

  -- Verification
  verification_code TEXT UNIQUE NOT NULL, -- Short code for verification
  is_verified BOOLEAN DEFAULT true,

  -- Issuance
  issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  issued_by UUID REFERENCES public.profiles(id),

  -- Download tracking
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,

  -- One certificate per user per event
  UNIQUE(event_id, user_id)
);
```

#### 6. `certificate_templates` - Certificate Template Management
```sql
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

  -- Placeholders available: {{participant_name}}, {{event_title}}, {{event_date}},
  -- {{certificate_number}}, {{issued_date}}, {{organizer_name}}, {{cluster_name}}

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  -- Metadata
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

#### 7. `event_tags` - Event Tags for Discovery
```sql
CREATE TABLE event_tags (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(event_id, tag)
);
```

---

## Row Level Security (RLS) Policies

### Events Table Policies

```sql
-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can view published public events
CREATE POLICY "Anyone can view published public events" ON events
  FOR SELECT USING (status = 'published' AND is_public = true);

-- 2. Authenticated users can view events they're registered for
CREATE POLICY "Users can view events they're registered for" ON events
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

-- 5. Organizers can view their own events
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

-- 7. Organizers, Staff, and Admins can update events
CREATE POLICY "Organizers can update own events" ON events
  FOR UPDATE USING (organizer_id = auth.uid());

CREATE POLICY "Staff and Admins can update any event" ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- 8. Only Admins can delete events
CREATE POLICY "Admins can delete events" ON events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Event Registrations Policies

```sql
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- 1. Users can view their own registrations
CREATE POLICY "Users can view own registrations" ON event_registrations
  FOR SELECT USING (user_id = auth.uid());

-- 2. Event organizers can view registrations for their events
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

-- 4. Authenticated users can register for events
CREATE POLICY "Users can register for events" ON event_registrations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.status = 'published'
      AND events.is_registration_required = true
      AND (events.registration_deadline IS NULL OR events.registration_deadline > NOW())
    )
  );

-- 5. Users can cancel their own registration
CREATE POLICY "Users can cancel own registration" ON event_registrations
  FOR UPDATE USING (
    user_id = auth.uid() AND
    status = 'registered'
  );

-- 6. Organizers/Staff/Admins can update registration status
CREATE POLICY "Organizers can update registrations" ON event_registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Staff and Admins can update any registration" ON event_registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );
```

### Event Feedback Policies

```sql
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can view non-anonymous feedback on published events
CREATE POLICY "Anyone can view public feedback" ON event_feedback
  FOR SELECT USING (
    is_anonymous = false AND
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_feedback.event_id
      AND events.status IN ('completed', 'archived')
    )
  );

-- 2. Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON event_feedback
  FOR SELECT USING (user_id = auth.uid());

-- 3. Organizers can view all feedback for their events
CREATE POLICY "Organizers can view event feedback" ON event_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_feedback.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- 4. Attendees can submit feedback
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

-- 5. Users can update their own feedback
CREATE POLICY "Users can update own feedback" ON event_feedback
  FOR UPDATE USING (user_id = auth.uid());
```

### Event Certificates Policies

```sql
ALTER TABLE event_certificates ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can view certificates (for verification)
CREATE POLICY "Anyone can view certificates" ON event_certificates
  FOR SELECT USING (true);

-- 2. Organizers/Staff/Admins can issue certificates
CREATE POLICY "Organizers can issue certificates" ON event_certificates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_certificates.event_id
      AND (
        events.organizer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role IN ('staff', 'admin')
        )
      )
    )
  );
```

---

## Views

### Detailed Events View
```sql
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
  e.created_at,
  e.updated_at,
  e.published_at,
  e.organizer_id,
  org.full_name AS organizer_name,
  org.avatar_url AS organizer_avatar,
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
    SELECT COALESCE(AVG(overall_rating), 0)
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
      e.max_capacity - (
        SELECT COUNT(*)
        FROM event_registrations er
        WHERE er.event_id = e.id AND er.status IN ('registered', 'attended')
      )
    ELSE NULL
  END AS available_spots
FROM events e
LEFT JOIN profiles org ON e.organizer_id = org.id
LEFT JOIN clusters c ON e.cluster_id = c.id;
```

### User Registrations View
```sql
CREATE OR REPLACE VIEW user_event_registrations AS
SELECT
  er.id AS registration_id,
  er.event_id,
  er.user_id,
  er.status AS registration_status,
  er.registered_at,
  er.checked_in_at,
  e.title AS event_title,
  e.slug AS event_slug,
  e.start_date,
  e.end_date,
  e.location_type,
  e.location,
  e.status AS event_status,
  e.banner_image_url,
  e.certificate_enabled,
  EXISTS (
    SELECT 1 FROM event_certificates ec
    WHERE ec.event_id = e.id AND ec.user_id = er.user_id
  ) AS has_certificate
FROM event_registrations er
JOIN events e ON er.event_id = e.id;
```

---

## Indexes

```sql
-- Events indexes
CREATE INDEX events_organizer_id_idx ON events(organizer_id);
CREATE INDEX events_cluster_id_idx ON events(cluster_id);
CREATE INDEX events_status_idx ON events(status);
CREATE INDEX events_event_type_idx ON events(event_type);
CREATE INDEX events_start_date_idx ON events(start_date);
CREATE INDEX events_slug_idx ON events(slug);
CREATE INDEX events_is_public_idx ON events(is_public) WHERE is_public = true;

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
CREATE INDEX event_certificates_certificate_number_idx ON event_certificates(certificate_number);
CREATE INDEX event_certificates_verification_code_idx ON event_certificates(verification_code);

-- Tags indexes
CREATE INDEX event_tags_event_id_idx ON event_tags(event_id);
CREATE INDEX event_tags_tag_idx ON event_tags(tag);
```

---

## Triggers

```sql
-- Update updated_at timestamp
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_event_feedback_updated_at
  BEFORE UPDATE ON event_feedback
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_certificate_templates_updated_at
  BEFORE UPDATE ON certificate_templates
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

---

## User Role Permissions Matrix

| Action | Student | Deputy Lead | Lead | Staff | Admin |
|--------|---------|-------------|------|-------|-------|
| View public events | ✅ | ✅ | ✅ | ✅ | ✅ |
| View cluster events | ✅ (member) | ✅ | ✅ | ✅ | ✅ |
| Register for events | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cancel registration | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit feedback | ✅ (attended) | ✅ | ✅ | ✅ | ✅ |
| Download certificate | ✅ (issued) | ✅ | ✅ | ✅ | ✅ |
| Create events | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit own events | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit any event | ❌ | ❌ | ❌ | ❌ | ✅ |
| Delete events | ❌ | ❌ | ❌ | ❌ | ✅ |
| View all registrations | ❌ | ❌ | ❌ | ✅ | ✅ |
| Check-in attendees | ❌ | ❌ | ❌ | ✅ | ✅ |
| Issue certificates | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage templates | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Event Status Workflow

```
[draft] → [published] → [completed] → [archived]
                ↓
          [cancelled]
```

### Status Definitions:
- **draft**: Event created but not visible to users
- **published**: Event is live and accepting registrations
- **cancelled**: Event was cancelled (refunds/notifications sent)
- **completed**: Event has ended, feedback collection enabled
- **archived**: Event is no longer active, kept for records

---

## Registration Status Workflow

```
[registered] → [attended] (checked in)
      ↓              ↓
[cancelled]    [no_show] (didn't attend)
      ↓
[waitlisted] (if capacity full)
```

---

## File Structure

```
/lib
  /constants
    /events.ts           # Event types, categories, statuses, helpers
  /supabase
    /event-actions.ts        # Public event viewing
    /event-student-actions.ts    # Student registration, feedback
    /event-staff-actions.ts      # Staff event management
    /event-admin-actions.ts      # Admin event & template management

/components
  /events
    /event-card.tsx          # Event listing card
    /event-form.tsx          # Create/edit event form
    /event-details.tsx       # Full event view
    /event-registration.tsx  # Registration component
    /event-filters.tsx       # Filters for event listing
    /event-calendar.tsx      # Calendar view
    /event-attendance.tsx    # Check-in component
    /event-feedback-form.tsx # Feedback submission
    /event-feedback-list.tsx # Feedback display
    /event-certificate.tsx   # Certificate display/download
    /event-stats.tsx         # Event statistics

/app
  /events
    /page.tsx                # Public events listing
    /[slug]/page.tsx         # Public event details
  /dashboard
    /student/events
      /page.tsx              # My registered events
    /staff/events
      /page.tsx              # Event management
      /new/page.tsx          # Create event
      /[id]/page.tsx         # Event details/edit
      /[id]/registrations/page.tsx  # Manage registrations
      /[id]/attendance/page.tsx     # Check-in interface
      /[id]/feedback/page.tsx       # View feedback
      /[id]/certificates/page.tsx   # Issue certificates
    /admin/events
      /page.tsx              # All events management
      /templates/page.tsx    # Certificate templates
```

---

## Storage Bucket

```sql
-- Create bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', false);

-- Policies for event images
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'event-images');

CREATE POLICY "Anyone can view event images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'event-images');

CREATE POLICY "Staff and Admins can delete event images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'event-images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);
```

---

## Next Steps

1. Create the database migration file
2. Implement constants/types file
3. Implement server actions (by role)
4. Create UI components
5. Build pages for each role
6. Add real-time features for live updates
7. Implement certificate generation (PDF)
8. Add QR code check-in system
9. Create notification integrations

See `EVENTS_MIGRATION.md` for the complete database migration.
See `EVENTS_CONSTANTS.md` for type definitions and constants.
See `EVENTS_ACTIONS.md` for server action implementations.
