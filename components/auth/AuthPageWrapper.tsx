"use client";

import { useEffect, useState } from "react";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

export default function AuthPageWrapper({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const update = () => setDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 transition-colors duration-500"
      style={{
        backgroundColor: dark ? "#0a0f1a" : "#f8fafc",
        backgroundImage: `radial-gradient(circle, ${dark ? "#1f2937" : "#CBD5E1"} 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
      }}
    >
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>
      <div className="w-full max-w-[480px]">{children}</div>
    </div>
  );
}
