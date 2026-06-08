import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-semibold mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              "w-full rounded-xl px-4 py-2.5 text-sm text-white transition-all duration-150",
              "placeholder:text-[#2d4060]",
              "focus:outline-none focus:ring-1 focus:ring-[#00d4aa]",
              "disabled:cursor-not-allowed disabled:opacity-40",
              leftIcon && "pl-10",
              error && "!border-red-500/40 !ring-red-500",
              className
            )}
            style={{
              background: "rgba(12,28,50,0.85)",
              border: "1px solid var(--border-subtle)",
              caretColor: "#00d4aa",
            }}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs" style={{ color: "#f87171" }}>{error}</p>}
        {hint && !error && (
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
