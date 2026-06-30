"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      asChild = false,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const variants = {
      default:
        "bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm shadow-indigo-500/20",
      secondary:
        "bg-[var(--background-tertiary)] hover:bg-[var(--border)] text-[var(--foreground)] border border-[var(--border)]",
      ghost:
        "hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
      danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20",
      outline:
        "border border-[var(--border)] hover:bg-[var(--background-tertiary)] text-[var(--foreground)]",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
      md: "h-9 px-4 text-sm rounded-xl gap-2",
      lg: "h-11 px-6 text-base rounded-xl gap-2",
      icon: "h-9 w-9 rounded-xl",
    };

    const spinner = (
      <svg
        className="animate-spin h-4 w-4 shrink-0"
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
    );

    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && spinner}
            {children}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";
