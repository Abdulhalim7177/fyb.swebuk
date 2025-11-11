"use client";

import { createClient } from "@/lib/supabase/client";
import { type User } from "@supabase/supabase-js";
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
};

export default function UpdateProfileForm({
  user,
  profile,
}: {
  user: User;
  profile: Profile;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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
      supabase.storage
        .from("avatars")
        .createSignedUrl(profile.avatar_url, 3600) // 1 hour expiry
        .then(({ data, error }) => {
          if (error) {
            console.error("Error getting signed avatar URL:", error);
            // Fallback to getPublicUrl if createSignedUrl fails
            const { data: publicData } = supabase.storage
              .from("avatars")
              .getPublicUrl(profile.avatar_url);
            setAvatarUrl(publicData?.publicUrl || null);
          } else if (data?.signedUrl) {
            setAvatarUrl(data.signedUrl);
          } else {
            // Fallback to getPublicUrl if signed URL doesn't exist
            const { data: publicData } = supabase.storage
              .from("avatars")
              .getPublicUrl(profile.avatar_url);
            setAvatarUrl(publicData?.publicUrl || null);
          }
        })
        .catch(err => {
          console.error("Unexpected error getting avatar URL:", err);
          setError("Error loading avatar image");
        });
    }
  }, [profile.avatar_url, supabase]);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setUploading(true);
      setError(null);
      setSuccessMessage(null);

      let avatar_url = profile.avatar_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop()?.toLowerCase();
        const fileName = `${user.id}-${Math.random()}`;
        const filePath = fileExt ? `${fileName}.${fileExt}` : fileName;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile);

        if (uploadError) {
          throw uploadError;
        }
        avatar_url = filePath;
      }

      await supabase
        .from("profiles")
        .update({ full_name: fullName, avatar_url })
        .eq("id", user.id);

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
          />
        ) : (
          <div
            className="avatar no-image rounded-full bg-gray-200"
            style={{ height: 150, width: 150 }}
          />
        )}
        <div>
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
        {error && <p className="text-sm text-red-500">{error}</p>}
        {successMessage && <p className="text-sm text-green-500">{successMessage}</p>}
        <Button type="submit" className="w-full" disabled={uploading}>
          {uploading ? "Saving..." : "Update Profile"}
        </Button>
      </form>
    </div>
  );
}
