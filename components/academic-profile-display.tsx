import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

type Profile = {
  id: string;
  full_name: string;
  avatar_url?: string;
  academic_level?: string;
  department?: string;
  faculty?: string;
  institution?: string;
  linkedin_url?: string;
  github_url?: string;
};

export default async function AcademicProfileDisplay() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Fetch role from profiles table instead of user metadata
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    console.error('Error fetching profile or profile not found:', profileError);
    return <div>User profile not found.</div>;
  }

  // Format academic level for display
  const formatAcademicLevel = (level: string | undefined) => {
    if (!level) return "Student";
    switch(level) {
      case 'level_100': return 'Level 100';
      case 'level_200': return 'Level 200';
      case 'level_300': return 'Level 300';
      case 'level_400': return 'Level 400';
      case 'alumni': return 'Alumni';
      default: return level.charAt(0).toUpperCase() + level.slice(1);
    }
  };

  // Get the actual profile data
  const profile = profileData as Profile;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Academic Profile</CardTitle>
        <CardDescription>
          Your academic information and social links
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {formatAcademicLevel(profile.academic_level)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-muted-foreground">Department</h3>
              <p className="text-lg">{profile.department || "Not specified"}</p>
            </div>
            <div>
              <h3 className="font-medium text-muted-foreground">Faculty</h3>
              <p className="text-lg">{profile.faculty || "Not specified"}</p>
            </div>
            <div>
              <h3 className="font-medium text-muted-foreground">Institution</h3>
              <p className="text-lg">{profile.institution || "Not specified"}</p>
            </div>
            <div>
              <h3 className="font-medium text-muted-foreground">Full Name</h3>
              <p className="text-lg">{profile.full_name || "Not specified"}</p>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-muted-foreground">LinkedIn:</span>
              {profile.linkedin_url ? (
                <Link
                  href={profile.linkedin_url}
                  target="_blank"
                  className="flex items-center text-blue-600 hover:underline"
                >
                  {profile.linkedin_url.replace('https://', '')}
                  <ExternalLink className="ml-1 h-4 w-4" />
                </Link>
              ) : (
                <span className="text-muted-foreground">Not provided</span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-medium text-muted-foreground">GitHub:</span>
              {profile.github_url ? (
                <Link
                  href={profile.github_url}
                  target="_blank"
                  className="flex items-center text-blue-600 hover:underline"
                >
                  {profile.github_url.replace('https://', '')}
                  <ExternalLink className="ml-1 h-4 w-4" />
                </Link>
              ) : (
                <span className="text-muted-foreground">Not provided</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}