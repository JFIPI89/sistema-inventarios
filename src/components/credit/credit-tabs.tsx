"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type CreditView = "dashboard" | "planes" | "reportes";

export function CreditTabs({
  activeView,
  q,
  status,
}: {
  activeView: CreditView;
  q?: string;
  status?: string;
}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);

  const suffix = params.toString() ? `&${params.toString()}` : "";

  const tabs: { id: CreditView; label: string; href: string }[] = [
    { id: "dashboard", label: "Dashboard", href: `/credit${suffix ? `?${params.toString().replace(/^&/, "")}` : ""}` },
    { id: "planes", label: "Planes", href: `/credit?view=planes${suffix}` },
    { id: "reportes", label: "Reportes", href: `/credit?view=reportes` },
  ];

  return (
    <nav className="flex gap-1 border-b border-border" aria-label="Secciones de cartera">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={cn(
            "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
            activeView === tab.id
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
