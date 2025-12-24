"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  UserEventRegistration,
  EventFeedback,
  EventCertificate,
  RegistrationStatus,
} from "@/lib/constants/events";

// ============================================
// MY REGISTRATIONS
// ============================================

export async function getMyRegistrations(status?: RegistrationStatus) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

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

    return (data as UserEventRegistration[]) || [];
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
}

export async function getMyUpcomingRegistrations() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) return [];

  try {
    // Get authenticated registrations
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

    // Also get guest registrations by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    if (profile?.email) {
      const { data: guestRegs } = await supabase
        .from("guest_registrations")
        .select(`
          id,
          event_id,
          status,
          registered_at,
          events!inner (
            id,
            title,
            slug,
            description,
            short_description,
            start_date,
            end_date,
            location_type,
            location,
            venue_name,
            event_type,
            category,
            organizer_id,
            profiles!events_organizer_id_fkey (
              full_name,
              avatar_url
            )
          )
        `)
        .eq("email", profile.email.toLowerCase())
        .in("status", ["registered", "attended"])
        .gte("events.start_date", new Date().toISOString());

      if (guestRegs && guestRegs.length > 0) {
        // Transform guest registrations to match UserEventRegistration format
        const transformedGuestRegs = guestRegs.map((reg: any) => ({
          registration_id: reg.id,
          event_id: reg.event_id,
          user_id: user.id,
          registration_status: reg.status,
          registered_at: reg.registered_at,
          event_title: reg.events.title,
          event_slug: reg.events.slug,
          event_description: reg.events.description,
          short_description: reg.events.short_description,
          start_date: reg.events.start_date,
          end_date: reg.events.end_date,
          location_type: reg.events.location_type,
          location: reg.events.location,
          venue_name: reg.events.venue_name,
          event_type: reg.events.event_type,
          category: reg.events.category,
          organizer_id: reg.events.organizer_id,
          organizer_name: reg.events.profiles?.full_name,
          organizer_avatar: reg.events.profiles?.avatar_url,
          has_feedback: false,
          has_certificate: false,
          is_guest_registration: true,
        }));

        // Merge and sort by start_date
        const allRegistrations = [...(data || []), ...transformedGuestRegs].sort(
          (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );

        return allRegistrations as UserEventRegistration[];
      }
    }

    return (data as UserEventRegistration[]) || [];
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
}

export async function getMyPastRegistrations() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) return [];

  try {
    // Get authenticated registrations
    const { data, error } = await supabase
      .from("user_event_registrations")
      .select("*")
      .eq("user_id", user.id)
      .lt("end_date", new Date().toISOString())
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Error fetching past registrations:", error);
      return [];
    }

    // Also get guest registrations by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    if (profile?.email) {
      const { data: guestRegs } = await supabase
        .from("guest_registrations")
        .select(`
          id,
          event_id,
          status,
          registered_at,
          events!inner (
            id,
            title,
            slug,
            description,
            short_description,
            start_date,
            end_date,
            location_type,
            location,
            venue_name,
            event_type,
            category,
            organizer_id,
            profiles!events_organizer_id_fkey (
              full_name,
              avatar_url
            )
          )
        `)
        .eq("email", profile.email.toLowerCase())
        .lt("events.end_date", new Date().toISOString());

      if (guestRegs && guestRegs.length > 0) {
        // Transform guest registrations to match UserEventRegistration format
        const transformedGuestRegs = guestRegs.map((reg: any) => ({
          registration_id: reg.id,
          event_id: reg.event_id,
          user_id: user.id,
          registration_status: reg.status,
          registered_at: reg.registered_at,
          event_title: reg.events.title,
          event_slug: reg.events.slug,
          event_description: reg.events.description,
          short_description: reg.events.short_description,
          start_date: reg.events.start_date,
          end_date: reg.events.end_date,
          location_type: reg.events.location_type,
          location: reg.events.location,
          venue_name: reg.events.venue_name,
          event_type: reg.events.event_type,
          category: reg.events.category,
          organizer_id: reg.events.organizer_id,
          organizer_name: reg.events.profiles?.full_name,
          organizer_avatar: reg.events.profiles?.avatar_url,
          has_feedback: false,
          has_certificate: false,
          is_guest_registration: true,
        }));

        // Merge and sort by start_date (descending)
        const allRegistrations = [...(data || []), ...transformedGuestRegs].sort(
          (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );

        return allRegistrations as UserEventRegistration[];
      }
    }

    return (data as UserEventRegistration[]) || [];
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
}

export async function getMyRegistrationForEvent(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

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
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

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
    if (
      event.registration_deadline &&
      new Date(event.registration_deadline) < new Date()
    ) {
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
      const { error } = await supabase.from("event_registrations").insert({
        event_id: eventId,
        user_id: user.id,
        status,
        notes,
      });

      if (error) throw error;
    }

    revalidatePath("/dashboard/student/events");
    revalidatePath("/events");

    return {
      success: true,
      status,
      message:
        status === "waitlisted"
          ? "Added to waitlist. You will be notified if a spot opens up."
          : "Successfully registered for the event!",
    };
  } catch (error: unknown) {
    console.error("Error registering for event:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to register";
    return { success: false, error: errorMessage };
  }
}

export async function cancelRegistration(eventId: string, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

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
    revalidatePath("/events");

    return { success: true, message: "Registration cancelled successfully" };
  } catch (error: unknown) {
    console.error("Error cancelling registration:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to cancel";
    return { success: false, error: errorMessage };
  }
}

// ============================================
// FEEDBACK
// ============================================

export async function submitEventFeedback(
  eventId: string,
  feedback: {
    overall_rating: number;
    content_rating?: number;
    organization_rating?: number;
    speaker_rating?: number;
    venue_rating?: number;
    feedback_text?: string;
    highlights?: string;
    improvements?: string;
    is_anonymous?: boolean;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

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
      return {
        success: false,
        error: "You must attend the event to submit feedback",
      };
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
    const { error } = await supabase.from("event_feedback").insert({
      event_id: eventId,
      user_id: user.id,
      registration_id: registration.id,
      ...feedback,
    });

    if (error) throw error;

    revalidatePath(`/events/${eventId}`);
    revalidatePath("/dashboard/student/events");

    return { success: true, message: "Feedback submitted successfully" };
  } catch (error: unknown) {
    console.error("Error submitting feedback:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to submit feedback";
    return { success: false, error: errorMessage };
  }
}

export async function getMyFeedbackForEvent(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

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

export async function updateMyFeedback(
  feedbackId: string,
  updates: Partial<EventFeedback>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

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
  } catch (error: unknown) {
    console.error("Error updating feedback:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update feedback";
    return { success: false, error: errorMessage };
  }
}

// ============================================
// CERTIFICATES
// ============================================

export async function getMyCertificates() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) return [];

  try {
    // First get certificates without joining events to avoid RLS recursion
    const { data: certificates, error: certError } = await supabase
      .from("event_certificates")
      .select("*")
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false });

    if (certError) {
      console.error("Error fetching certificates:", certError);
      return [];
    }

    if (!certificates || certificates.length === 0) {
      return [];
    }

    // Then get event details separately
    const eventIds = certificates.map((cert: any) => cert.event_id);
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, title, start_date, end_date, event_type")
      .in("id", eventIds);

    if (eventsError) {
      console.error("Error fetching event details:", eventsError);
      // Return certificates without event details rather than failing completely
      return certificates;
    }

    // Combine the data
    const eventsMap = new Map(events?.map((e: any) => [e.id, e]) || []);
    return certificates.map((cert: any) => ({
      ...cert,
      events: eventsMap.get(cert.event_id) || null,
    }));
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
}

export async function getMyCertificateForEvent(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

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
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

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
  } catch (error: unknown) {
    console.error("Error downloading certificate:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to download certificate";
    return { success: false, error: errorMessage };
  }
}

// ============================================
// STATISTICS
// ============================================

export async function getMyEventStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

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
      attended: registrations.filter((r) => r.status === "attended").length,
      upcoming: registrations.filter((r) => r.status === "registered").length,
      cancelled: registrations.filter((r) => r.status === "cancelled").length,
      no_show: registrations.filter((r) => r.status === "no_show").length,
      certificates_earned: certificates?.length || 0,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return null;
  }
}

// ============================================
// CHECK REGISTRATION STATUS
// ============================================

export async function checkRegistrationStatus(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return { isRegistered: false, status: null };
  }

  try {
    // First check event_registrations (authenticated registrations)
    const { data, error } = await supabase
      .from("event_registrations")
      .select("status")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (data && !error) {
      return {
        isRegistered: data.status !== "cancelled",
        status: data.status as RegistrationStatus,
      };
    }

    // If no authenticated registration found, check guest_registrations by email
    if (error && error.code === "PGRST116") {
      // Get user's email from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      if (profile?.email) {
        const { data: guestReg } = await supabase
          .from("guest_registrations")
          .select("status")
          .eq("event_id", eventId)
          .eq("email", profile.email.toLowerCase())
          .single();

        if (guestReg) {
          return {
            isRegistered: guestReg.status !== "cancelled",
            status: guestReg.status as RegistrationStatus,
            isGuestRegistration: true,
          };
        }
      }

      return { isRegistered: false, status: null };
    }

    if (error) {
      throw error;
    }

    return { isRegistered: false, status: null };
  } catch (error) {
    console.error("Error checking registration:", error);
    return { isRegistered: false, status: null };
  }
}
