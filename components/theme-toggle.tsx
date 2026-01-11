"use client";

import { useTheme } from "@/contexts/theme-context";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
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
            theme === "light" ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-0 rotate-180"
          } group-hover:rotate-90`}
        />
        <Moon
          className={`absolute inset-0 w-5 h-5 text-blue-300 transition-all duration-700 ${
            theme === "dark" ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-0 -rotate-180"
          } group-hover:-rotate-12`}
        />
        <div className="w-5 h-5" />
      </div>

      {/* Animated background glow */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${
          theme === "dark" ? "bg-blue-500/10" : "bg-yellow-500/10"
        }`}
      />

      {/* Pulsating outer ring */}
      <div
        className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${
          theme === "dark" ? "border-blue-400/30" : "border-yellow-400/30"
        } group-hover:scale-110 group-hover:border-opacity-100 animate-pulse`}
      />
    </button>
  );
}