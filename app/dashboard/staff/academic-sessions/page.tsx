import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AcademicSessionForm from "@/components/academic-session-form";
import SessionProcessingLogs from "@/components/session-processing-logs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StaffAcademicSessionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Check if user has staff role
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData || (profileData.role !== "admin" && profileData.role !== "staff")) {
    // Redirect non-admins and non-staff (academic sessions management is for admin and staff)
    redirect("/dashboard/student");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12 items-center">
      <div className="w-full max-w-6xl mx-auto">
        <div className="py-6 font-bold text-center bg-background backdrop-blur-sm border-b border-border">
          Academic Session Management
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-8 max-w-6xl px-3 w-full">
        <main className="flex-1 flex flex-col gap-6 w-full">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl">Manage Academic Sessions</CardTitle>
              <CardDescription>
                Create, update, and manage academic sessions for the institution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AcademicSessionForm />
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl">Session Processing Logs</CardTitle>
              <CardDescription>
                History of academic session end processing events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SessionProcessingLogs />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}