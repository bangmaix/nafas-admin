import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "neutral";
  className?: string;
}

export function Badge({
  children,
  variant = "neutral",
  className,
}: BadgeProps) {
  const variants = {
    success: "bg-emerald-500/12 text-emerald-300 ring-emerald-500/30",
    warning: "bg-amber-500/12  text-amber-300  ring-amber-500/30",
    error:   "bg-red-500/12    text-red-300    ring-red-500/30",
    info:    "bg-sky-500/12    text-sky-300    ring-sky-500/30",
    neutral: "bg-slate-500/10  text-slate-300  ring-slate-500/25",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
