"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = saved === "dark" || (!saved && prefersDark);
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center justify-center h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 transition-colors"
      aria-label="Toggle dark mode"
      suppressHydrationWarning
    >
      {mounted
        ? isDark
          ? <Sun className="h-[18px] w-[18px]" />
          : <Moon className="h-[18px] w-[18px]" />
        : <Moon className="h-[18px] w-[18px]" />
      }
    </button>
  );
}
