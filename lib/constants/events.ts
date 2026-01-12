// ==============================================
// EVENT TYPES
// ==============================================

export const EVENT_TYPES = [
  { value: "workshop", label: "Workshop", icon: "Wrench", color: "blue" },
  { value: "seminar", label: "Seminar", icon: "Presentation", color: "purple" },
  { value: "hackathon", label: "Hackathon", icon: "Code", color: "orange" },
  { value: "meetup", label: "Meetup", icon: "Users", color: "green" },
  { value: "conference", label: "Conference", icon: "Building", color: "indigo" },
  { value: "training", label: "Training", icon: "GraduationCap", color: "cyan" },
  { value: "webinar", label: "Webinar", icon: "Video", color: "pink" },
  { value: "competition", label: "Competition", icon: "Trophy", color: "amber" },
  { value: "other", label: "Other", icon: "Calendar", color: "gray" },
] as const;

export type EventType = (typeof EVENT_TYPES)[number]["value"];

// ==============================================
// EVENT CATEGORIES
// ==============================================

export const EVENT_CATEGORIES = [
  { value: "technical", label: "Technical", color: "blue" },
  { value: "career", label: "Career", color: "green" },
  { value: "networking", label: "Networking", color: "purple" },
  { value: "social", label: "Social", color: "pink" },
  { value: "academic", label: "Academic", color: "indigo" },
  { value: "community", label: "Community", color: "teal" },
  { value: "other", label: "Other", color: "gray" },
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number]["value"];

// ==============================================
// EVENT STATUSES
// ==============================================

export const EVENT_STATUSES = [
  { value: "draft", label: "Draft", color: "gray", description: "Not yet published" },
  { value: "published", label: "Published", color: "green", description: "Live and accepting registrations" },
  { value: "cancelled", label: "Cancelled", color: "red", description: "Event was cancelled" },
  { value: "completed", label: "Completed", color: "blue", description: "Event has ended" },
  { value: "archived", label: "Archived", color: "gray", description: "No longer active" },
] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number]["value"];

// ==============================================
// LOCATION TYPES
// ==============================================

export const LOCATION_TYPES = [
  { value: "physical", label: "In-Person", icon: "MapPin", description: "Physical venue" },
  { value: "online", label: "Online", icon: "Globe", description: "Virtual event" },
  { value: "hybrid", label: "Hybrid", icon: "Laptop", description: "Both in-person and online" },
] as const;

export type LocationType = (typeof LOCATION_TYPES)[number]["value"];

// ==============================================
// REGISTRATION STATUSES
// ==============================================

export const REGISTRATION_STATUSES = [
  { value: "registered", label: "Registered", color: "green" },
  { value: "waitlisted", label: "Waitlisted", color: "yellow" },
  { value: "cancelled", label: "Cancelled", color: "gray" },
  { value: "attended", label: "Attended", color: "blue" },
  { value: "no_show", label: "No Show", color: "red" },
] as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number]["value"];

// ==============================================
// CHECK-IN METHODS
// ==============================================

export const CHECK_IN_METHODS = [
  { value: "qr_code", label: "QR Code", icon: "QrCode" },
  { value: "manual", label: "Manual", icon: "ClipboardCheck" },
  { value: "self", label: "Self Check-in", icon: "User" },
] as const;

export type CheckInMethod = (typeof CHECK_IN_METHODS)[number]["value"];

// ==============================================
// CERTIFICATE TYPES
// ==============================================

export const CERTIFICATE_TYPES = [
  { value: "participation", label: "Participation", description: "For attending the event" },
  { value: "completion", label: "Completion", description: "For completing requirements" },
  { value: "achievement", label: "Achievement", description: "For special achievements" },
  { value: "appreciation", label: "Appreciation", description: "For volunteers/organizers" },
  { value: "custom", label: "Custom", description: "Custom certificate type" },
] as const;

export type CertificateType = (typeof CERTIFICATE_TYPES)[number]["value"];

// ==============================================
// VERIFICATION METHODS
// ==============================================

export const VERIFICATION_METHODS = [
  { value: "qr_scan", label: "QR Scan" },
  { value: "manual", label: "Manual Entry" },
  { value: "biometric", label: "Biometric" },
] as const;

export type VerificationMethod = (typeof VERIFICATION_METHODS)[number]["value"];

// ==============================================
// RATING LABELS
// ==============================================

export const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
} as const;

// ==============================================
// TYPE INTERFACES
// ==============================================

export interface Event {
  id: string;
  organizer_id: string;
  cluster_id: string | null;
  title: string;
  slug: string;
  description: string;
  short_description: string | null;
  event_type: EventType;
  category: EventCategory | null;
  start_date: string;
  end_date: string;
  registration_deadline: string | null;
  location_type: LocationType;
  location: string | null;
  venue_name: string | null;
  meeting_url: string | null;
  max_capacity: number | null;
  is_registration_required: boolean;
  is_public: boolean;
  banner_image_url: string | null;
  status: EventStatus;
  certificate_enabled: boolean;
  certificate_template_id: string | null;
  minimum_attendance_for_certificate: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface DetailedEvent extends Event {
  organizer_name: string | null;
  organizer_avatar: string | null;
  organizer_email: string | null;
  cluster_name: string | null;
  registrations_count: number;
  attendees_count: number;
  waitlist_count: number;
  average_rating: number;
  feedback_count: number;
  tags: string[] | null;
  available_spots: number | null;
  is_full: boolean;
  attendees?: Array<{ id: string; avatar_url: string | null; full_name: string | null }>;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: RegistrationStatus;
  registered_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  checked_in_at: string | null;
  checked_in_by: string | null;
  check_in_method: CheckInMethod | null;
  notes: string | null;
}

export interface UserEventRegistration {
  registration_id: string;
  event_id: string;
  user_id: string;
  registration_status: RegistrationStatus;
  registered_at: string;
  cancelled_at: string | null;
  checked_in_at: string | null;
  check_in_method: CheckInMethod | null;
  notes: string | null;
  event_title: string;
  event_slug: string;
  short_description: string | null;
  event_type: EventType;
  start_date: string;
  end_date: string;
  location_type: LocationType;
  location: string | null;
  venue_name: string | null;
  event_status: EventStatus;
  banner_image_url: string | null;
  certificate_enabled: boolean;
  organizer_id: string;
  organizer_name: string | null;
  has_certificate: boolean;
  has_feedback: boolean;
}

export interface DetailedEventRegistration extends EventRegistration {
  user_name: string | null;
  user_email: string | null;
  user_avatar: string | null;
  academic_level: number | null;
  department: string | null;
  checked_in_by_name: string | null;
}

export interface EventAttendance {
  id: string;
  event_id: string;
  user_id: string;
  registration_id: string | null;
  session_name: string | null;
  session_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  duration_minutes: number | null;
  verified_by: string | null;
  verification_method: VerificationMethod | null;
  created_at: string;
}

export interface EventFeedback {
  id: string;
  event_id: string;
  user_id: string;
  registration_id: string | null;
  overall_rating: number;
  content_rating: number | null;
  organization_rating: number | null;
  speaker_rating: number | null;
  venue_rating: number | null;
  feedback_text: string | null;
  highlights: string | null;
  improvements: string | null;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface DetailedEventFeedback extends EventFeedback {
  user_name: string | null;
  user_avatar: string | null;
}

export interface EventCertificate {
  id: string;
  event_id: string;
  user_id: string;
  registration_id: string | null;
  certificate_number: string;
  certificate_url: string | null;
  verification_code: string;
  is_verified: boolean;
  issued_at: string;
  issued_by: string | null;
  download_count: number;
  last_downloaded_at: string | null;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string | null;
  template_type: CertificateType;
  background_image_url: string | null;
  template_html: string | null;
  css_styles: string | null;
  is_active: boolean;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventTag {
  id: string;
  event_id: string;
  tag: string;
  created_at: string;
}

// ==============================================
// HELPER FUNCTIONS
// ==============================================

export function getEventTypeLabel(type: EventType): string {
  const found = EVENT_TYPES.find((t) => t.value === type);
  return found?.label || type;
}

export function getEventTypeColorClass(type: EventType): string {
  const colorMap: Record<EventType, string> = {
    workshop: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    seminar: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    hackathon: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    meetup: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    conference: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    training: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
    webinar: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    competition: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  };
  return colorMap[type] || colorMap.other;
}

export function getEventCategoryLabel(category: EventCategory): string {
  const found = EVENT_CATEGORIES.find((c) => c.value === category);
  return found?.label || category;
}

export function getEventCategoryColorClass(category: EventCategory): string {
  const colorMap: Record<EventCategory, string> = {
    technical: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    career: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    networking: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    social: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    academic: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    community: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
    other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  };
  return colorMap[category] || colorMap.other;
}

export function getEventStatusLabel(status: EventStatus): string {
  const found = EVENT_STATUSES.find((s) => s.value === status);
  return found?.label || status;
}

export function getEventStatusColorClass(status: EventStatus): string {
  const colorMap: Record<EventStatus, string> = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  };
  return colorMap[status] || colorMap.draft;
}

export function getRegistrationStatusLabel(status: RegistrationStatus): string {
  const found = REGISTRATION_STATUSES.find((s) => s.value === status);
  return found?.label || status;
}

export function getRegistrationStatusColorClass(status: RegistrationStatus): string {
  const colorMap: Record<RegistrationStatus, string> = {
    registered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    waitlisted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    attended: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    no_show: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };
  return colorMap[status] || colorMap.registered;
}

export function getLocationTypeLabel(type: LocationType): string {
  const found = LOCATION_TYPES.find((t) => t.value === type);
  return found?.label || type;
}

export function generateEventSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .substring(0, 80);
}

export function formatEventDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startDateStr = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const startTimeStr = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const endTimeStr = end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (start.toDateString() === end.toDateString()) {
    return `${startDateStr}, ${startTimeStr} - ${endTimeStr}`;
  }

  const endDateStr = end.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startDateStr}, ${startTimeStr} - ${endDateStr}, ${endTimeStr}`;
}

export function getEventTimeStatus(startDate: string, endDate: string): {
  status: "upcoming" | "ongoing" | "ended";
  label: string;
} {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) {
    const diffMs = start.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays > 0) {
      return {
        status: "upcoming",
        label: `Starts in ${diffDays} day${diffDays > 1 ? "s" : ""}`,
      };
    } else if (diffHours > 0) {
      return {
        status: "upcoming",
        label: `Starts in ${diffHours} hour${diffHours > 1 ? "s" : ""}`,
      };
    } else {
      return { status: "upcoming", label: "Starting soon" };
    }
  } else if (now >= start && now <= end) {
    return { status: "ongoing", label: "Happening now" };
  } else {
    return { status: "ended", label: "Event ended" };
  }
}

export function isRegistrationOpen(event: {
  status: EventStatus;
  registration_deadline: string | null;
  start_date: string;
  is_registration_required: boolean;
}): boolean {
  if (event.status !== "published") return false;
  if (!event.is_registration_required) return true;

  const now = new Date();

  if (event.registration_deadline) {
    return new Date(event.registration_deadline) > now;
  }

  return new Date(event.start_date) > now;
}

export function getRatingLabel(rating: number): string {
  return RATING_LABELS[rating as keyof typeof RATING_LABELS] || "Unknown";
}

export function calculateAverageRating(ratings: {
  overall_rating: number;
  content_rating: number | null;
  organization_rating: number | null;
  speaker_rating: number | null;
  venue_rating: number | null;
}): number {
  const validRatings = [
    ratings.overall_rating,
    ratings.content_rating,
    ratings.organization_rating,
    ratings.speaker_rating,
    ratings.venue_rating,
  ].filter((r): r is number => r !== null);

  if (validRatings.length === 0) return 0;

  return validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr${hours > 1 ? "s" : ""}`;
  }

  return `${hours} hr${hours > 1 ? "s" : ""} ${remainingMinutes} min`;
}

export function getEventDurationHours(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
}
