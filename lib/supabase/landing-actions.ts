"use server";

import { createClient } from "@/lib/supabase/server";
import type { DetailedBlog } from "@/lib/constants/blog";
import type { DetailedEvent } from "@/lib/constants/events";

// ============================================
// LANDING PAGE DATA FETCHING
// ============================================

// Fetch featured blogs
export async function getFeaturedBlogs(limit = 3) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("detailed_blogs")
      .select("*")
      .eq("status", "published")
      .eq("is_featured", true)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching featured blogs:", error);
      return [];
    }

    return (data as DetailedBlog[]) || [];
  } catch (error) {
    console.error("Unexpected error fetching featured blogs:", error);
    return [];
  }
}

// Fetch latest blogs
export async function getLatestBlogs(limit = 4) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("detailed_blogs")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching latest blogs:", error);
      return [];
    }

    return (data as DetailedBlog[]) || [];
  } catch (error) {
    console.error("Unexpected error fetching latest blogs:", error);
    return [];
  }
}

// Fetch upcoming events
export async function getUpcomingEvents(limit = 3) {
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

    const events = data as DetailedEvent[];

    // For each event, fetch the first 3 attendees
    for (const event of events) {
      const { data: attendees, error: attendeesError } = await supabase
        .from("detailed_event_registrations")
        .select("user_id, user_name, user_avatar")
        .eq("event_id", event.id)
        .in("registration_status", ["registered", "attended"])
        .limit(3);

      if (attendeesError) {
        console.error(`Error fetching attendees for event ${event.id}:`, attendeesError);
        event.attendees = [];
      } else {
        event.attendees = attendees.map(a => ({
          id: a.user_id,
          full_name: a.user_name,
          avatar_url: a.user_avatar
        }));
      }
    }

    return events;
  } catch (error) {
    console.error("Unexpected error fetching upcoming events:", error);
    return [];
  }
}

// Fetch popular clusters (those with the most members)
export async function getPopularClusters(limit = 4) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("detailed_clusters")
      .select("*")
      .eq("status", "active")
      .order("members_count", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching popular clusters:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching popular clusters:", error);
    return [];
  }
}