"use client";

import { createClient } from "@/lib/supabase/client";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { TopNav } from "@/components/dashboard/top-nav";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export function DashboardWrapper({ children }: DashboardWrapperProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const initializeUser = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(user);

      // Fetch role from profiles table instead of user metadata
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      let role = 'student'; // default role
      if (profileError || !profileData) {
        console.error('Error fetching profile or profile not found:', profileError);
        // Fallback to user metadata if profile is not found
        role = user.user_metadata?.role || "student";
      } else {
        role = profileData.role || 'student';
      }

      setUserRole(role);
      setLoading(false);
    };

    initializeUser();

    // Listen for auth changes
    const { data: { subscription } } = createClient().auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[oklch(92.2% 0 0)]">
      {/* Desktop Sidebar */}
      <DashboardNav 
        userId={user.id} 
        userProfileRole={userRole!} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNav 
          user={user} 
          userRole={userRole!} 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}