import { processAcademicSessionEnd } from "@/lib/actions/academic-session-actions";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  // For this API route, we'll call the server action which handles authentication
  // This is because server actions run on the server and have access to auth context
  try {
    const result = await processAcademicSessionEnd();
    return Response.json(result, {
      status: result.success ? 200 : 400
    });
  } catch (error) {
    console.error("API route error:", error);
    return Response.json({
      success: false,
      message: "An error occurred while processing the academic session end"
    }, {
      status: 500
    });
  }
}