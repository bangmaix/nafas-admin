import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
  glow?: boolean;
}

export function Card({
  className,
  children,
  padding = "md",
  hover = false,
  onClick,
  glow = false,
}: CardProps) {
  const paddings = { none: "", sm: "p-4", md: "p-6", lg: "p-8" };
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl transition-all duration-300",
        hover && "cursor-pointer hover:-translate-y-0.5",
        paddings[padding],
        className
      )}
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${glow ? "rgba(0,212,170,0.25)" : "var(--border-subtle)"}`,
        boxShadow: glow
          ? "0 0 30px rgba(0,212,170,0.08), 0 2px 8px rgba(0,0,0,0.4)"
          : "0 1px 4px rgba(0,0,0,0.45)",
      }}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  iconBg?: string;
  accentColor?: string;
}

export function StatCard({
  label,
  value,
  icon,
  change,
  changeType = "neutral",
  iconBg,
  accentColor = "#00d4aa",
}: StatCardProps) {
  const changeColors = {
    up:      "#34d399",
    down:    "#f87171",
    neutral: "var(--text-muted)",
  };

  return (
    <div
      className="rounded-2xl p-6 flex items-start justify-between gap-4 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.45)",
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-white">{value}</p>
        {change && (
          <p className="mt-1.5 text-xs font-semibold" style={{ color: changeColors[changeType] }}>
            {change}
          </p>
        )}
      </div>
      <div
        className="p-3 rounded-xl flex-shrink-0"
        style={{
          background: iconBg ?? `rgba(0,212,170,0.1)`,
          border: `1px solid ${accentColor}22`,
        }}
      >
        {icon}
      </div>
    </div>
  );
}
