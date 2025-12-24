"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { updateEvent, type CreateEventData } from "@/lib/supabase/event-staff-actions";
import {
  EVENT_TYPES,
  EVENT_CATEGORIES,
  LOCATION_TYPES,
} from "@/lib/constants/events";

interface EventEditFormProps {
  event: any;
  daysRemaining?: number;
}

export function EventEditForm({ event, daysRemaining }: EventEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateEventData>>({
    title: event.title || "",
    description: event.description || "",
    short_description: event.short_description || "",
    event_type: event.event_type || "workshop",
    category: event.category || "technical",
    start_date: event.start_date,
    end_date: event.end_date,
    registration_deadline: event.registration_deadline,
    location_type: event.location_type || "physical",
    location: event.location || "",
    venue_name: event.venue_name || "",
    meeting_url: event.meeting_url || "",
    max_capacity: event.max_capacity || undefined,
    is_registration_required: event.is_registration_required ?? true,
    is_public: event.is_public ?? true,
    certificate_enabled: event.certificate_enabled ?? false,
    tags: event.tags || [],
  });

  // Convert string dates to Date objects for the picker
  const startDate = formData.start_date ? new Date(formData.start_date) : undefined;
  const endDate = formData.end_date ? new Date(formData.end_date) : undefined;
  const registrationDeadline = formData.registration_deadline
    ? new Date(formData.registration_deadline)
    : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const missingFields: string[] = [];

    if (!formData.title?.trim()) {
      missingFields.push("Event Title");
    }
    if (!formData.description?.trim()) {
      missingFields.push("Description");
    }
    if (!formData.start_date) {
      missingFields.push("Start Date & Time");
    }
    if (!formData.end_date) {
      missingFields.push("End Date & Time");
    }

    if (missingFields.length > 0) {
      toast.error(`Please fill in the following required fields: ${missingFields.join(", ")}`);
      return;
    }

    // Validate dates
    const startDateObj = new Date(formData.start_date!);
    const endDateObj = new Date(formData.end_date!);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      toast.error("Please provide valid dates and times");
      return;
    }

    if (endDateObj <= startDateObj) {
      toast.error("End date and time must be after start date and time");
      return;
    }

    setLoading(true);

    try {
      const result = await updateEvent(event.id, formData as CreateEventData);

      if (result.success) {
        toast.success("Event updated successfully");
        router.push(`/dashboard/staff/events/${event.id}`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update event");
      }
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {daysRemaining !== undefined && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-6">
            <p className="text-sm text-orange-900 dark:text-orange-200">
              <strong>Edit Window:</strong> You have {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining to edit this event.
              After that, editing will no longer be available.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the basic details of your event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Event Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Enter event title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Short Description</Label>
                <Input
                  id="short_description"
                  placeholder="Brief summary (shown in cards)"
                  value={formData.short_description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      short_description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Full event description"
                  rows={6}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event_type">Event Type</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        event_type: value as CreateEventData["event_type"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: value as CreateEventData["category"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle>Date & Time</CardTitle>
              <CardDescription>When will the event take place?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start_date">
                    Start Date & Time <span className="text-destructive">*</span>
                  </Label>
                  <DateTimePicker
                    date={startDate}
                    setDate={(date) =>
                      setFormData((prev) => ({
                        ...prev,
                        start_date: date?.toISOString(),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">
                    End Date & Time <span className="text-destructive">*</span>
                  </Label>
                  <DateTimePicker
                    date={endDate}
                    setDate={(date) =>
                      setFormData((prev) => ({
                        ...prev,
                        end_date: date?.toISOString(),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_deadline">Registration Deadline</Label>
                <DateTimePicker
                  date={registrationDeadline}
                  setDate={(date) =>
                    setFormData((prev) => ({
                      ...prev,
                      registration_deadline: date?.toISOString(),
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Where will the event be held?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location_type">Location Type</Label>
                <Select
                  value={formData.location_type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      location_type: value as CreateEventData["location_type"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(formData.location_type === "physical" ||
                formData.location_type === "hybrid") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="venue_name">Venue Name</Label>
                    <Input
                      id="venue_name"
                      placeholder="e.g., Main Auditorium"
                      value={formData.venue_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          venue_name: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Full Address</Label>
                    <Textarea
                      id="location"
                      placeholder="Enter full address"
                      rows={2}
                      value={formData.location}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                    />
                  </div>
                </>
              )}

              {(formData.location_type === "online" ||
                formData.location_type === "hybrid") && (
                <div className="space-y-2">
                  <Label htmlFor="meeting_url">Meeting Link</Label>
                  <Input
                    id="meeting_url"
                    type="url"
                    placeholder="https://zoom.us/..."
                    value={formData.meeting_url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        meeting_url: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max_capacity">Max Capacity</Label>
                <Input
                  id="max_capacity"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={formData.max_capacity || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      max_capacity: e.target.value ? parseInt(e.target.value) : undefined,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="is_registration_required" className="flex flex-col space-y-1">
                  <span>Registration Required</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Users must register to attend
                  </span>
                </Label>
                <Switch
                  id="is_registration_required"
                  checked={formData.is_registration_required}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_registration_required: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="is_public" className="flex flex-col space-y-1">
                  <span>Public Event</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Visible to all users
                  </span>
                </Label>
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_public: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="certificate_enabled" className="flex flex-col space-y-1">
                  <span>Enable Certificates</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Award certificates to attendees
                  </span>
                </Label>
                <Switch
                  id="certificate_enabled"
                  checked={formData.certificate_enabled}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      certificate_enabled: checked,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
