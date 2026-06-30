import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--foreground)]"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--background-tertiary)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] outline-none transition-all",
            "focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20",
            error && "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
