import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UpdateUserRoleForm from "./update-user-role-form";

export default async function EditUserPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!profile) {
    return <div>User not found</div>;
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <div className="w-full">
        <div className="py-6 font-bold bg-purple-950 text-center">
          Edit User
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-20 max-w-4xl px-3">
        <main className="flex-1 flex flex-col gap-6">
          <h2 className="font-bold text-4xl mb-4">
            Edit User: {profile.full_name}
          </h2>
          <UpdateUserRoleForm profile={profile} />
        </main>
      </div>
    </div>
  );
}
