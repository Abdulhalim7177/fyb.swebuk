import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <div className="min-h-svh w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 dark:from-gray-900 dark:via-blue-900 p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="p-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1a4 4 0v-1M21 12a9 9 9 0v1a4 4 0 9-9M23 19a2 2 2 0v-1" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
              Sign in to your Swebuk account to continue managing clusters and projects
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
