"use client";
import { useTheme as useNextTheme } from "next-themes";

export function useTheme() {
  const { theme, resolvedTheme, setTheme } = useNextTheme();
  const activeTheme = resolvedTheme ?? theme ?? "light";

  return {
    theme: activeTheme,
    isDark: activeTheme === "dark",
    setTheme,
    toggle: () => setTheme(activeTheme === "dark" ? "light" : "dark"),
  };
}
