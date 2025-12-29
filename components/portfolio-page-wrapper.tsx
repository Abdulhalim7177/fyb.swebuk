"use client";

import { useRouter } from "next/navigation";
import ModernPortfolioPage from "./modern-portfolio-page";

type Profile = {
  id: string;
  full_name: string;
  avatar_url: string;
  role?: string;
  registration_number?: string;
  staff_number?: string;
  academic_level?: string;
  department?: string;
  faculty?: string;
  institution?: string;
  linkedin_url?: string;
  github_url?: string;
  skills?: string[];
  bio?: string;
  email?: string;
  created_at?: string;
  // Student-specific fields
  specialization?: string;
  gpa?: number;
  academic_standing?: string;
  current_courses?: string[];
  achievements?: string[];
  portfolio_items?: any[];
  interests?: string;
  // Staff-specific fields
  position?: string;
  office_location?: string;
  office_hours?: string;
  research_interests?: string[];
  department_role?: string;
  staff_profile?: any;
  qualifications?: string;
  website_url?: string;
};

type Project = {
  id: string;
  name: string;
  description: string;
  type: string;
  visibility: string;
  status: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  cluster_id?: string;
  repository_url?: string;
  demo_url?: string;
  project_tags?: { tag: string }[];
};

export default function PortfolioPageWrapper({
  profile,
  projects,
  editProfileUrl,
}: {
  profile: Profile;
  projects: Project[];
  editProfileUrl: string;
}) {
  const router = useRouter();

  const handleEditProfile = () => {
    router.push(editProfileUrl);
  };

  return (
    <ModernPortfolioPage
      profile={profile}
      projects={projects}
      onEditProfile={handleEditProfile}
    />
  );
}
