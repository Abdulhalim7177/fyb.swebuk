import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEventForEdit } from "@/lib/supabase/event-staff-actions";
import { createClient } from "@/lib/supabase/server";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Check authorization
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "staff" && profile.role !== "admin")) {
    redirect("/dashboard");
  }

  const event = await getEventForEdit(id);

  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/staff/events/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Event</h1>
          <p className="text-muted-foreground">{event.title}</p>
        </div>
      </div>

      {/* TODO: Add edit form similar to create event page */}
      <div className="border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">
          Edit form coming soon. For now, please use the create event form as reference.
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/dashboard/staff/events/new">
            View Create Form
          </Link>
        </Button>
      </div>
    </div>
  );
}
