import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("app-page-header", className)}>
      <div className="min-w-0 flex-1">
        <h1 className="app-page-title">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">{description}</p>
        ) : null}
      </div>
      {children ? <div className="app-page-actions shrink-0">{children}</div> : null}
    </div>
  );
}
