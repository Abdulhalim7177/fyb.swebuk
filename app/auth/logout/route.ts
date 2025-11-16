import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  // Check if a user's session exists
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
  }

  return NextResponse.redirect(new URL("/auth/login", req.url), {
    status: 302,
  });
}
