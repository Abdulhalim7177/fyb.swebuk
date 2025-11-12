"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserTable } from "./user-table";
import { CreateUserDialog } from "./create-user-dialog";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  email_confirmed_at: string | null;
}

interface AdminUsersClientWrapperProps {
  initialProfiles: UserProfile[];
  currentUserRole: string;
}

export default function AdminUsersClientWrapper({
  initialProfiles,
  currentUserRole
}: AdminUsersClientWrapperProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>(initialProfiles);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Refresh profiles when refreshTrigger changes
  useEffect(() => {
    const fetchProfiles = async () => {
      const supabase = createClient();
      const { data: newProfiles } = await supabase.from("profiles").select("*");
      if (newProfiles) {
        setProfiles(newProfiles);
      }
    };

    fetchProfiles();
  }, [refreshTrigger]);

  const handleUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-4xl">Users</h2>
        <CreateUserDialog
          onCreate={handleUpdate}
          currentUserRole={currentUserRole}
        />
      </div>
      <UserTable
        profiles={profiles}
        currentUserRole={currentUserRole}
        onUpdate={handleUpdate}
      />
    </div>
  );
}