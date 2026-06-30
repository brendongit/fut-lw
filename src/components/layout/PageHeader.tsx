import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6 sm:mb-8", className)}>
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] truncate">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
