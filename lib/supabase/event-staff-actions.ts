"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  DetailedEvent,
  DetailedEventRegistration,
  EventType,
  EventCategory,
  LocationType,
  EventStatus,
} from "@/lib/constants/events";
import { generateEventSlug } from "@/lib/constants/events";

// ============================================
// HELPER: Check Staff/Admin Permission
// ============================================

async function checkStaffPermission() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

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
    const eventData: Record<string, unknown> = {
      organizer_id: user.id,
      title: data.title,
      slug,
      description: data.description,
      short_description:
        data.short_description || data.description.substring(0, 200),
      event_type: data.event_type,
      category: data.category || null,
      start_date: data.start_date,
      end_date: data.end_date,
      registration_deadline: data.registration_deadline || null,
      location_type: data.location_type,
      location: data.location || null,
      venue_name: data.venue_name || null,
      meeting_url: data.meeting_url || null,
      max_capacity: data.max_capacity || null,
      is_registration_required: data.is_registration_required ?? true,
      is_public: data.is_public ?? true,
      cluster_id: data.cluster_id || null,
      banner_image_url: data.banner_image_url || null,
      status,
      certificate_enabled: data.certificate_enabled ?? false,
      certificate_template_id: data.certificate_template_id || null,
      minimum_attendance_for_certificate:
        data.minimum_attendance_for_certificate ?? 80,
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
      const tagRecords = data.tags.map((tag) => ({
        event_id: newEvent.id,
        tag: tag.toLowerCase().trim(),
      }));

      await supabase.from("event_tags").insert(tagRecords);
    }

    revalidatePath("/dashboard/staff/events");
    revalidatePath("/dashboard/admin/events");
    revalidatePath("/events");

    return { success: true, data: newEvent };
  } catch (error: unknown) {
    console.error("Error creating event:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create event";
    return { success: false, error: errorMessage };
  }
}

export async function updateEvent(
  eventId: string,
  data: Partial<CreateEventData>
) {
  const { allowed, user, supabase } = await checkStaffPermission();

  if (!allowed || !user) {
    return { success: false, error: "Not authorized" };
  }

  try {
    // Check if event can be edited
    const editCheck = await canEditEvent(eventId);

    if (!editCheck.canEdit) {
      return { success: false, error: editCheck.reason };
    }

    // Get existing event
    const { data: existing } = await supabase
      .from("events")
      .select("organizer_id, status, slug")
      .eq("id", eventId)
      .single();

    if (!existing) {
      return { success: false, error: "Event not found" };
    }

    const updateData: Record<string, unknown> = {};

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
      "description",
      "short_description",
      "event_type",
      "category",
      "start_date",
      "end_date",
      "registration_deadline",
      "location_type",
      "location",
      "venue_name",
      "meeting_url",
      "max_capacity",
      "is_registration_required",
      "is_public",
      "cluster_id",
      "banner_image_url",
      "certificate_enabled",
      "certificate_template_id",
      "minimum_attendance_for_certificate",
    ];

    fields.forEach((field) => {
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
        const tagRecords = data.tags.map((tag) => ({
          event_id: eventId,
          tag: tag.toLowerCase().trim(),
        }));
        await supabase.from("event_tags").insert(tagRecords);
      }
    }

    revalidatePath("/dashboard/staff/events");
    revalidatePath("/dashboard/admin/events");
    revalidatePath("/events");

    return { success: true };
  } catch (error: unknown) {
    console.error("Error updating event:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update event";
    return { success: false, error: errorMessage };
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
    revalidatePath("/dashboard/admin/events");
    revalidatePath("/events");

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to publish event";
    return { success: false, error: errorMessage };
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
    revalidatePath("/dashboard/admin/events");
    revalidatePath("/events");

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to cancel event";
    return { success: false, error: errorMessage };
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
    revalidatePath("/dashboard/admin/events");

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to complete event";
    return { success: false, error: errorMessage };
  }
}

// ============================================
// EVENT QUERIES (Staff)
// ============================================

export async function getMyOrganizedEvents(status?: EventStatus) {
  const { allowed, user, supabase } = await checkStaffPermission();

  if (!allowed || !user) return [];

  try {
    let query = supabase
      .from("detailed_events")
      .select("*")
      .eq("organizer_id", user.id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching events:", error);
      return [];
    }

    return (data as DetailedEvent[]) || [];
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

    // If filtering for completed, get events where end_date has passed
    if (status === "completed") {
      query = query.lt("end_date", new Date().toISOString());
    } else if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching events:", error);
      return [];
    }

    return (data as DetailedEvent[]) || [];
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
}

export async function getEventForManagement(eventId: string) {
  const { allowed, supabase } = await checkStaffPermission();

  if (!allowed) return null;

  try {
    const { data: event, error } = await supabase
      .from("detailed_events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error) {
      console.error("Error fetching event for management:", error);
      return null;
    }

    return event;
  } catch (error) {
    console.error("Unexpected error:", error);
    return null;
  }
}

// ============================================
// CHECK IF EVENT CAN BE EDITED
// ============================================

export async function canEditEvent(eventId: string) {
  const { allowed, supabase } = await checkStaffPermission();

  if (!allowed) {
    return {
      canEdit: false,
      reason: "Unauthorized",
    };
  }

  try {
    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, created_at")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return {
        canEdit: false,
        reason: "Event not found",
      };
    }

    // Check if event was created more than 3 days ago
    const createdAt = new Date(event.created_at);
    const now = new Date();
    const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceCreation > 3) {
      return {
        canEdit: false,
        reason: "Cannot edit event more than 3 days after creation",
        daysSinceCreation: Math.floor(daysSinceCreation),
      };
    }

    // Check if there are any registrations
    const { count: registrationCount } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    // Check guest registrations as well
    const { count: guestRegistrationCount } = await supabase
      .from("guest_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    const totalRegistrations = (registrationCount || 0) + (guestRegistrationCount || 0);

    if (totalRegistrations > 0) {
      return {
        canEdit: false,
        reason: "Cannot edit event with existing registrations",
        registrationCount: totalRegistrations,
      };
    }

    return {
      canEdit: true,
      daysSinceCreation: Math.floor(daysSinceCreation),
      daysRemaining: Math.ceil(3 - daysSinceCreation),
    };
  } catch (error) {
    console.error("Error checking edit eligibility:", error);
    return {
      canEdit: false,
      reason: "An error occurred while checking edit eligibility",
    };
  }
}

// ============================================
// DELETE EVENT
// ============================================

export async function canDeleteEvent(eventId: string) {
  const { allowed, supabase } = await checkStaffPermission();

  if (!allowed) {
    return {
      canDelete: false,
      reason: "Unauthorized",
    };
  }

  try {
    // Check if there are any registrations
    const { count: registrationCount } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    // Check guest registrations as well
    const { count: guestRegistrationCount } = await supabase
      .from("guest_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    const totalRegistrations = (registrationCount || 0) + (guestRegistrationCount || 0);

    if (totalRegistrations > 0) {
      return {
        canDelete: false,
        reason: "Cannot delete event with existing registrations",
        registrationCount: totalRegistrations,
      };
    }

    return {
      canDelete: true,
    };
  } catch (error) {
    console.error("Error checking delete eligibility:", error);
    return {
      canDelete: false,
      reason: "An error occurred while checking delete eligibility",
    };
  }
}

export async function deleteEvent(eventId: string) {
  const { allowed, supabase } = await checkStaffPermission();

  if (!allowed) {
    return { success: false, error: "Not authorized" };
  }

  try {
    // Check if event can be deleted
    const deleteCheck = await canDeleteEvent(eventId);

    if (!deleteCheck.canDelete) {
      return { success: false, error: deleteCheck.reason };
    }

    // Delete event (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (deleteError) throw deleteError;

    revalidatePath("/dashboard/staff/events");
    revalidatePath("/dashboard/admin/events");
    revalidatePath("/events");

    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting event:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete event";
    return { success: false, error: errorMessage };
  }
}

export async function getEventForEdit(eventId: string) {
  const { allowed, supabase } = await checkStaffPermission();

  if (!allowed) return null;

  try {
    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error) {
      console.error("Error fetching event:", error);
      return null;
    }

    // Get tags
    const { data: tags } = await supabase
      .from("event_tags")
      .select("tag")
      .eq("event_id", eventId);

    return {
      ...event,
      tags: tags?.map((t) => t.tag) || [],
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return null;
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

    return (data as DetailedEventRegistration[]) || [];
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to check in";
    return { success: false, error: errorMessage };
  }
}

export async function undoCheckIn(eventId: string, userId: string) {
  const { allowed, supabase } = await checkStaffPermission();

  if (!allowed) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const { error } = await supabase
      .from("event_registrations")
      .update({
        status: "registered",
        checked_in_at: null,
        checked_in_by: null,
        check_in_method: null,
      })
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .eq("status", "attended");

    if (error) throw error;

    revalidatePath(`/dashboard/staff/events/${eventId}/attendance`);

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to undo check-in";
    return { success: false, error: errorMessage };
  }
}

export async function bulkCheckIn(eventId: string, userIds: string[]) {
  const { allowed, user, supabase } = await checkStaffPermission();

  if (!allowed || !user) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const now = new Date().toISOString();
    let successCount = 0;

    for (const userId of userIds) {
      const { error } = await supabase
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

      if (!error) successCount++;
    }

    revalidatePath(`/dashboard/staff/events/${eventId}/attendance`);

    return { success: true, count: successCount };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to bulk check-in";
    return { success: false, error: errorMessage };
  }
}

export async function markAsNoShow(eventId: string, userId: string) {
  const { allowed, supabase } = await checkStaffPermission();

  if (!allowed) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const { error } = await supabase
      .from("event_registrations")
      .update({ status: "no_show" })
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .eq("status", "registered");

    if (error) throw error;

    revalidatePath(`/dashboard/staff/events/${eventId}/attendance`);

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to mark as no-show";
    return { success: false, error: errorMessage };
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

    // Generate certificate number
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("event_certificates")
      .select("*", { count: "exact", head: true });

    const certNumber = `SWEBUK-${year}-${String((count || 0) + 1).padStart(6, "0")}`;

    // Generate random verification code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let verificationCode = "";
    for (let i = 0; i < 8; i++) {
      verificationCode += chars.charAt(
        Math.floor(Math.random() * chars.length)
      );
    }

    // Create certificate record
    const { error } = await supabase.from("event_certificates").insert({
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
  } catch (error: unknown) {
    console.error("Error issuing certificate:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to issue certificate";
    return { success: false, error: errorMessage };
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

    const existingUserIds = new Set(existingCerts?.map((c) => c.user_id) || []);

    // Filter attendees without certificates
    const toIssue = attendees.filter((a) => !existingUserIds.has(a.user_id));

    if (toIssue.length === 0) {
      return {
        success: true,
        count: 0,
        message: "All certificates already issued",
      };
    }

    let issuedCount = 0;
    for (const attendee of toIssue) {
      const result = await issueCertificate(eventId, attendee.user_id);
      if (result.success) issuedCount++;
    }

    return { success: true, count: issuedCount };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to issue certificates";
    return { success: false, error: errorMessage };
  }
}

export async function getEventCertificates(eventId: string) {
  const { allowed, supabase } = await checkStaffPermission();

  if (!allowed) return [];

  try {
    const { data, error } = await supabase
      .from("event_certificates")
      .select(
        `
        *,
        profiles:user_id (full_name, email, avatar_url)
      `
      )
      .eq("event_id", eventId)
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
  } catch (error: unknown) {
    console.error("Error uploading image:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload image";
    return { success: false, error: errorMessage };
  }
}

export async function deleteEventImage(imageUrl: string) {
  const { allowed, supabase } = await checkStaffPermission();

  if (!allowed) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const { error } = await supabase.storage
      .from("event-images")
      .remove([imageUrl]);

    if (error) throw error;

    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting image:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete image";
    return { success: false, error: errorMessage };
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
      registered: registrations.filter((r) => r.status === "registered").length,
      attended: registrations.filter((r) => r.status === "attended").length,
      waitlisted: registrations.filter((r) => r.status === "waitlisted").length,
      cancelled: registrations.filter((r) => r.status === "cancelled").length,
      no_show: registrations.filter((r) => r.status === "no_show").length,
      feedback_count: feedback?.length || 0,
      average_rating:
        feedback && feedback.length > 0
          ? Math.round(
              (feedback.reduce((sum, f) => sum + f.overall_rating, 0) /
                feedback.length) *
                10
            ) / 10
          : 0,
      certificates_issued: certificatesCount || 0,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return null;
  }
}

export async function getEventFeedbackForStaff(eventId: string) {
  const { allowed, supabase } = await checkStaffPermission();

  if (!allowed) return [];

  try {
    const { data, error } = await supabase
      .from("detailed_event_feedback")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching feedback:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
}
