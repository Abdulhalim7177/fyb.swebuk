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
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-500 group overflow-hidden"
      aria-label="Toggle theme"
    >
      <div className="relative z-10">
        <Sun
          className={`absolute inset-0 w-5 h-5 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)] transition-all duration-700 ${
            isDark ? 'opacity-0 scale-0 rotate-180' : 'opacity-100 scale-100 rotate-0'
          } group-hover:rotate-90`}
        />
        <Moon
          className={`absolute inset-0 w-5 h-5 text-blue-300 transition-all duration-700 ${
            isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-180'
          } group-hover:-rotate-12`}
        />
        <div className="w-5 h-5" />
      </div>

      {/* Animated background glow */}
      <div className={`absolute inset-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${
        isDark ? 'bg-blue-500/10' : 'bg-yellow-500/10'
      }`} />

      {/* Pulsating outer ring */}
      <div className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${
        isDark ? 'border-blue-400/30' : 'border-yellow-400/30'
      } group-hover:scale-110 group-hover:border-opacity-100 animate-pulse`} />
    </button>
  );
}