# Event Management System - Server Actions Implementation Guide

This document provides the complete server actions implementation for the Event Management System, following the established patterns in your codebase.

---

## File Structure

```
/lib/supabase/
  event-actions.ts          # Public event viewing (any user)
  event-student-actions.ts  # Student registration, feedback, certificates
  event-staff-actions.ts    # Staff event creation, management, attendance
  event-admin-actions.ts    # Admin event & template management
```

---

## 1. Public Event Actions (`event-actions.ts`)

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import type { DetailedEvent } from "@/lib/constants/events";

// ============================================
// IMAGE URL HELPER
// ============================================

async function getSignedImageUrl(filePath: string | null): Promise<string | null> {
  if (!filePath) return null;

  const supabase = await createClient();

  let path = filePath;
  if (filePath.startsWith('http')) {
    const urlParts = filePath.split('/event-images/');
    if (urlParts.length > 1) {
      path = urlParts[1];
    } else {
      return filePath;
    }
  }

  try {
    const { data, error } = await supabase.storage
      .from("event-images")
      .createSignedUrl(path, 3600);

    if (error) {
      console.error("Error creating signed URL for event image:", error);
      return null;
    }

    return data?.signedUrl?.replace('localhost', '127.0.0.1') || null;
  } catch (error) {
    console.error("Error getting event image signed URL:", error);
    return null;
  }
}

async function transformEventWithSignedUrl(event: DetailedEvent): Promise<DetailedEvent> {
  if (event.banner_image_url) {
    const signedUrl = await getSignedImageUrl(event.banner_image_url);
    return { ...event, banner_image_url: signedUrl };
  }
  return event;
}

async function transformEventsWithSignedUrls(events: DetailedEvent[]): Promise<DetailedEvent[]> {
  return Promise.all(events.map(transformEventWithSignedUrl));
}

// ============================================
// PUBLIC EVENT QUERIES
// ============================================

export interface GetEventsOptions {
  status?: "published" | "completed";
  eventType?: string;
  category?: string;
  clusterId?: string;
  search?: string;
  upcoming?: boolean;
  page?: number;
  limit?: number;
}

export async function getPublishedEvents(options: GetEventsOptions = {}) {
  const supabase = await createClient();

  const {
    status = "published",
    eventType,
    category,
    clusterId,
    search,
    upcoming = true,
    page = 1,
    limit = 12,
  } = options;

  try {
    let query = supabase
      .from("detailed_events")
      .select("*", { count: "exact" })
      .eq("status", status)
      .eq("is_public", true);

    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (clusterId) {
      query = query.eq("cluster_id", clusterId);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (upcoming && status === "published") {
      query = query.gte("start_date", new Date().toISOString());
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query
      .order("start_date", { ascending: upcoming })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching events:", error);
      return { events: [], total: 0 };
    }

    const events = await transformEventsWithSignedUrls(data as DetailedEvent[] || []);

    return {
      events,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  } catch (error) {
    console.error("Unexpected error fetching events:", error);
    return { events: [], total: 0 };
  }
}

export async function getEventBySlug(slug: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("detailed_events")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      console.error("Error fetching event:", error);
      return null;
    }

    return transformEventWithSignedUrl(data as DetailedEvent);
  } catch (error) {
    console.error("Unexpected error fetching event:", error);
    return null;
  }
}

export async function getEventById(eventId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("detailed_events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      console.error("Error fetching event:", error);
      return null;
    }

    return transformEventWithSignedUrl(data as DetailedEvent);
  } catch (error) {
    console.error("Unexpected error fetching event:", error);
    return null;
  }
}

export async function getUpcomingEvents(limit: number = 6) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("detailed_events")
      .select("*")
      .eq("status", "published")
      .eq("is_public", true)
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error fetching upcoming events:", error);
      return [];
    }

    return transformEventsWithSignedUrls(data as DetailedEvent[] || []);
  } catch (error) {
    console.error("Unexpected error fetching upcoming events:", error);
    return [];
  }
}

export async function getEventFeedback(eventId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("detailed_event_feedback")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching event feedback:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching feedback:", error);
    return [];
  }
}

export async function getEventFeedbackStats(eventId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("event_feedback")
      .select("overall_rating, content_rating, organization_rating, speaker_rating, venue_rating")
      .eq("event_id", eventId);

    if (error || !data || data.length === 0) {
      return null;
    }

    const count = data.length;
    const avg = (arr: (number | null)[]) => {
      const valid = arr.filter((n): n is number => n !== null);
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
    };

    return {
      total_feedback: count,
      average_overall: Math.round(avg(data.map(d => d.overall_rating)) * 10) / 10,
      average_content: Math.round(avg(data.map(d => d.content_rating)) * 10) / 10,
      average_organization: Math.round(avg(data.map(d => d.organization_rating)) * 10) / 10,
      average_speaker: Math.round(avg(data.map(d => d.speaker_rating)) * 10) / 10,
      average_venue: Math.round(avg(data.map(d => d.venue_rating)) * 10) / 10,
      rating_distribution: {
        5: data.filter(d => d.overall_rating === 5).length,
        4: data.filter(d => d.overall_rating === 4).length,
        3: data.filter(d => d.overall_rating === 3).length,
        2: data.filter(d => d.overall_rating === 2).length,
        1: data.filter(d => d.overall_rating === 1).length,
      },
    };
  } catch (error) {
    console.error("Error calculating feedback stats:", error);
    return null;
  }
}

// Certificate verification (public)
export async function verifyCertificate(verificationCode: string) {
  const supabase = await createClient();

  try {
    const { data: cert, error } = await supabase
      .from("event_certificates")
      .select(`
        *,
        events (title, start_date, end_date),
        profiles (full_name)
      `)
      .eq("verification_code", verificationCode.toUpperCase())
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { valid: false, message: "Certificate not found" };
      }
      throw error;
    }

    return {
      valid: cert.is_verified,
      certificate: {
        certificate_number: cert.certificate_number,
        participant_name: cert.profiles?.full_name,
        event_title: cert.events?.title,
        event_date: cert.events?.start_date,
        issued_at: cert.issued_at,
      },
    };
  } catch (error) {
    console.error("Error verifying certificate:", error);
    return { valid: false, message: "Verification failed" };
  }
}
```

---

## 2. Student Event Actions (`event-student-actions.ts`)

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  UserEventRegistration,
  EventFeedback,
  EventCertificate,
  RegistrationStatus
} from "@/lib/constants/events";

// ============================================
// MY REGISTRATIONS
// ============================================

export async function getMyRegistrations(status?: RegistrationStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  try {
    let query = supabase
      .from("user_event_registrations")
      .select("*")
      .eq("user_id", user.id)
      .order("start_date", { ascending: true });

    if (status) {
      query = query.eq("registration_status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching registrations:", error);
      return [];
    }

    return data as UserEventRegistration[] || [];
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
}

export async function getMyUpcomingRegistrations() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from("user_event_registrations")
      .select("*")
      .eq("user_id", user.id)
      .in("registration_status", ["registered", "attended"])
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true });

    if (error) {
      console.error("Error fetching upcoming registrations:", error);
      return [];
    }

    return data as UserEventRegistration[] || [];
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
}

export async function getMyRegistrationForEvent(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from("event_registrations")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      console.error("Error fetching registration:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error:", error);
    return null;
  }
}

// ============================================
// EVENT REGISTRATION
// ============================================

export async function registerForEvent(eventId: string, notes?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Check if event exists and is open for registration
    const { data: event } = await supabase
      .from("events")
      .select("id, status, max_capacity, registration_deadline, start_date")
      .eq("id", eventId)
      .single();

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    if (event.status !== "published") {
      return { success: false, error: "Event is not accepting registrations" };
    }

    // Check registration deadline
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      return { success: false, error: "Registration deadline has passed" };
    }

    // Check if event has started
    if (new Date(event.start_date) < new Date()) {
      return { success: false, error: "Event has already started" };
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from("event_registrations")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (existing && existing.status !== "cancelled") {
      return { success: false, error: "Already registered for this event" };
    }

    // Determine status (registered or waitlisted)
    let status: RegistrationStatus = "registered";

    if (event.max_capacity) {
      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .in("status", ["registered", "attended"]);

      if (count && count >= event.max_capacity) {
        status = "waitlisted";
      }
    }

    // Create or update registration
    if (existing) {
      // Re-register (was cancelled)
      const { error } = await supabase
        .from("event_registrations")
        .update({
          status,
          registered_at: new Date().toISOString(),
          cancelled_at: null,
          cancellation_reason: null,
          notes,
        })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      // New registration
      const { error } = await supabase
        .from("event_registrations")
        .insert({
          event_id: eventId,
          user_id: user.id,
          status,
          notes,
        });

      if (error) throw error;
    }

    revalidatePath("/dashboard/student/events");
    revalidatePath(`/events`);

    return {
      success: true,
      status,
      message: status === "waitlisted"
        ? "Added to waitlist. You will be notified if a spot opens up."
        : "Successfully registered for the event!",
    };
  } catch (error: any) {
    console.error("Error registering for event:", error);
    return { success: false, error: error.message || "Failed to register" };
  }
}

export async function cancelRegistration(eventId: string, reason?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Get the registration
    const { data: registration } = await supabase
      .from("event_registrations")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (!registration) {
      return { success: false, error: "Registration not found" };
    }

    if (registration.status === "cancelled") {
      return { success: false, error: "Registration already cancelled" };
    }

    if (registration.status === "attended") {
      return { success: false, error: "Cannot cancel after attending" };
    }

    // Update registration
    const { error } = await supabase
      .from("event_registrations")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
      })
      .eq("id", registration.id);

    if (error) throw error;

    revalidatePath("/dashboard/student/events");

    return { success: true, message: "Registration cancelled successfully" };
  } catch (error: any) {
    console.error("Error cancelling registration:", error);
    return { success: false, error: error.message || "Failed to cancel" };
  }
}

// ============================================
// FEEDBACK
// ============================================

export async function submitEventFeedback(eventId: string, feedback: {
  overall_rating: number;
  content_rating?: number;
  organization_rating?: number;
  speaker_rating?: number;
  venue_rating?: number;
  feedback_text?: string;
  highlights?: string;
  improvements?: string;
  is_anonymous?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Check if user attended the event
    const { data: registration } = await supabase
      .from("event_registrations")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (!registration || registration.status !== "attended") {
      return { success: false, error: "You must attend the event to submit feedback" };
    }

    // Check if already submitted
    const { data: existing } = await supabase
      .from("event_feedback")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return { success: false, error: "Feedback already submitted" };
    }

    // Submit feedback
    const { error } = await supabase
      .from("event_feedback")
      .insert({
        event_id: eventId,
        user_id: user.id,
        registration_id: registration.id,
        ...feedback,
      });

    if (error) throw error;

    revalidatePath(`/events/${eventId}`);
    revalidatePath("/dashboard/student/events");

    return { success: true, message: "Feedback submitted successfully" };
  } catch (error: any) {
    console.error("Error submitting feedback:", error);
    return { success: false, error: error.message || "Failed to submit feedback" };
  }
}

export async function getMyFeedbackForEvent(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from("event_feedback")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return data as EventFeedback;
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return null;
  }
}

export async function updateMyFeedback(feedbackId: string, updates: Partial<EventFeedback>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const { error } = await supabase
      .from("event_feedback")
      .update(updates)
      .eq("id", feedbackId)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/dashboard/student/events");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating feedback:", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// CERTIFICATES
// ============================================

export async function getMyCertificates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from("event_certificates")
      .select(`
        *,
        events (title, start_date, end_date, event_type)
      `)
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false });

    if (error) {
      console.error("Error fetching certificates:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
}

export async function getMyCertificateForEvent(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from("event_certificates")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return data as EventCertificate;
  } catch (error) {
    console.error("Error fetching certificate:", error);
    return null;
  }
}

export async function downloadCertificate(certificateId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Get certificate
    const { data: cert, error } = await supabase
      .from("event_certificates")
      .select("*")
      .eq("id", certificateId)
      .eq("user_id", user.id)
      .single();

    if (error || !cert) {
      return { success: false, error: "Certificate not found" };
    }

    // Update download count
    await supabase
      .from("event_certificates")
      .update({
        download_count: (cert.download_count || 0) + 1,
        last_downloaded_at: new Date().toISOString(),
      })
      .eq("id", certificateId);

    // Get signed URL for certificate file
    if (cert.certificate_url) {
      const { data: signedUrl } = await supabase.storage
        .from("certificates")
        .createSignedUrl(cert.certificate_url, 3600);

      return { success: true, url: signedUrl?.signedUrl };
    }

    return { success: false, error: "Certificate file not available" };
  } catch (error: any) {
    console.error("Error downloading certificate:", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// STATISTICS
// ============================================

export async function getMyEventStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  try {
    const { data: registrations } = await supabase
      .from("event_registrations")
      .select("status")
      .eq("user_id", user.id);

    const { data: certificates } = await supabase
      .from("event_certificates")
      .select("id")
      .eq("user_id", user.id);

    if (!registrations) return null;

    return {
      total_registrations: registrations.length,
      attended: registrations.filter(r => r.status === "attended").length,
      upcoming: registrations.filter(r => r.status === "registered").length,
      cancelled: registrations.filter(r => r.status === "cancelled").length,
      no_show: registrations.filter(r => r.status === "no_show").length,
      certificates_earned: certificates?.length || 0,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return null;
  }
}
```

---

## 3. Staff Event Actions (`event-staff-actions.ts`)

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  DetailedEvent,
  EventType,
  EventCategory,
  LocationType,
  EventStatus
} from "@/lib/constants/events";
import { generateEventSlug } from "@/lib/constants/events";

// ============================================
// HELPER: Check Staff/Admin Permission
// ============================================

async function checkStaffPermission() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { allowed: false, user: null, supabase };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const allowed = profile?.role === "staff" || profile?.role === "admin";

  return { allowed, user, supabase, role: profile?.role };
}

// ============================================
// EVENT CRUD OPERATIONS
// ============================================

export interface CreateEventData {
  title: string;
  description: string;
  short_description?: string;
  event_type: EventType;
  category?: EventCategory;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  location_type: LocationType;
  location?: string;
  venue_name?: string;
  meeting_url?: string;
  max_capacity?: number;
  is_registration_required?: boolean;
  is_public?: boolean;
  cluster_id?: string;
  banner_image_url?: string;
  tags?: string[];
  certificate_enabled?: boolean;
  certificate_template_id?: string;
  minimum_attendance_for_certificate?: number;
  saveAsDraft?: boolean;
}

export async function createEvent(data: CreateEventData) {
  const { allowed, user, supabase } = await checkStaffPermission();

  if (!allowed || !user) {
    return { success: false, error: "Not authorized" };
  }

  try {
    // Generate unique slug
    let slug = generateEventSlug(data.title);
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    // Determine status
    const status: EventStatus = data.saveAsDraft ? "draft" : "published";

    // Create event
    const eventData: any = {
      organizer_id: user.id,
      title: data.title,
      slug,
      description: data.description,
      short_description: data.short_description || data.description.substring(0, 200),
      event_type: data.event_type,
      category: data.category,
      start_date: data.start_date,
      end_date: data.end_date,
      registration_deadline: data.registration_deadline,
      location_type: data.location_type,
      location: data.location,
      venue_name: data.venue_name,
      meeting_url: data.meeting_url,
      max_capacity: data.max_capacity,
      is_registration_required: data.is_registration_required ?? true,
      is_public: data.is_public ?? true,
      cluster_id: data.cluster_id,
      banner_image_url: data.banner_image_url,
      status,
      certificate_enabled: data.certificate_enabled ?? false,
      certificate_template_id: data.certificate_template_id,
      minimum_attendance_for_certificate: data.minimum_attendance_for_certificate ?? 80,
    };

    if (status === "published") {
      eventData.published_at = new Date().toISOString();
    }

    const { data: newEvent, error: eventError } = await supabase
      .from("events")
      .insert(eventData)
      .select()
      .single();

    if (eventError) throw eventError;

    // Add tags
    if (data.tags && data.tags.length > 0) {
      const tagRecords = data.tags.map(tag => ({
        event_id: newEvent.id,
        tag: tag.toLowerCase().trim(),
      }));

      await supabase.from("event_tags").insert(tagRecords);
    }

    revalidatePath("/dashboard/staff/events");
    revalidatePath("/events");

    return { success: true, data: newEvent };
  } catch (error: any) {
    console.error("Error creating event:", error);
    return { success: false, error: error.message || "Failed to create event" };
  }
}

export async function updateEvent(eventId: string, data: Partial<CreateEventData>) {
  const { allowed, user, supabase } = await checkStaffPermission();

  if (!allowed || !user) {
    return { success: false, error: "Not authorized" };
  }

  try {
    // Get existing event
    const { data: existing } = await supabase
      .from("events")
      .select("organizer_id, status, slug")
      .eq("id", eventId)
      .single();

    if (!existing) {
      return { success: false, error: "Event not found" };
    }

    const updateData: any = {};

    // Update fields if provided
    if (data.title) {
      updateData.title = data.title;
      const newSlug = generateEventSlug(data.title);
      if (newSlug !== existing.slug.split("-").slice(0, -1).join("-")) {
        const { data: slugExists } = await supabase
          .from("events")
          .select("id")
          .eq("slug", newSlug)
          .neq("id", eventId)
          .single();
        updateData.slug = slugExists ? `${newSlug}-${Date.now()}` : newSlug;
      }
    }

    const fields = [
      "description", "short_description", "event_type", "category",
      "start_date", "end_date", "registration_deadline", "location_type",
      "location", "venue_name", "meeting_url", "max_capacity",
      "is_registration_required", "is_public", "cluster_id", "banner_image_url",
      "certificate_enabled", "certificate_template_id", "minimum_attendance_for_certificate"
    ];

    fields.forEach(field => {
      if (data[field as keyof CreateEventData] !== undefined) {
        updateData[field] = data[field as keyof CreateEventData];
      }
    });

    const { error: updateError } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", eventId);

    if (updateError) throw updateError;

    // Update tags if provided
    if (data.tags !== undefined) {
      await supabase.from("event_tags").delete().eq("event_id", eventId);

      if (data.tags.length > 0) {
        const tagRecords = data.tags.map(tag => ({
          event_id: eventId,
          tag: tag.toLowerCase().trim(),
        }));
        await supabase.from("event_tags").insert(tagRecords);
      }
    }

    revalidatePath("/dashboard/staff/events");
    revalidatePath("/events");

    return { success: true };
  } catch (error: any) {
    console.error("Error updating event:", error);
    return { success: false, error: error.message || "Failed to update event" };
  }
}

export async function publishEvent(eventId: string) {
  const { allowed, supabase } = await checkStaffPermission();

  if (!allowed) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const { error } = await supabase
      .from("events")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .eq("status", "draft");

    if (error) throw error;

    revalidatePath("/dashboard/staff/events");
    revalidatePath("/events");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function cancelEvent(eventId: string) {
  const { allowed, supabase } = await checkStaffPermission();

  if (!allowed) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const { error } = await supabase
      .from("events")
      .update({ status: "cancelled" })
      .eq("id", eventId);

    if (error) throw error;

    revalidatePath("/dashboard/staff/events");
    revalidatePath("/events");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function completeEvent(eventId: string) {
  const { allowed, supabase } = await checkStaffPermission();

  if (!allowed) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const { error } = await supabase
      .from("events")
      .update({ status: "completed" })
      .eq("id", eventId)
      .eq("status", "published");

    if (error) throw error;

    // Mark no-shows
    await supabase
      .from("event_registrations")
      .update({ status: "no_show" })
      .eq("event_id", eventId)
      .eq("status", "registered");

    revalidatePath("/dashboard/staff/events");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// EVENT QUERIES (Staff)
// ============================================

export async function getMyOrganizedEvents() {
  const { allowed, user, supabase } = await checkStaffPermission();

  if (!allowed || !user) return [];

  try {
    const { data, error } = await supabase
      .from("detailed_events")
      .select("*")
      .eq("organizer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching events:", error);
      return [];
    }

    return data as DetailedEvent[] || [];
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
}

export async function getAllEventsForManagement(status?: EventStatus) {
  const { allowed, supabase } = await checkStaffPermission();

  if (!allowed) return [];

  try {
    let query = supabase
      .from("detailed_events")
      .select("*")
      .order("start_date", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching events:", error);
      return [];
    }

    return data as DetailedEvent[] || [];
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
}

// ============================================
// REGISTRATION MANAGEMENT
// ============================================

export async function getEventRegistrations(eventId: string) {
  const { allowed, supabase } = await checkStaffPermission();

  if (!allowed) return [];

  try {
    const { data, error } = await supabase
      .from("detailed_event_registrations")
      .select("*")
      .eq("event_id", eventId)
      .order("registered_at", { ascending: false });

    if (error) {
      console.error("Error fetching registrations:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
}

export async function checkInAttendee(
  eventId: string,
  userId: string,
  method: "qr_code" | "manual" = "manual"
) {
  const { allowed, user, supabase } = await checkStaffPermission();

  if (!allowed || !user) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const { error } = await supabase
      .from("event_registrations")
      .update({
        status: "attended",
        checked_in_at: new Date().toISOString(),
        checked_in_by: user.id,
        check_in_method: method,
      })
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .in("status", ["registered", "waitlisted"]);

    if (error) throw error;

    revalidatePath(`/dashboard/staff/events/${eventId}/attendance`);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function bulkCheckIn(eventId: string, userIds: string[]) {
  const { allowed, user, supabase } = await checkStaffPermission();

  if (!allowed || !user) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const now = new Date().toISOString();

    for (const userId of userIds) {
      await supabase
        .from("event_registrations")
        .update({
          status: "attended",
          checked_in_at: now,
          checked_in_by: user.id,
          check_in_method: "manual",
        })
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .in("status", ["registered", "waitlisted"]);
    }

    revalidatePath(`/dashboard/staff/events/${eventId}/attendance`);

    return { success: true, count: userIds.length };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// CERTIFICATE ISSUANCE
// ============================================

export async function issueCertificate(eventId: string, userId: string) {
  const { allowed, user, supabase } = await checkStaffPermission();

  if (!allowed || !user) {
    return { success: false, error: "Not authorized" };
  }

  try {
    // Check if user attended
    const { data: registration } = await supabase
      .from("event_registrations")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single();

    if (!registration || registration.status !== "attended") {
      return { success: false, error: "User did not attend this event" };
    }

    // Check if already issued
    const { data: existing } = await supabase
      .from("event_certificates")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      return { success: false, error: "Certificate already issued" };
    }

    // Generate certificate number and verification code
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("event_certificates")
      .select("*", { count: "exact", head: true });

    const certNumber = `SWEBUK-${year}-${String((count || 0) + 1).padStart(6, "0")}`;

    // Generate random verification code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let verificationCode = "";
    for (let i = 0; i < 8; i++) {
      verificationCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Create certificate record
    const { error } = await supabase
      .from("event_certificates")
      .insert({
        event_id: eventId,
        user_id: userId,
        registration_id: registration.id,
        certificate_number: certNumber,
        verification_code: verificationCode,
        issued_by: user.id,
      });

    if (error) throw error;

    revalidatePath(`/dashboard/staff/events/${eventId}/certificates`);

    return { success: true, certificate_number: certNumber };
  } catch (error: any) {
    console.error("Error issuing certificate:", error);
    return { success: false, error: error.message };
  }
}

export async function bulkIssueCertificates(eventId: string) {
  const { allowed, user, supabase } = await checkStaffPermission();

  if (!allowed || !user) {
    return { success: false, error: "Not authorized" };
  }

  try {
    // Get all attendees without certificates
    const { data: attendees } = await supabase
      .from("event_registrations")
      .select("id, user_id")
      .eq("event_id", eventId)
      .eq("status", "attended");

    if (!attendees || attendees.length === 0) {
      return { success: false, error: "No attendees found" };
    }

    // Get existing certificates
    const { data: existingCerts } = await supabase
      .from("event_certificates")
      .select("user_id")
      .eq("event_id", eventId);

    const existingUserIds = new Set(existingCerts?.map(c => c.user_id) || []);

    // Filter attendees without certificates
    const toIssue = attendees.filter(a => !existingUserIds.has(a.user_id));

    if (toIssue.length === 0) {
      return { success: true, count: 0, message: "All certificates already issued" };
    }

    let issuedCount = 0;
    for (const attendee of toIssue) {
      const result = await issueCertificate(eventId, attendee.user_id);
      if (result.success) issuedCount++;
    }

    return { success: true, count: issuedCount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// IMAGE UPLOAD
// ============================================

export async function uploadEventImage(file: File) {
  const { allowed, user, supabase } = await checkStaffPermission();

  if (!allowed || !user) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/event_${timestamp}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("event-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    return { success: true, url: filePath };
  } catch (error: any) {
    console.error("Error uploading image:", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// STATISTICS
// ============================================

export async function getEventStats(eventId: string) {
  const { allowed, supabase } = await checkStaffPermission();

  if (!allowed) return null;

  try {
    const { data: registrations } = await supabase
      .from("event_registrations")
      .select("status")
      .eq("event_id", eventId);

    const { data: feedback } = await supabase
      .from("event_feedback")
      .select("overall_rating")
      .eq("event_id", eventId);

    const { count: certificatesCount } = await supabase
      .from("event_certificates")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    if (!registrations) return null;

    return {
      total_registrations: registrations.length,
      registered: registrations.filter(r => r.status === "registered").length,
      attended: registrations.filter(r => r.status === "attended").length,
      waitlisted: registrations.filter(r => r.status === "waitlisted").length,
      cancelled: registrations.filter(r => r.status === "cancelled").length,
      no_show: registrations.filter(r => r.status === "no_show").length,
      feedback_count: feedback?.length || 0,
      average_rating: feedback && feedback.length > 0
        ? feedback.reduce((sum, f) => sum + f.overall_rating, 0) / feedback.length
        : 0,
      certificates_issued: certificatesCount || 0,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return null;
  }
}
```

---

## 4. Admin Event Actions (`event-admin-actions.ts`)

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CertificateTemplate, CertificateType } from "@/lib/constants/events";

// ============================================
// HELPER: Check Admin Permission
// ============================================

async function checkAdminPermission() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { allowed: false, user: null, supabase };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return { allowed: profile?.role === "admin", user, supabase };
}

// ============================================
// EVENT ADMINISTRATION
// ============================================

export async function deleteEvent(eventId: string) {
  const { allowed, supabase } = await checkAdminPermission();

  if (!allowed) {
    return { success: false, error: "Admin access required" };
  }

  try {
    // Get event to delete associated images
    const { data: event } = await supabase
      .from("events")
      .select("banner_image_url")
      .eq("id", eventId)
      .single();

    // Delete event (cascade will handle related records)
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) throw error;

    // Delete banner image from storage
    if (event?.banner_image_url) {
      try {
        await supabase.storage.from("event-images").remove([event.banner_image_url]);
      } catch (e) {
        console.error("Error deleting image:", e);
      }
    }

    revalidatePath("/dashboard/admin/events");
    revalidatePath("/events");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting event:", error);
    return { success: false, error: error.message };
  }
}

export async function archiveEvent(eventId: string) {
  const { allowed, supabase } = await checkAdminPermission();

  if (!allowed) {
    return { success: false, error: "Admin access required" };
  }

  try {
    const { error } = await supabase
      .from("events")
      .update({ status: "archived" })
      .eq("id", eventId);

    if (error) throw error;

    revalidatePath("/dashboard/admin/events");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// CERTIFICATE TEMPLATE MANAGEMENT
// ============================================

export async function getCertificateTemplates() {
  const { allowed, supabase } = await checkAdminPermission();

  if (!allowed) return [];

  try {
    const { data, error } = await supabase
      .from("certificate_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
      return [];
    }

    return data as CertificateTemplate[] || [];
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  template_type: CertificateType;
  background_image_url?: string;
  template_html?: string;
  css_styles?: string;
  is_default?: boolean;
}

export async function createCertificateTemplate(data: CreateTemplateData) {
  const { allowed, user, supabase } = await checkAdminPermission();

  if (!allowed || !user) {
    return { success: false, error: "Admin access required" };
  }

  try {
    // If setting as default, unset other defaults
    if (data.is_default) {
      await supabase
        .from("certificate_templates")
        .update({ is_default: false })
        .eq("is_default", true);
    }

    const { data: template, error } = await supabase
      .from("certificate_templates")
      .insert({
        ...data,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/admin/events/templates");

    return { success: true, data: template };
  } catch (error: any) {
    console.error("Error creating template:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCertificateTemplate(
  templateId: string,
  data: Partial<CreateTemplateData>
) {
  const { allowed, supabase } = await checkAdminPermission();

  if (!allowed) {
    return { success: false, error: "Admin access required" };
  }

  try {
    if (data.is_default) {
      await supabase
        .from("certificate_templates")
        .update({ is_default: false })
        .eq("is_default", true)
        .neq("id", templateId);
    }

    const { error } = await supabase
      .from("certificate_templates")
      .update(data)
      .eq("id", templateId);

    if (error) throw error;

    revalidatePath("/dashboard/admin/events/templates");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCertificateTemplate(templateId: string) {
  const { allowed, supabase } = await checkAdminPermission();

  if (!allowed) {
    return { success: false, error: "Admin access required" };
  }

  try {
    // Check if template is in use
    const { count } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("certificate_template_id", templateId);

    if (count && count > 0) {
      return { success: false, error: "Template is in use by events" };
    }

    const { error } = await supabase
      .from("certificate_templates")
      .delete()
      .eq("id", templateId);

    if (error) throw error;

    revalidatePath("/dashboard/admin/events/templates");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// ADMIN ANALYTICS
// ============================================

export async function getEventAnalytics() {
  const { allowed, supabase } = await checkAdminPermission();

  if (!allowed) return null;

  try {
    // Get event counts by status
    const { data: events } = await supabase
      .from("events")
      .select("status, event_type, created_at");

    // Get registration stats
    const { data: registrations } = await supabase
      .from("event_registrations")
      .select("status, registered_at");

    // Get certificate stats
    const { count: certificatesCount } = await supabase
      .from("event_certificates")
      .select("*", { count: "exact", head: true });

    // Get feedback stats
    const { data: feedback } = await supabase
      .from("event_feedback")
      .select("overall_rating");

    if (!events || !registrations) return null;

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      events: {
        total: events.length,
        by_status: {
          draft: events.filter(e => e.status === "draft").length,
          published: events.filter(e => e.status === "published").length,
          completed: events.filter(e => e.status === "completed").length,
          cancelled: events.filter(e => e.status === "cancelled").length,
          archived: events.filter(e => e.status === "archived").length,
        },
        by_type: EVENT_TYPES.reduce((acc, type) => {
          acc[type.value] = events.filter(e => e.event_type === type.value).length;
          return acc;
        }, {} as Record<string, number>),
        this_month: events.filter(e => new Date(e.created_at) >= thisMonth).length,
      },
      registrations: {
        total: registrations.length,
        by_status: {
          registered: registrations.filter(r => r.status === "registered").length,
          attended: registrations.filter(r => r.status === "attended").length,
          cancelled: registrations.filter(r => r.status === "cancelled").length,
          no_show: registrations.filter(r => r.status === "no_show").length,
        },
        this_month: registrations.filter(r => new Date(r.registered_at) >= thisMonth).length,
        attendance_rate: registrations.length > 0
          ? (registrations.filter(r => r.status === "attended").length / registrations.length) * 100
          : 0,
      },
      certificates: {
        total: certificatesCount || 0,
      },
      feedback: {
        total: feedback?.length || 0,
        average_rating: feedback && feedback.length > 0
          ? feedback.reduce((sum, f) => sum + f.overall_rating, 0) / feedback.length
          : 0,
      },
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return null;
  }
}

// Import EVENT_TYPES for analytics
import { EVENT_TYPES } from "@/lib/constants/events";
```

---

## Usage Example

```typescript
// In a page or component
import { getPublishedEvents, registerForEvent } from "@/lib/supabase/event-actions";
import { getMyRegistrations } from "@/lib/supabase/event-student-actions";
import { createEvent } from "@/lib/supabase/event-staff-actions";

// Fetch events
const { events, total } = await getPublishedEvents({
  eventType: "workshop",
  upcoming: true,
  limit: 10,
});

// Register for event
const result = await registerForEvent(eventId);
if (result.success) {
  console.log(result.message);
}

// Create event (staff only)
const event = await createEvent({
  title: "React Workshop",
  description: "Learn React fundamentals",
  event_type: "workshop",
  start_date: "2024-02-01T10:00:00Z",
  end_date: "2024-02-01T14:00:00Z",
  location_type: "physical",
  location: "Room 204",
});
```
