"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { AuthButtonClient } from "@/components/auth-button-client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#testimonials", label: "Testimonials" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <>
      {/* Scroll Progress Bar */}
      <div className="scroll-progress-bar" />
      
      <header className={`sticky top-0 z-50 w-full border-b border-border/40 bg-[var(--bg-glass)] backdrop-blur-[var(--glass-blur-medium)] transition-all duration-300 ${isScrolled ? 'shadow-sm' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? 'h-14' : 'h-20'}`}>
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
              <div className="relative w-8 h-8">
                <Image
                  src="/buk-logo.png"
                  alt="Swebuk Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-bold text-xl text-foreground">Swebuk</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className="text-sm font-semibold text-foreground/80 hover:text-primary transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-4">
              <ThemeToggle />
              <AuthButtonClient />
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center gap-4">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b border-border/40 bg-background/60 backdrop-blur-3xl absolute left-0 right-0 p-6 shadow-2xl animate-in slide-in-from-top-5 duration-300 z-40">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-bold text-foreground/90 hover:text-primary transition-colors px-2 py-3 rounded-xl hover:bg-primary/10"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-6 mt-2 border-t border-border/40">
                <AuthButtonClient />
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
