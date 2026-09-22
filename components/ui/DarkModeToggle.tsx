"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function DarkModeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Deferred so the setState doesn't run synchronously within the effect body.
  useEffect(() => { queueMicrotask(() => setMounted(true)); }, []);

  if (!mounted) return <div className="w-9 h-9" />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={
        className ??
        "p-2 rounded-lg text-[#0A0A0A]/60 dark:text-white/75 hover:bg-brand/10 dark:hover:bg-white/8 transition-colors"
      }
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
