import CompleteProfileForm from "@/components/complete-profile-form";

export default function CompleteProfilePage() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Complete Your Profile</h1>
        <CompleteProfileForm />
      </div>
    </div>
  );
}
