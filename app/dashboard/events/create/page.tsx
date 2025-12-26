"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Send, Calendar, Users } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  EVENT_TYPES,
  EVENT_CATEGORIES,
  LOCATION_TYPES,
} from "@/lib/constants/events";

interface Cluster {
  id: string;
  name: string;
  description: string;
  status: string;
}

interface User {
  id: string;
  role: string;
}

async function getUser() {
  const supabase = createClient();
  const { data: { user }, error: userError } = await (supabase.auth as any).getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return { user, role: profileData?.role || "student" };
}

async function getClusters(userId: string, userRole: string) {
  const supabase = createClient();

  if (userRole === 'admin' || userRole === 'staff') {
    // Admins and staff can see all active clusters
    const { data, error } = await supabase
      .from("clusters")
      .select("id, name, description, status")
      .eq("status", "active")
      .order("name");
    return data || [];
  }

  // Regular users can see clusters they are members of or manage
  const { data, error } = await supabase
    .from("detailed_clusters")
    .select("id, name, description, status")
    .or(`lead_id.eq.${userId},deputy_id.eq.${userId},staff_manager_id.eq.${userId}`)
    .order("name");

  return data || [];
}

export default function CreateEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClusterId = searchParams.get("cluster_id");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    short_description: "",
    event_type: "workshop",
    category: "technical",
    location_type: "physical",
    venue_name: "",
    location: "",
    meeting_url: "",
    start_date: "",
    end_date: "",
    registration_deadline: "",
    max_capacity: "",
    is_registration_required: true,
    is_public: true,
    certificate_enabled: false,
    cluster_id: preselectedClusterId || "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { user, role } = await getUser();
        setUser({ id: user.id, role });
        setUserRole(role);

        // If user is staff/admin or a cluster lead/deputy, fetch clusters
        if (role === 'admin' || role === 'staff') {
          const clusterData = await getClusters(user.id, role);
          setClusters(clusterData);
        } else {
          // Check if user manages any clusters
          const clusterData = await getClusters(user.id, role);
          setClusters(clusterData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load required data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [preselectedClusterId]);

  // Convert string dates to Date objects for the picker
  const startDate = formData.start_date ? new Date(formData.start_date) : undefined;
  const endDate = formData.end_date ? new Date(formData.end_date) : undefined;
  const registrationDeadline = formData.registration_deadline
    ? new Date(formData.registration_deadline)
    : undefined;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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

    // Validate cluster selection
    if (formData.cluster_id && userRole !== 'admin' && userRole !== 'staff') {
      const selectedCluster = clusters.find(c => c.id === formData.cluster_id);
      if (!selectedCluster) {
        toast.error("You don't have permission to create events for the selected cluster");
        return;
      }
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await (supabase.auth as any).getUser();

      if (!authUser) {
        toast.error("Authentication error");
        return;
      }

      // Generate slug from title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/\s+/g, "-")
        .substring(0, 50);

      const { error } = await supabase
        .from("events")
        .insert({
          organizer_id: authUser.id,
          cluster_id: formData.cluster_id || null,
          title: formData.title,
          slug,
          description: formData.description,
          short_description: formData.short_description,
          event_type: formData.event_type,
          category: formData.category,
          start_date: startDateObj.toISOString(),
          end_date: endDateObj.toISOString(),
          registration_deadline: formData.registration_deadline ? new Date(formData.registration_deadline).toISOString() : null,
          location_type: formData.location_type,
          location: formData.location || null,
          venue_name: formData.venue_name || null,
          meeting_url: formData.meeting_url || null,
          max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
          is_registration_required: formData.is_registration_required,
          is_public: formData.is_public,
          certificate_enabled: formData.certificate_enabled,
          status: saveAsDraft ? "draft" : "published",
        });

      if (error) throw error;

      toast.success(
        saveAsDraft ? "Event saved as draft" : "Event published successfully"
      );

      // Redirect appropriately
      if (formData.cluster_id) {
        router.push(`/dashboard/clusters/${formData.cluster_id}`);
      } else if (userRole === 'staff' || userRole === 'admin') {
        router.push("/dashboard/staff/events");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  const selectedCluster = clusters.find(c => c.id === formData.cluster_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={formData.cluster_id ? `/dashboard/clusters/${formData.cluster_id}` : "/dashboard"}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Event</h1>
          <p className="text-muted-foreground">
            {selectedCluster
              ? `Create event for ${selectedCluster.name}`
              : "Create a new event"}
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
              <CardDescription>Enter the basic details of your event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Event Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter event title"
                  value={formData.title}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Short Description</Label>
                <Input
                  id="short_description"
                  name="short_description"
                  placeholder="Brief summary (shown in cards)"
                  value={formData.short_description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Full event description"
                  rows={6}
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event_type">Event Type</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) => handleSelectChange("event_type", value)}
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
                    onValueChange={(value) => handleSelectChange("category", value)}
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
                        start_date: date?.toISOString() || "",
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
                        end_date: date?.toISOString() || "",
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
                      registration_deadline: date?.toISOString() || "",
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
                  onValueChange={(value) => handleSelectChange("location_type", value)}
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
                      name="venue_name"
                      placeholder="e.g., Main Auditorium"
                      value={formData.venue_name}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Address</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="Full address"
                      value={formData.location}
                      onChange={handleInputChange}
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
                    name="meeting_url"
                    placeholder="https://zoom.us/j/..."
                    value={formData.meeting_url}
                    onChange={handleInputChange}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cluster Selection */}
          {clusters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Cluster
                </CardTitle>
                <CardDescription>
                  {formData.cluster_id
                    ? "Event will be associated with selected cluster"
                    : "Optional: Associate with a cluster"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cluster_id">Select Cluster (Optional)</Label>
                  <Select
                    value={formData.cluster_id}
                    onValueChange={(value) => handleSelectChange("cluster_id", value || "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No cluster selected" />
                    </SelectTrigger>
                    <SelectContent>
                      {clusters.map((cluster) => (
                        <SelectItem key={cluster.id} value={cluster.id}>
                          {cluster.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCluster && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{selectedCluster.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      This event will be visible to all cluster members
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                  name="max_capacity"
                  type="number"
                  min="0"
                  placeholder="Leave empty for unlimited"
                  value={formData.max_capacity}
                  onChange={handleInputChange}
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
                  onCheckedChange={(checked) => handleSelectChange("is_registration_required", checked)}
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
                  onCheckedChange={(checked) => handleSelectChange("is_public", checked)}
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
                  onCheckedChange={(checked) => handleSelectChange("certificate_enabled", checked)}
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
                disabled={submitting}
              >
                {submitting ? (
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
                disabled={submitting}
              >
                {submitting ? (
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
