"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, LayoutDashboard, LogIn } from "lucide-react";

interface BlogNavBarProps {
  isAuthenticated: boolean;
}

export function BlogNavBar({ isAuthenticated }: BlogNavBarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/40 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <BookOpen className="w-6 h-6 text-primary" />
            Swebuk Blog
          </Link>
          {isAuthenticated ? (
            <Button asChild size="sm">
              <Link href="/dashboard">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/login">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
