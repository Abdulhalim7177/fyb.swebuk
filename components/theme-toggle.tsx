"use client";

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check initial theme
    if (typeof window !== 'undefined') {
      const theme = localStorage.getItem('theme');
      if (theme === 'light' || (!theme && window.matchMedia('(prefers-color-scheme: light)').matches)) {
        setIsDark(false);
        document.documentElement.classList.remove('dark');
        document.body.classList.add('bg-slate-50', 'text-slate-900');
      } else {
        setIsDark(true);
        document.documentElement.classList.add('dark');
        document.body.classList.add('bg-slate-900', 'text-white');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    if (newTheme) {
      document.documentElement.classList.add('dark');
      document.body.classList.remove('bg-slate-50', 'text-slate-900');
      document.body.classList.add('bg-slate-900', 'text-white');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('bg-slate-900', 'text-white');
      document.body.classList.add('bg-slate-50', 'text-slate-900');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 group"
      aria-label="Toggle theme"
    >
      <div className="relative">
        <Sun
          className={`absolute inset-0 w-5 h-5 text-yellow-400 transition-all duration-300 ${
            isDark ? 'opacity-0 scale-0 rotate-180' : 'opacity-100 scale-100 rotate-0'
          }`}
        />
        <Moon
          className={`absolute inset-0 w-5 h-5 text-blue-300 transition-all duration-300 ${
            isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-180'
          }`}
        />
        {/* Spacer to maintain button size */}
        <div className="w-5 h-5" />
      </div>

      {/* Animated ring effect */}
      <div className={`absolute inset-0 rounded-lg border-2 transition-all duration-300 ${
        isDark ? 'border-blue-400/50' : 'border-yellow-400/50'
      } group-hover:scale-110`} />
    </button>
  );
}