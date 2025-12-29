"use client";

import { useRouter } from "next/navigation";
import ModernProfileDisplay from "./modern-profile-display";

type Profile = {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  role?: string;
  registration_number?: string | null;
  staff_number?: string | null;
  academic_level?: string | null;
  department?: string | null;
  faculty?: string | null;
  institution?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  skills?: string[] | null;
  bio?: string | null;
  email?: string;
  created_at?: string;
  website_url?: string | null;
  // Student-specific fields
  specialization?: string | null;
  gpa?: number | null;
  academic_standing?: string | null;
  current_courses?: string[] | null;
  achievements?: string[] | null;
  portfolio_items?: any[] | null;
  interests?: string | null;
  // Staff-specific fields
  position?: string | null;
  office_location?: string | null;
  office_hours?: string | null;
  research_interests?: string[] | null;
  department_role?: string | null;
  qualifications?: string | null;
  staff_profile?: any | null;
};

export default function ProfileDisplayWrapper({
  profile,
  editProfileUrl,
}: {
  profile: Profile;
  editProfileUrl: string;
}) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(editProfileUrl);
  };

  return (
    <ModernProfileDisplay
      profile={profile}
      onEdit={handleEdit}
    />
  );
}
