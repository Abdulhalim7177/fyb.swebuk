import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";
import { isEligibleForFYP } from "./level-access-utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // (supabase.auth as any).getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getUser() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (user) {
    // Fetch role from profiles table instead of user metadata
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role, academic_level')
      .eq('id', user.id)
      .single();

    let userRole = 'student'; // default role
    let userAcademicLevel = 'student'; // default academic level
    if (profileError || !profileData) {
      console.error('Error fetching profile or profile not found:', profileError);
      // Fallback to user metadata if profile is not found
      userRole = user.user_metadata?.role?.toLowerCase() || "student";
      userAcademicLevel = user.user_metadata?.academic_level?.toLowerCase() || "student";
    } else {
      userRole = profileData.role?.toLowerCase() || 'student';
      userAcademicLevel = profileData.academic_level?.toLowerCase() || 'student';
    }

    // Check if the request is for FYP access and user is not eligible
    if (request.nextUrl.pathname.startsWith('/dashboard/student/fyp') ||
        request.nextUrl.pathname.startsWith('/dashboard/student/final-year-project')) {
      if (!isEligibleForFYP(userAcademicLevel)) {
        // Redirect to dashboard if not eligible for FYP
        const url = request.nextUrl.clone();
        url.pathname = `/dashboard/${userRole}`;
        return NextResponse.redirect(url);
      }
    }

    // Protect role-based dashboard main pages and sub-pages
    if (request.nextUrl.pathname.startsWith('/dashboard/')) {
      const pathSegments = request.nextUrl.pathname.split('/');
      const userRoleSegment = pathSegments[2]; // Get the role from /dashboard/{role}

      // Define known role segments
      const knownRoleSegments = ['student', 'admin', 'staff', 'lead', 'deputy'];

      // Check if the segment after /dashboard/ is a known role segment
      if (userRoleSegment && knownRoleSegments.includes(userRoleSegment)) {
        // Admins can access staff routes
        const isAdminAccessingStaff = userRole === 'admin' && userRoleSegment === 'staff';

        // If user is trying to access another role's dashboard section (main or sub-pages)
        // Allow admins to access staff pages
        if (userRoleSegment !== userRole && !isAdminAccessingStaff) {
          const url = request.nextUrl.clone();
          url.pathname = `/dashboard/${userRole}`;
          return NextResponse.redirect(url);
        }
      }
    }

    // Redirect authenticated users away from auth pages
    if (
      request.nextUrl.pathname.startsWith("/auth/login") ||
      request.nextUrl.pathname.startsWith("/auth/sign-up")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = `/dashboard/${userRole}`;
      return NextResponse.redirect(url);
    }
  }

  // Define public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/login",
    "/auth",
    "/blog",  // Public blog listing
    "/events",  // Public events listing
  ];

  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname === route ||
    request.nextUrl.pathname.startsWith(route + "/") ||
    request.nextUrl.pathname.startsWith("/auth")
  );

  if (!user && !isPublicRoute) {
    // no user and not a public route, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}