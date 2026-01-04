"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, LogIn, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BlogNavBarProps {
  isAuthenticated: boolean;
  showBack?: boolean;
  backHref?: string;
}

export function BlogNavBar({ isAuthenticated, showBack = false, backHref = "/" }: BlogNavBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(backHref);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/40 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            {showBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Image
                src="/buk-logo.png"
                alt="BUK Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
              Swebuk Blog
            </Link>
          </div>
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
