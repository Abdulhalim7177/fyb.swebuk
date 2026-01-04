import { LoginForm } from "@/components/login-form";
import Image from "next/image";

export default function Page() {
  return (
    <div className="min-h-svh w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 dark:from-gray-900 dark:via-blue-900 p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="p-1 rounded-full bg-transparent transition-transform hover:scale-105">
                <Image
                  src="/buk-logo.png"
                  alt="Swebuk Logo"
                  width={64}
                  height={64}
                  className="object-contain"
                />
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
