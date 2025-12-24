import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { getEventForEdit, canEditEvent } from "@/lib/supabase/event-staff-actions";
import { EventEditForm } from "@/components/events/event-edit-form";
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

  // Check if event can be edited
  const editCheck = await canEditEvent(id);

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

      {/* Edit Restrictions Alert */}
      {!editCheck.canEdit && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cannot Edit Event</AlertTitle>
          <AlertDescription>
            {editCheck.reason}
            {editCheck.daysSinceCreation !== undefined && (
              <span className="block mt-2">
                This event was created {editCheck.daysSinceCreation} days ago. Events can only be edited within 3 days of creation.
              </span>
            )}
            {editCheck.registrationCount !== undefined && (
              <span className="block mt-2">
                This event has {editCheck.registrationCount} registration{editCheck.registrationCount !== 1 ? "s" : ""}. Events with existing registrations cannot be edited.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Show information cards if cannot edit */}
      {!editCheck.canEdit && (
        <div className="grid gap-4 md:grid-cols-2">
          {editCheck.daysSinceCreation !== undefined && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Days Since Creation</p>
                    <p className="text-2xl font-bold">{editCheck.daysSinceCreation}</p>
                    <p className="text-xs text-muted-foreground">Maximum: 3 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {editCheck.registrationCount !== undefined && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Registrations</p>
                    <p className="text-2xl font-bold">{editCheck.registrationCount}</p>
                    <p className="text-xs text-muted-foreground">Must be 0 to edit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit Form - only show if can edit */}
      {editCheck.canEdit && (
        <EventEditForm
          event={event}
          daysRemaining={editCheck.daysRemaining}
        />
      )}

      {/* Actions if cannot edit */}
      {!editCheck.canEdit && (
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/staff/events/${id}`}>
              View Event Details
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/staff/events">
              Back to Events
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
