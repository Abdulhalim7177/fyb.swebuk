"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UpdateUserRoleForm({
  profile,
}: {
  profile: { id: string; role: string };
}) {
  const router = useRouter();
  const [role, setRole] = useState(profile.role);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", profile.id);

    if (error) {
      console.error(error);
    } else {
      router.push("/dashboard/admin/users");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        <div>
          <label
            htmlFor="role"
            className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
          >
            Role
          </label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-600 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
          >
            <option value="Student">Student</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      <button
        type="submit"
        className="mt-4 inline-flex items-center rounded-lg bg-primary-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-primary-800 focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900"
      >
        Update role
      </button>
    </form>
  );
}
