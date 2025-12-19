"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Send } from "lucide-react";
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
import { createEvent, type CreateEventData } from "@/lib/supabase/event-staff-actions";
import {
  EVENT_TYPES,
  EVENT_CATEGORIES,
  LOCATION_TYPES,
} from "@/lib/constants/events";

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateEventData>>({
    title: "",
    description: "",
    short_description: "",
    event_type: "workshop",
    category: "technical",
    location_type: "physical",
    is_registration_required: true,
    is_public: true,
    certificate_enabled: false,
  });

  // Convert string dates to Date objects for the picker
  const startDate = formData.start_date ? new Date(formData.start_date) : undefined;
  const endDate = formData.end_date ? new Date(formData.end_date) : undefined;
  const registrationDeadline = formData.registration_deadline
    ? new Date(formData.registration_deadline)
    : undefined;

  const handleSubmit = async (saveAsDraft: boolean) => {
    // Specific validation messages
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
      const result = await createEvent({
        ...formData,
        saveAsDraft,
      } as CreateEventData);

      if (result.success) {
        toast.success(
          saveAsDraft ? "Event saved as draft" : "Event published successfully"
        );
        router.push("/dashboard/staff/events");
      } else {
        toast.error(result.error || "Failed to create event");
      }
    } catch (error) {
      console.error("Error submitting event:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/staff/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Event</h1>
          <p className="text-muted-foreground">
            Create a new event for the community
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details of your event
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
                  <Label>
                    Start Date & Time <span className="text-destructive">*</span>
                  </Label>
                  <DateTimePicker
                    date={startDate}
                    setDate={(date) => {
                      setFormData((prev) => ({
                        ...prev,
                        start_date: date?.toISOString(),
                      }));
                    }}
                    placeholder="Select start date & time"
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    End Date & Time <span className="text-destructive">*</span>
                  </Label>
                  <DateTimePicker
                    date={endDate}
                    setDate={(date) => {
                      setFormData((prev) => ({
                        ...prev,
                        end_date: date?.toISOString(),
                      }));
                    }}
                    placeholder="Select end date & time"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Registration Deadline</Label>
                <DateTimePicker
                  date={registrationDeadline}
                  setDate={(date) => {
                    setFormData((prev) => ({
                      ...prev,
                      registration_deadline: date?.toISOString(),
                    }));
                  }}
                  placeholder="Select registration deadline (optional)"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to allow registration until event starts
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Where will the event take place?</CardDescription>
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
                    {LOCATION_TYPES.map((loc) => (
                      <SelectItem key={loc.value} value={loc.value}>
                        {loc.label} - {loc.description}
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
                      value={formData.venue_name || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          venue_name: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Address</Label>
                    <Input
                      id="location"
                      placeholder="Full address"
                      value={formData.location || ""}
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
                  <Label htmlFor="meeting_url">Meeting URL</Label>
                  <Input
                    id="meeting_url"
                    placeholder="https://zoom.us/j/..."
                    value={formData.meeting_url || ""}
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="max_capacity">Maximum Capacity</Label>
                <Input
                  id="max_capacity"
                  type="number"
                  min="0"
                  placeholder="Leave empty for unlimited"
                  value={formData.max_capacity || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      max_capacity: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Registration Required</Label>
                  <p className="text-xs text-muted-foreground">
                    Users must register to attend
                  </p>
                </div>
                <Switch
                  checked={formData.is_registration_required}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_registration_required: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Event</Label>
                  <p className="text-xs text-muted-foreground">
                    Visible to everyone
                  </p>
                </div>
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_public: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Issue Certificates</Label>
                  <p className="text-xs text-muted-foreground">
                    Attendees receive certificates
                  </p>
                </div>
                <Switch
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

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() => handleSubmit(false)}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Publish Event
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSubmit(true)}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save as Draft
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
