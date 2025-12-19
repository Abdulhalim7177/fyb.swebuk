"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  CertificateTemplate,
  CertificateType,
  EVENT_TYPES,
} from "@/lib/constants/events";

// ============================================
// HELPER: Check Admin Permission
// ============================================

async function checkAdminPermission() {
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
    const { error } = await supabase.from("events").delete().eq("id", eventId);

    if (error) throw error;

    // Delete banner image from storage
    if (event?.banner_image_url) {
      try {
        await supabase.storage
          .from("event-images")
          .remove([event.banner_image_url]);
      } catch (e) {
        console.error("Error deleting image:", e);
      }
    }

    revalidatePath("/dashboard/admin/events");
    revalidatePath("/dashboard/staff/events");
    revalidatePath("/events");

    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting event:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete event";
    return { success: false, error: errorMessage };
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
    revalidatePath("/dashboard/staff/events");

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to archive event";
    return { success: false, error: errorMessage };
  }
}

export async function restoreEvent(eventId: string) {
  const { allowed, supabase } = await checkAdminPermission();

  if (!allowed) {
    return { success: false, error: "Admin access required" };
  }

  try {
    const { error } = await supabase
      .from("events")
      .update({ status: "completed" })
      .eq("id", eventId)
      .eq("status", "archived");

    if (error) throw error;

    revalidatePath("/dashboard/admin/events");

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to restore event";
    return { success: false, error: errorMessage };
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

    return (data as CertificateTemplate[]) || [];
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
}

export async function getCertificateTemplate(templateId: string) {
  const { allowed, supabase } = await checkAdminPermission();

  if (!allowed) return null;

  try {
    const { data, error } = await supabase
      .from("certificate_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (error) {
      console.error("Error fetching template:", error);
      return null;
    }

    return data as CertificateTemplate;
  } catch (error) {
    console.error("Unexpected error:", error);
    return null;
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
  } catch (error: unknown) {
    console.error("Error creating template:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create template";
    return { success: false, error: errorMessage };
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update template";
    return { success: false, error: errorMessage };
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete template";
    return { success: false, error: errorMessage };
  }
}

export async function toggleTemplateActive(templateId: string) {
  const { allowed, supabase } = await checkAdminPermission();

  if (!allowed) {
    return { success: false, error: "Admin access required" };
  }

  try {
    // Get current state
    const { data: template } = await supabase
      .from("certificate_templates")
      .select("is_active")
      .eq("id", templateId)
      .single();

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    const { error } = await supabase
      .from("certificate_templates")
      .update({ is_active: !template.is_active })
      .eq("id", templateId);

    if (error) throw error;

    revalidatePath("/dashboard/admin/events/templates");

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to toggle template";
    return { success: false, error: errorMessage };
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

    // Count events by type
    const eventTypes = [
      "workshop",
      "seminar",
      "hackathon",
      "meetup",
      "conference",
      "training",
      "webinar",
      "competition",
      "other",
    ] as const;

    const byType: Record<string, number> = {};
    eventTypes.forEach((type) => {
      byType[type] = events.filter((e) => e.event_type === type).length;
    });

    return {
      events: {
        total: events.length,
        by_status: {
          draft: events.filter((e) => e.status === "draft").length,
          published: events.filter((e) => e.status === "published").length,
          completed: events.filter((e) => e.status === "completed").length,
          cancelled: events.filter((e) => e.status === "cancelled").length,
          archived: events.filter((e) => e.status === "archived").length,
        },
        by_type: byType,
        this_month: events.filter((e) => new Date(e.created_at) >= thisMonth)
          .length,
      },
      registrations: {
        total: registrations.length,
        by_status: {
          registered: registrations.filter((r) => r.status === "registered")
            .length,
          attended: registrations.filter((r) => r.status === "attended").length,
          cancelled: registrations.filter((r) => r.status === "cancelled")
            .length,
          no_show: registrations.filter((r) => r.status === "no_show").length,
          waitlisted: registrations.filter((r) => r.status === "waitlisted")
            .length,
        },
        this_month: registrations.filter(
          (r) => new Date(r.registered_at) >= thisMonth
        ).length,
        attendance_rate:
          registrations.length > 0
            ? Math.round(
                (registrations.filter((r) => r.status === "attended").length /
                  registrations.filter((r) =>
                    ["registered", "attended", "no_show"].includes(r.status)
                  ).length) *
                  100
              )
            : 0,
      },
      certificates: {
        total: certificatesCount || 0,
      },
      feedback: {
        total: feedback?.length || 0,
        average_rating:
          feedback && feedback.length > 0
            ? Math.round(
                (feedback.reduce((sum, f) => sum + f.overall_rating, 0) /
                  feedback.length) *
                  10
              ) / 10
            : 0,
      },
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return null;
  }
}

export async function getRecentEventActivity(limit: number = 10) {
  const { allowed, supabase } = await checkAdminPermission();

  if (!allowed) return [];

  try {
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        id,
        title,
        slug,
        status,
        event_type,
        start_date,
        created_at,
        updated_at,
        profiles:organizer_id (full_name)
      `
      )
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching recent activity:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
}

export async function getAllCertificates(page: number = 1, limit: number = 20) {
  const { allowed, supabase } = await checkAdminPermission();

  if (!allowed) return { certificates: [], total: 0 };

  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("event_certificates")
      .select(
        `
        *,
        events (title, event_type),
        profiles:user_id (full_name, email)
      `,
        { count: "exact" }
      )
      .order("issued_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching certificates:", error);
      return { certificates: [], total: 0 };
    }

    return {
      certificates: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { certificates: [], total: 0 };
  }
}

export async function revokeCertificate(certificateId: string) {
  const { allowed, supabase } = await checkAdminPermission();

  if (!allowed) {
    return { success: false, error: "Admin access required" };
  }

  try {
    const { error } = await supabase
      .from("event_certificates")
      .update({ is_verified: false })
      .eq("id", certificateId);

    if (error) throw error;

    revalidatePath("/dashboard/admin/events");

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to revoke certificate";
    return { success: false, error: errorMessage };
  }
}

export async function reinstateCertificate(certificateId: string) {
  const { allowed, supabase } = await checkAdminPermission();

  if (!allowed) {
    return { success: false, error: "Admin access required" };
  }

  try {
    const { error } = await supabase
      .from("event_certificates")
      .update({ is_verified: true })
      .eq("id", certificateId);

    if (error) throw error;

    revalidatePath("/dashboard/admin/events");

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to reinstate certificate";
    return { success: false, error: errorMessage };
  }
}

// ============================================
// BULK OPERATIONS
// ============================================

export async function bulkDeleteEvents(eventIds: string[]) {
  const { allowed, supabase } = await checkAdminPermission();

  if (!allowed) {
    return { success: false, error: "Admin access required" };
  }

  try {
    const { error } = await supabase
      .from("events")
      .delete()
      .in("id", eventIds);

    if (error) throw error;

    revalidatePath("/dashboard/admin/events");
    revalidatePath("/events");

    return { success: true, count: eventIds.length };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete events";
    return { success: false, error: errorMessage };
  }
}

export async function bulkArchiveEvents(eventIds: string[]) {
  const { allowed, supabase } = await checkAdminPermission();

  if (!allowed) {
    return { success: false, error: "Admin access required" };
  }

  try {
    const { error } = await supabase
      .from("events")
      .update({ status: "archived" })
      .in("id", eventIds);

    if (error) throw error;

    revalidatePath("/dashboard/admin/events");

    return { success: true, count: eventIds.length };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to archive events";
    return { success: false, error: errorMessage };
  }
}
