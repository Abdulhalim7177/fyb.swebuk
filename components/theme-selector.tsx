"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ] as const;

  return (
    <div className="relative flex items-center space-x-1 rounded-full bg-muted p-1">
      {themes.map((themeOption) => {
        const Icon = themeOption.icon;
        const isActive = theme === themeOption.value;

        return (
          <Button
            key={themeOption.value}
            variant="ghost"
            size="sm"
            onClick={() => setTheme(themeOption.value)}
            className="relative h-8 w-8 p-0 rounded-full z-10"
            title={`${themeOption.label} theme`}
          >
            <Icon className="w-4 h-4" />
          </Button>
        );
      })}
      <motion.div
        className="absolute top-1 left-1 h-8 w-8 rounded-full bg-background z-0"
        layoutId="theme-selector-bg"
        initial={{ x: theme === "light" ? 0 : "100%" }}
        animate={{ x: theme === "light" ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    </div>
  );
}