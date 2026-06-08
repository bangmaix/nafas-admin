import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    const variants = {
      primary:
        "bg-[#00d4aa] hover:bg-[#00bb95] text-[#020c18] font-bold shadow-[0_0_22px_rgba(0,212,170,0.35)] hover:shadow-[0_0_32px_rgba(0,212,170,0.55)] focus:ring-[#00d4aa] active:shadow-none",
      secondary:
        "bg-[#0ea5e9] hover:bg-[#0891d0] text-white shadow-[0_0_18px_rgba(14,165,233,0.30)] hover:shadow-[0_0_28px_rgba(14,165,233,0.50)] focus:ring-[#0ea5e9]",
      outline:
        "border border-[#00d4aa]/40 text-[#00d4aa] hover:bg-[#00d4aa]/10 hover:border-[#00d4aa]/60 focus:ring-[#00d4aa]",
      ghost:
        "text-slate-400 hover:bg-white/5 hover:text-slate-200 focus:ring-slate-500",
      danger:
        "bg-red-600/90 hover:bg-red-600 text-white shadow-sm focus:ring-red-500",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
