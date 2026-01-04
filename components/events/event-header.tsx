"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, User, LogIn, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface EventHeaderProps {
  showBack?: boolean;
  backHref?: string;
  title?: string;
  isAuthenticated?: boolean;
}

export function EventHeader({
  showBack = false,
  backHref = "/events",
  title,
  isAuthenticated: initialIsAuthenticated,
}: EventHeaderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialIsAuthenticated ?? false);
  const [loading, setLoading] = useState(initialIsAuthenticated === undefined);
  const router = useRouter();

  useEffect(() => {
    if (initialIsAuthenticated !== undefined) return;

    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await (supabase.auth as any).getSession();
      setIsAuthenticated(!!session);
      setLoading(false);
    };

    checkAuth();
  }, [initialIsAuthenticated]);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(backHref);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/40 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
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
            <span className="inline">Swebuk Events</span>
          </Link>

          {title && (
            <h2 className="text-lg font-semibold hidden md:block border-l pl-4 ml-2 border-border/40">{title}</h2>
          )}
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-9 w-24 animate-pulse bg-muted rounded-md" />
          ) : isAuthenticated ? (
            <Link href="/dashboard">
              <Button variant="default" size="sm" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="default" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Up</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
