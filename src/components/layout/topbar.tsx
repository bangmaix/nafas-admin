"use client";

import { Bell, Search } from "lucide-react";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header
      className="h-16 flex items-center justify-between px-6 sticky top-0 z-20 glass"
      style={{ borderBottom: "1px solid var(--border-faint)" }}
    >
      {/* Title with accent bar */}
      <div className="flex items-center gap-3">
        <div
          className="w-1 h-7 rounded-full flex-shrink-0"
          style={{
            background: "linear-gradient(180deg, #00c896, #1da0cf)",
            boxShadow: "0 0 10px rgba(0,200,150,0.6)",
          }}
        />
        <div>
          <h1 className="text-[15px] font-bold leading-tight text-white tracking-wide">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] font-medium leading-tight mt-0.5" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Cari..."
            className="w-52 pl-9 pr-4 py-2 text-sm rounded-xl text-white transition-all duration-200 focus:outline-none focus:ring-1"
            style={{
              background: "rgba(12,28,50,0.85)",
              border: "1px solid var(--border-subtle)",
              "--tw-ring-color": "#00c896",
              caretColor: "#00c896",
            } as React.CSSProperties}
          />
        </div>

        {/* Bell */}
        <button
          className="relative p-2 rounded-xl transition-all duration-200"
          style={{ border: "1px solid transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor = "var(--border-subtle)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          <Bell size={17} style={{ color: "var(--text-secondary)" }} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2"
            style={{
              background: "#00c896",
              boxShadow: "0 0 7px #00c896",
              "--tw-ring-color": "var(--bg-base)",
            } as React.CSSProperties}
          />
        </button>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #00c896, #1da0cf)",
            boxShadow: "0 0 16px rgba(0,200,150,0.35)",
          }}
        >
          <span className="text-white text-sm font-bold" style={{ color: "#020c18" }}>A</span>
        </div>
      </div>
    </header>
  );
}

