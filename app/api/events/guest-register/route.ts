import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, fullName, email } = body;

    // Validate input
    if (!eventId || !fullName || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if event exists and is published
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, status, is_registration_required, max_capacity")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    if (event.status !== "published") {
      return NextResponse.json(
        { error: "Event is not open for registration" },
        { status: 400 }
      );
    }

    // Check if there's an existing user with this email
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .single();

    let userId: string | null = null;

    if (existingUser) {
      // User has an account - use their user ID
      userId = existingUser.id;

      // Check if already registered with this account
      const { data: existingRegistration } = await supabase
        .from("event_registrations")
        .select("id, status")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .single();

      if (existingRegistration) {
        return NextResponse.json(
          {
            error: "This email is already registered for this event",
            status: existingRegistration.status,
          },
          { status: 400 }
        );
      }
    } else {
      // No account - check if this email has already been used for guest registration
      // We check the event_registrations table for any registration with users who have this email
      const { data: emailCheck } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.toLowerCase())
        .single();

      if (emailCheck) {
        // Email exists in profiles, check registrations
        const { data: existingReg } = await supabase
          .from("event_registrations")
          .select("id, status")
          .eq("event_id", eventId)
          .eq("user_id", emailCheck.id)
          .single();

        if (existingReg) {
          return NextResponse.json(
            {
              error: "This email is already registered for this event. Please sign in to manage your registration.",
              status: existingReg.status,
            },
            { status: 400 }
          );
        }
      }
    }

    // Check capacity
    if (event.max_capacity) {
      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .in("status", ["registered", "attended"]);

      if (count && count >= event.max_capacity) {
        // Event is full - add to waitlist
        if (userId) {
          const { error: insertError } = await supabase
            .from("event_registrations")
            .insert({
              event_id: eventId,
              user_id: userId,
              status: "waitlisted",
            });

          if (insertError) {
            throw insertError;
          }

          return NextResponse.json({
            success: true,
            message: "Added to waitlist. We'll notify you if a spot opens up.",
            status: "waitlisted",
          });
        } else {
          return NextResponse.json(
            { error: "Event is full. Please create an account to join the waitlist." },
            { status: 400 }
          );
        }
      }
    }

    // Register the user
    if (userId) {
      // User has an account - register with their user ID
      const { error: insertError } = await supabase
        .from("event_registrations")
        .insert({
          event_id: eventId,
          user_id: userId,
          status: "registered",
        });

      if (insertError) {
        throw insertError;
      }

      return NextResponse.json({
        success: true,
        message:
          "Registration successful! Since you have an account, you can view your registration in your dashboard.",
        hasAccount: true,
      });
    } else {
      // No account - store as guest registration
      // For now, we'll create a temporary record or store in a separate table
      // You might want to create a guest_registrations table for this

      return NextResponse.json({
        success: true,
        message:
          "Registration received! We've sent a confirmation to your email. Create an account to manage your registration.",
        hasAccount: false,
        note: "Guest registration functionality requires additional setup",
      });
    }
  } catch (error: unknown) {
    console.error("Error in guest registration:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to register for event",
      },
      { status: 500 }
    );
  }
}
