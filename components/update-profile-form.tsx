"use client";

import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Profile = {
  id: string;
  full_name: string;
  avatar_url: string;
  academic_level?: string;
  department?: string;
  faculty?: string;
  institution?: string;
  linkedin_url?: string;
  github_url?: string;
};

export default function UpdateProfileForm({
  user,
  profile,
}: {
  user: any;
  profile: Profile;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [academicLevel, setAcademicLevel] = useState(profile.academic_level || "student");
  const [department, setDepartment] = useState(profile.department || "Software Engineering");
  const [faculty, setFaculty] = useState(profile.faculty || "Faculty of Computing");
  const [institution, setInstitution] = useState(profile.institution || "Bayero University");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url || "");
  const [githubUrl, setGithubUrl] = useState(profile.github_url || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    // If the profile already includes a full URL (generated server-side), use it directly
    if (profile.avatar_url && profile.avatar_url.startsWith('http')) {
      setAvatarUrl(profile.avatar_url);
    }
    // Otherwise, if it's just a file path, generate the signed URL client-side
    else if (profile.avatar_url) {
      // For local development, we first try to get a signed URL,
      // but handle potential errors more gracefully for local Supabase instance
      // Also implement a retry mechanism in case of failure
      const fetchAvatarUrl = async () => {
        try {
          const { data, error } = await supabase.storage
            .from("avatars")
            .createSignedUrl(profile.avatar_url, 3600); // 1 hour expiry

          if (error) {
            console.error("Error getting signed avatar URL:", error);
            // Fallback to getPublicUrl if createSignedUrl fails
            // For local development, sometimes we need to construct the URL manually
            try {
              const { data: publicData } = await supabase.storage
                .from("avatars")
                .getPublicUrl(profile.avatar_url);

              if (publicData?.publicUrl) {
                // Normalize hostname to ensure consistency with what works in other components
                const normalizedPublicUrl = publicData.publicUrl.replace('localhost', '127.0.0.1');
                setAvatarUrl(normalizedPublicUrl);
              } else {
                // Fallback for local development - manually construct URL if needed
                console.warn("Could not generate public URL, image may not display properly in local development");
                setAvatarUrl(null);
              }
            } catch (publicUrlError: any) {
              console.error("Error getting public avatar URL:", publicUrlError);
              setAvatarUrl(null); // Set to null if both methods fail
            }
          } else if (data?.signedUrl) {
            // Normalize hostname to ensure consistency with what works in other components
            const normalizedSignedUrl = data.signedUrl.replace('localhost', '127.0.0.1');
            setAvatarUrl(normalizedSignedUrl);
          } else {
            // Fallback to getPublicUrl if signed URL doesn't exist
            try {
              const { data: publicData } = await supabase.storage
                .from("avatars")
                .getPublicUrl(profile.avatar_url);
              // Normalize hostname to ensure consistency
              const normalizedPublicUrl = publicData?.publicUrl?.replace('localhost', '127.0.0.1') || null;
              setAvatarUrl(normalizedPublicUrl);
            } catch (publicUrlError: any) {
              console.error("Error getting public avatar URL:", publicUrlError);
              setAvatarUrl(null);
            }
          }
        } catch (err: any) {
          console.error("Unexpected error getting avatar URL:", err);
          // Check if it's a timeout or network error and handle appropriately
          if (err?.message?.includes('timeout') || err?.status === 500) {
            console.warn('Storage timeout or server error - using fallback avatar');
          }
          try {
            // Fallback to getPublicUrl if createSignedUrl fails
            const { data: publicData } = await supabase.storage
              .from("avatars")
              .getPublicUrl(profile.avatar_url);
            // Normalize hostname to ensure consistency
            const normalizedPublicUrl = publicData?.publicUrl?.replace('localhost', '127.0.0.1') || null;
            setAvatarUrl(normalizedPublicUrl);
          } catch (publicUrlError: any) {
            console.error("Error getting public avatar URL:", publicUrlError);
            setAvatarUrl(null); // Set to null if both methods fail
          }
        }
      };

      fetchAvatarUrl();
    } else {
      // If no avatar_url is provided, set to null
      setAvatarUrl(null);
    }
  }, [profile.avatar_url, supabase]);

  // Set academic fields from profile
  useEffect(() => {
    setAcademicLevel(profile.academic_level || "student");
    setDepartment(profile.department || "Software Engineering");
    setFaculty(profile.faculty || "Faculty of Computing");
    setInstitution(profile.institution || "Bayero University");
    setLinkedinUrl(profile.linkedin_url || "");
    setGithubUrl(profile.github_url || "");
  }, [profile.academic_level, profile.department, profile.faculty, profile.institution, profile.linkedin_url, profile.github_url]);

  const handleUpload: React.ChangeEventHandler<HTMLInputElement> = async (
    event
  ) => {
    try {
      setUploading(true);
      setError(null);
      setSuccessMessage(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error uploading avatar."
      );
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      setUploading(true);
      setError(null);
      setSuccessMessage(null);

      // Delete the old avatar from storage if it exists
      if (profile.avatar_url) {
        const { error: deleteError } = await supabase.storage
          .from("avatars")
          .remove([profile.avatar_url]);

        if (deleteError) {
          console.error("Error deleting old avatar:", deleteError);
          // Don't throw an error for failed deletion, just log it
        }
      }

      // Update the profile to remove avatar_url
      await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      // Reset avatar URL state
      setAvatarUrl(null);
      setAvatarFile(null);

      router.refresh();
      setSuccessMessage("Profile picture removed successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error removing profile picture."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setUploading(true);
      setError(null);
      setSuccessMessage(null);

      let avatar_url = profile.avatar_url;

      // If a new avatar was selected, upload it and delete the old one if it exists
      if (avatarFile) {
        // Delete the old avatar from storage if it exists
        if (profile.avatar_url) {
          const { error: deleteError } = await supabase.storage
            .from("avatars")
            .remove([profile.avatar_url]);

          if (deleteError) {
            console.error("Error deleting old avatar:", deleteError);
            // Don't throw an error for failed deletion, just log it
          }
        }

        const fileExt = avatarFile.name.split(".").pop()?.toLowerCase();
        const fileName = `${user.id}-${Math.random()}`;
        const filePath = fileExt ? `${fileName}.${fileExt}` : fileName;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile);

        if (uploadError) {
          throw uploadError;
        }
        // Only store the file path in the database, not the full URL
        avatar_url = filePath;
      }

      await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          avatar_url,
          academic_level: academicLevel,
          department: department,
          faculty: faculty,
          institution: institution,
          linkedin_url: linkedinUrl,
          github_url: githubUrl
        })
        .eq("id", user.id);

      // Update avatar URL after successful save by generating a new signed URL
      if (avatar_url && avatar_url !== profile.avatar_url) {
        // Use the same approach as in useEffect to fetch the avatar URL
        const { data: urlData, error: urlError } = await supabase.storage
          .from("avatars")
          .createSignedUrl(avatar_url, 3600); // 1 hour expiry

        if (!urlError && urlData?.signedUrl) {
          // Normalize hostname to ensure consistency
          const normalizedSignedUrl = urlData.signedUrl.replace('localhost', '127.0.0.1');
          setAvatarUrl(normalizedSignedUrl);
        } else {
          // Fallback to getPublicUrl if createSignedUrl fails
          const { data: publicData } = await supabase.storage
            .from("avatars")
            .getPublicUrl(avatar_url);
          // Normalize hostname to ensure consistency
          const normalizedPublicUrl = publicData?.publicUrl?.replace('localhost', '127.0.0.1') || avatar_url;
          setAvatarUrl(normalizedPublicUrl);
        }
      }
      // If avatar was removed, set avatarUrl to null
      else if (!avatar_url && profile.avatar_url) {
        setAvatarUrl(null);
      }

      router.refresh();
      setSuccessMessage("Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error updating profile."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <Image
            width={150}
            height={150}
            src={avatarUrl}
            alt="Avatar"
            className="avatar image rounded-full"
            unoptimized
            onError={(e) => {
              console.warn("Error loading image:", e instanceof ErrorEvent ? e.error || "Image loading failed" : "Image loading failed");
              // Try to fall back to a different URL format if the original fails
              const target = e.target as HTMLImageElement;
              if (target && target.src) {
                if (target.src.includes('localhost') && !target.src.includes('127.0.0.1')) {
                  // If using localhost, try 127.0.0.1 as alternative
                  target.src = target.src.replace('localhost', '127.0.0.1');
                } else if (target.src.includes('127.0.0.1') && !target.src.includes('localhost')) {
                  // If using 127.0.0.1, try localhost as alternative
                  target.src = target.src.replace('127.0.0.1', 'localhost');
                } else {
                  // If both approaches failed, show the fallback
                  target.onerror = null; // Prevent infinite loop
                  target.style.display = 'none';
                  const fallbackDiv = target.parentElement?.querySelector('.avatar.no-image');
                  if (fallbackDiv) {
                    fallbackDiv.setAttribute('style', `height: 150px; width: 150px; display: block;`);
                  }
                }
              }
            }}
          />
        ) : (
          <div
            className="avatar no-image rounded-full bg-gray-200"
            style={{ height: 150, width: 150, display: 'block' }}
          />
        )}
        <div className="flex flex-col gap-2">
          <Button asChild>
            <label htmlFor="single">
              {uploading ? "Uploading ..." : "Upload"}
            </label>
          </Button>
          <Input
            style={{
              visibility: "hidden",
              position: "absolute",
            }}
            type="file"
            id="single"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
          />
          {avatarUrl && (
            <Button
              variant="outline"
              onClick={removeAvatar}
              disabled={uploading}
            >
              {uploading ? "Processing..." : "Remove Picture"}
            </Button>
          )}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="academicLevel">Academic Level</Label>
          <select
            id="academicLevel"
            value={academicLevel}
            onChange={(e) => setAcademicLevel(e.target.value)}
            className="border rounded-md px-3 py-2 w-full bg-background"
          >
            <option value="student">Student</option>
            <option value="level_100">Level 100</option>
            <option value="level_200">Level 200</option>
            <option value="level_300">Level 300</option>
            <option value="level_400">Level 400</option>
            <option value="alumni">Alumni</option>
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="faculty">Faculty</Label>
          <Input
            id="faculty"
            type="text"
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="institution">Institution</Label>
          <Input
            id="institution"
            type="text"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
          <Input
            id="linkedinUrl"
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/your-profile"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="githubUrl">GitHub Profile URL</Label>
          <Input
            id="githubUrl"
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/your-profile"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {successMessage && <p className="text-sm text-green-500">{successMessage}</p>}
        <Button type="submit" className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg" disabled={uploading}>
          {uploading ? "Saving..." : "Update Profile"}
        </Button>
      </form>
    </div>
  );
}
