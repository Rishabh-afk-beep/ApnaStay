import { useTheme } from "../../lib/ThemeContext";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  const onToggle = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={onToggle}
      className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
      style={{
        background: "var(--surface-container-high)",
        border: "1px solid var(--glass-border)",
        color: "var(--on-surface)",
        boxShadow: "var(--shadow-ambient)",
      }}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      type="button"
    >
      {resolvedTheme === "dark" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-5 w-5 animate-scale-in text-amber-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m0 13.5V21M4.93 4.93l1.581 1.58m11.186 11.186l1.58 1.581M3 12h2.25m13.5 0H21M5.757 18.243l1.58-1.581m11.186-11.186l1.58 1.58M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-5 w-5 animate-scale-in text-slate-700"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
          />
        </svg>
      )}
    </button>
  );
}
