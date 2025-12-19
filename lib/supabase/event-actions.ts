"use server";

import { createClient } from "@/lib/supabase/server";
import type { DetailedEvent, DetailedEventFeedback } from "@/lib/constants/events";

// ============================================
// IMAGE URL HELPER
// ============================================

async function getSignedImageUrl(filePath: string | null): Promise<string | null> {
  if (!filePath) return null;

  const supabase = await createClient();

  let path = filePath;
  if (filePath.startsWith("http")) {
    const urlParts = filePath.split("/event-images/");
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

    return data?.signedUrl?.replace("localhost", "127.0.0.1") || null;
  } catch (error) {
    console.error("Error getting event image signed URL:", error);
    return null;
  }
}

async function transformEventWithSignedUrl(
  event: DetailedEvent
): Promise<DetailedEvent> {
  if (event.banner_image_url) {
    const signedUrl = await getSignedImageUrl(event.banner_image_url);
    return { ...event, banner_image_url: signedUrl };
  }
  return event;
}

async function transformEventsWithSignedUrls(
  events: DetailedEvent[]
): Promise<DetailedEvent[]> {
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

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.order("start_date", { ascending: upcoming }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching events:", error);
      return { events: [], total: 0, page, limit, totalPages: 0 };
    }

    const events = await transformEventsWithSignedUrls(
      (data as DetailedEvent[]) || []
    );

    return {
      events,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  } catch (error) {
    console.error("Unexpected error fetching events:", error);
    return { events: [], total: 0, page, limit, totalPages: 0 };
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

export async function getEventRegisteredUsers(
  eventId: string,
  limit: number = 10
): Promise<Array<{ id: string; avatar_url: string | null; full_name: string | null }>> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("event_registrations")
      .select(`
        user_id,
        profiles!event_registrations_user_id_fkey(
          id,
          avatar_url,
          full_name
        )
      `)
      .eq("event_id", eventId)
      .in("status", ["registered", "attended"])
      .order("registered_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error fetching registered users:", error);
      return [];
    }

    if (!data) return [];

    // Transform the data to match the expected format
    return data.map((registration: any) => ({
      id: registration.profiles.id,
      avatar_url: registration.profiles.avatar_url,
      full_name: registration.profiles.full_name,
    }));
  } catch (error) {
    console.error("Unexpected error fetching registered users:", error);
    return [];
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

    return transformEventsWithSignedUrls((data as DetailedEvent[]) || []);
  } catch (error) {
    console.error("Unexpected error fetching upcoming events:", error);
    return [];
  }
}

export async function getPastEvents(limit: number = 6) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("detailed_events")
      .select("*")
      .in("status", ["completed", "published"])
      .eq("is_public", true)
      .lt("end_date", new Date().toISOString())
      .order("end_date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching past events:", error);
      return [];
    }

    return transformEventsWithSignedUrls((data as DetailedEvent[]) || []);
  } catch (error) {
    console.error("Unexpected error fetching past events:", error);
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

    return (data as DetailedEventFeedback[]) || [];
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
      .select(
        "overall_rating, content_rating, organization_rating, speaker_rating, venue_rating"
      )
      .eq("event_id", eventId);

    if (error || !data || data.length === 0) {
      return null;
    }

    const count = data.length;
    const avg = (arr: (number | null)[]) => {
      const valid = arr.filter((n): n is number => n !== null);
      return valid.length > 0
        ? valid.reduce((a, b) => a + b, 0) / valid.length
        : 0;
    };

    return {
      total_feedback: count,
      average_overall: Math.round(avg(data.map((d) => d.overall_rating)) * 10) / 10,
      average_content: Math.round(avg(data.map((d) => d.content_rating)) * 10) / 10,
      average_organization:
        Math.round(avg(data.map((d) => d.organization_rating)) * 10) / 10,
      average_speaker: Math.round(avg(data.map((d) => d.speaker_rating)) * 10) / 10,
      average_venue: Math.round(avg(data.map((d) => d.venue_rating)) * 10) / 10,
      rating_distribution: {
        5: data.filter((d) => d.overall_rating === 5).length,
        4: data.filter((d) => d.overall_rating === 4).length,
        3: data.filter((d) => d.overall_rating === 3).length,
        2: data.filter((d) => d.overall_rating === 2).length,
        1: data.filter((d) => d.overall_rating === 1).length,
      },
    };
  } catch (error) {
    console.error("Error calculating feedback stats:", error);
    return null;
  }
}

// ============================================
// CERTIFICATE VERIFICATION (PUBLIC)
// ============================================

export async function verifyCertificate(verificationCode: string) {
  const supabase = await createClient();

  try {
    const { data: cert, error } = await supabase
      .from("event_certificates")
      .select(
        `
        *,
        events (title, start_date, end_date),
        profiles:user_id (full_name)
      `
      )
      .eq("verification_code", verificationCode.toUpperCase())
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { valid: false, message: "Certificate not found" };
      }
      throw error;
    }

    const eventData = cert.events as { title: string; start_date: string; end_date: string } | null;
    const profileData = cert.profiles as { full_name: string } | null;

    return {
      valid: cert.is_verified,
      certificate: {
        certificate_number: cert.certificate_number,
        participant_name: profileData?.full_name,
        event_title: eventData?.title,
        event_date: eventData?.start_date,
        issued_at: cert.issued_at,
      },
    };
  } catch (error) {
    console.error("Error verifying certificate:", error);
    return { valid: false, message: "Verification failed" };
  }
}

// ============================================
// EVENT TAGS
// ============================================

export async function getPopularEventTags(limit: number = 10) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("event_tags")
      .select("tag")
      .limit(100);

    if (error) {
      console.error("Error fetching tags:", error);
      return [];
    }

    // Count tag occurrences
    const tagCounts = (data || []).reduce((acc, item) => {
      acc[item.tag] = (acc[item.tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sort by count and return top tags
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  } catch (error) {
    console.error("Unexpected error fetching tags:", error);
    return [];
  }
}

// ============================================
// EVENT SEARCH
// ============================================

export async function searchEvents(query: string, limit: number = 10) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("detailed_events")
      .select("id, title, slug, short_description, event_type, start_date, banner_image_url")
      .eq("status", "published")
      .eq("is_public", true)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,short_description.ilike.%${query}%`)
      .order("start_date", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error searching events:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error searching events:", error);
    return [];
  }
}
