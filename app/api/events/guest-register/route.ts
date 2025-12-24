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
      .select("id, title, slug, start_date, end_date, status, is_registration_required, max_capacity")
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
      .select("id, email, full_name")
      .eq("email", email.toLowerCase())
      .single();

    let userId: string | null = null;

    if (existingUser) {
      // User has an account - register them directly with their account
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
            error: `You're already registered for this event! Sign in to view your registration.`,
            hasAccount: true,
            alreadyRegistered: true,
            registrationStatus: existingRegistration.status,
            eventDetails: {
              title: event.title,
              slug: event.slug,
              start_date: event.start_date,
              end_date: event.end_date,
            },
          },
          { status: 400 }
        );
      }

      // Has account but not registered - register them with their account
      // (Instead of prompting to login, we'll register them automatically)
    }

    // Check capacity for users with accounts
    if (userId && event.max_capacity) {
      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .in("status", ["registered", "attended"]);

      if (count && count >= event.max_capacity) {
        // Event is full - add to waitlist
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
          message: "Event is full. You've been added to the waitlist. We'll notify you if a spot opens up!",
          status: "waitlisted",
          hasAccount: true,
        });
      }
    }

    // Register user with account
    if (userId) {
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
        message: `Registration successful! Sign in to view and manage your registration.`,
        hasAccount: true,
        status: "registered",
      });
    }

    // At this point, user doesn't have an account - create guest registration

    // Check if this guest email has already registered for this event
    const { data: existingGuestReg } = await supabase
      .from("guest_registrations")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("email", email.toLowerCase())
      .single();

    if (existingGuestReg) {
      return NextResponse.json(
        {
          error: `This email is already registered for this event as a guest! Check your email for confirmation details.`,
          alreadyRegistered: true,
          registrationStatus: existingGuestReg.status,
          hasAccount: false,
          eventDetails: {
            title: event.title,
            slug: event.slug,
            start_date: event.start_date,
            end_date: event.end_date,
          },
        },
        { status: 400 }
      );
    }

    // Check capacity for guest registration
    if (event.max_capacity) {
      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .in("status", ["registered", "attended"]);

      const { count: guestCount } = await supabase
        .from("guest_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .in("status", ["registered", "attended"]);

      const totalRegistrations = (count || 0) + (guestCount || 0);

      if (totalRegistrations >= event.max_capacity) {
        // Event is full - add guest to waitlist
        const { error: insertError } = await supabase
          .from("guest_registrations")
          .insert({
            event_id: eventId,
            full_name: fullName,
            email: email.toLowerCase(),
            status: "waitlisted",
          });

        if (insertError) {
          throw insertError;
        }

        return NextResponse.json({
          success: true,
          message: "Event is full. You've been added to the waitlist. We'll email you if a spot opens up!",
          status: "waitlisted",
          hasAccount: false,
        });
      }
    }

    // Register as guest
    const { error: insertError } = await supabase
      .from("guest_registrations")
      .insert({
        event_id: eventId,
        full_name: fullName,
        email: email.toLowerCase(),
        status: "registered",
      });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: `Registration successful! We've sent a confirmation email to ${email}. Create an account to manage your registrations easily.`,
      hasAccount: false,
    });
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
