"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="relative flex items-center gap-1 rounded-xl p-0.5 transition-all duration-300"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        width: 64,
        height: 30,
      }}
    >
      {/* Track */}
      <span
        className="absolute inset-0.5 rounded-[10px] transition-all duration-300"
        style={{
          background:
            theme === "dark"
              ? "linear-gradient(90deg, rgba(0,200,150,0.12), rgba(29,160,207,0.08))"
              : "linear-gradient(90deg, rgba(247,201,72,0.18), rgba(0,200,150,0.10))",
        }}
      />

      {/* Icons */}
      <span className="relative z-10 flex items-center justify-center w-6 h-6 ml-0.5">
        <Moon
          size={13}
          style={{
            color: theme === "dark" ? "#00c896" : "var(--text-muted)",
            transition: "color 0.3s",
          }}
        />
      </span>
      <span className="relative z-10 flex items-center justify-center w-6 h-6 ml-1">
        <Sun
          size={13}
          style={{
            color: theme === "light" ? "#f7c948" : "var(--text-muted)",
            transition: "color 0.3s",
          }}
        />
      </span>

      {/* Sliding pill */}
      <span
        className="absolute top-1 rounded-lg transition-all duration-300 shadow-sm"
        style={{
          width: 26,
          height: 22,
          left: theme === "dark" ? 3 : 33,
          background:
            theme === "dark"
              ? "linear-gradient(135deg, #00c896, #009e78)"
              : "linear-gradient(135deg, #f7c948, #f59e0b)",
          boxShadow:
            theme === "dark"
              ? "0 0 8px rgba(0,200,150,0.45)"
              : "0 0 8px rgba(247,201,72,0.55)",
        }}
      />
    </button>
  );
}
