import { useState, useEffect } from "react";

export function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lds-dark");
    if (saved === "true") setDark(true);
  }, []);

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("lds-dark", String(dark));
  }, [dark]);

  return { dark, toggle: () => setDark((v) => !v) };
}
