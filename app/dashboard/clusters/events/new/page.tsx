"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Calendar,
  Users,
  Clock,
  Plus,
  Loader2,
  Save,
  ArrowLeft,
  X,
} from "lucide-react";
import { EVENT_TYPES, EVENT_CATEGORIES, LOCATION_TYPES } from "@/lib/constants/events";

interface CreateEventData {
  title: string;
  description: string;
  short_description: string;
  event_type: string;
  category: string;
  start_date: string;
  end_date: string;
  registration_deadline: string | null;
  location_type: string;
  location: string | null;
  venue_name: string | null;
  meeting_url: string | null;
  max_capacity: number | null;
  is_registration_required: boolean;
  is_public: boolean;
  certificate_enabled: boolean;
  cluster_id: string | null;
}

async function getClusterInfo(clusterId: string) {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  const { data, error } = await supabase
    .from("detailed_clusters")
    .select("id, name, description, status, lead_id, lead_name, deputy_id, deputy_name, staff_manager_id, staff_manager_name")
    .eq("id", clusterId)
    .single();

  if (error || !data) {
    console.error("Error fetching cluster:", error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    status: data.status,
    lead_id: data.lead_id,
    lead_name: data.lead_name,
    deputy_id: data.deputy_id,
    deputy_name: data.deputy_name,
    staff_manager_id: data.staff_manager_id,
    staff_manager_name: data.staff_manager_name,
  };
}

export default function CreateClusterEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clusterId = searchParams.get("cluster_id") || "";
  const [cluster, setCluster] = useState<{
    id: string;
    name: string;
    description: string;
    status: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Form data
  const [formData, setFormData] = useState<CreateEventData>({
    title: "",
    description: "",
    short_description: "",
    event_type: "workshop",
    category: "technical",
    start_date: "",
    end_date: "",
    registration_deadline: "",
    location_type: "physical",
    location: "",
    venue_name: "",
    meeting_url: "",
    max_capacity: null,
    is_registration_required: true,
    is_public: true,
    certificate_enabled: false,
    cluster_id: "",
  });

  // Load cluster info when cluster_id is provided
  useEffect(() => {
    if (clusterId) {
      getClusterInfo(clusterId).then(setCluster).catch(console.error);
    }
  }, [clusterId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as keyof CreateEventData]: value }));
  };

  const handleSelectChange = (field: keyof CreateEventData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSwitchChange = (field: keyof CreateEventData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missingFields: string[] = [];
    if (!formData.title?.trim()) missingFields.push("Event Title");
    if (!formData.description?.trim()) missingFields.push("Description");
    if (!formData.start_date) missingFields.push("Start Date & Time");
    if (!formData.end_date) missingFields.push("End Date & Time");

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
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user }, error: userError } = await (supabase.auth as any).getUser();

      if (userError || !user) {
        toast.error("Authentication error: Could not get user information");
        setLoading(false);
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
          organizer_id: user.id,
          title: formData.title,
          slug: slug,
          description: formData.description,
          short_description: formData.short_description,
          event_type: formData.event_type,
          category: formData.category,
          start_date: startDateObj.toISOString(),
          end_date: endDateObj.toISOString(),
          registration_deadline: formData.registration_deadline || null,
          location_type: formData.location_type,
          location: formData.location || null,
          venue_name: formData.venue_name || null,
          meeting_url: formData.meeting_url || null,
          max_capacity: formData.max_capacity || null,
          is_registration_required: formData.is_registration_required,
          is_public: formData.is_public,
          certificate_enabled: formData.certificate_enabled,
          cluster_id: clusterId || null,
          status: "published",
        });

      if (error) throw error;

      toast.success("Event published successfully!");
      router.push(`/dashboard/clusters/${clusterId}`);
    } catch (error: any) {
      console.error("Error publishing event:", error);
      toast.error("Failed to publish event: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-emerald-500"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-blue-500/20 border border-white/10 backdrop-blur-xl p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => clusterId && router.push(`/dashboard/clusters/${clusterId}`)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-100 bg-clip-text text-transparent">Create New Event</h1>
              <p className="text-slate-300 mt-1">
                {cluster ? `for ${cluster.name}` : "for your cluster"}
              </p>
            </div>
          </div>
          <button
            disabled={loading}
            formAction="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            Publish Event
          </button>
        </div>
      </div>

      {/* Cluster Info Card - shown when cluster_id is provided */}
      {cluster && (
        <div className="rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{cluster.name}</h3>
                <p className="text-slate-300 text-sm">Creating event for this cluster</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${cluster.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
              {cluster.status === "active" ? "Active" : cluster.status}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-4">
            You are creating an event that will be associated with <strong className="text-white">{cluster.name}</strong>.
            The event will be visible to all cluster members once published.
          </p>
        </div>
      )}

      {/* Event Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>
            Fill in the information about the event you want to create
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Event Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Introduction to Web Development Workshop"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe what the event is about..."
                    rows={4}
                    required
                  />
                </div>

                {/* Short Description */}
                <div className="space-y-2">
                  <Label htmlFor="short_description">
                    Short Description
                  </Label>
                  <Input
                    id="short_description"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    placeholder="Brief summary displayed in listings (optional)"
                  />
                </div>

                {/* Event Type */}
                <div className="space-y-2">
                  <Label htmlFor="event_type">
                    Event Type <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.event_type} onValueChange={(value) => handleSelectChange('event_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
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

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
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

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">
                      Start Date <span className="text-destructive">*</span>
                    </Label>
                    <input
                      id="start_date"
                      name="start_date"
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">
                      End Date <span className="text-destructive">*</span>
                    </Label>
                    <input
                      id="end_date"
                      name="end_date"
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Registration Deadline */}
                <div className="space-y-2">
                  <Label htmlFor="registration_deadline">
                    Registration Deadline
                  </Label>
                  <Input
                    id="registration_deadline"
                    name="registration_deadline"
                    type="datetime-local"
                    value={formData.registration_deadline}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Location Type */}
                <div className="space-y-2">
                  <Label htmlFor="location_type">
                    Location Type <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.location_type} onValueChange={(value) => handleSelectChange('location_type', value)}>
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

                {/* Location */}
                {formData.location_type === "physical" && (
                  <div className="space-y-2">
                    <Label htmlFor="location">
                      Location
                    </Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Enter venue address or room name"
                    />
                  </div>
                )}

                {formData.location_type === "online" && (
                  <div className="space-y-2">
                    <Label htmlFor="meeting_url">
                      Meeting URL
                    </Label>
                    <Input
                      id="meeting_url"
                      name="meeting_url"
                      value={formData.meeting_url}
                      onChange={handleInputChange}
                      placeholder="https://zoom.us/..."
                    />
                  </div>
                )}

                {formData.location_type === "hybrid" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">
                        Location
                      </Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Physical location"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meeting_url">
                        Meeting URL
                      </Label>
                      <Input
                        id="meeting_url"
                        name="meeting_url"
                        value={formData.meeting_url}
                        onChange={handleInputChange}
                        placeholder="Online meeting link"
                      />
                    </div>
                  </div>
                )}

                {/* Venue Name - for physical/hybrid */}
                {(formData.location_type === "physical" || formData.location_type === "hybrid") && (
                  <div className="space-y-2">
                    <Label htmlFor="venue_name">
                      Venue Name
                    </Label>
                    <Input
                      id="venue_name"
                      name="venue_name"
                      value={formData.venue_name}
                      onChange={handleInputChange}
                      placeholder="e.g., Building A, Room 101"
                    />
                  </div>
                )}

                {/* Capacity */}
                <div className="space-y-2">
                  <Label htmlFor="max_capacity">
                    Max Capacity
                  </Label>
                  <Input
                    id="max_capacity"
                    name="max_capacity"
                    type="number"
                    min="1"
                    value={formData.max_capacity}
                    onChange={handleInputChange}
                    placeholder="Leave empty for unlimited"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex flex-wrap gap-4 items-end md:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({
                  title: "",
                  description: "",
                  short_description: "",
                  event_type: "workshop",
                  category: "technical",
                  start_date: "",
                  end_date: "",
                  registration_deadline: "",
                  location_type: "physical",
                  location: "",
                  venue_name: "",
                  meeting_url: "",
                  max_capacity: null,
                  is_registration_required: true,
                  is_public: true,
                  certificate_enabled: false,
                  cluster_id: "",
                })}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Publish Event
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
