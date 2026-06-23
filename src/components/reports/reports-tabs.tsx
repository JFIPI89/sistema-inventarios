"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function ReportsTabs({
  activeTab,
  startDate,
  endDate,
}: {
  activeTab: "operaciones" | "cartera";
  startDate: string;
  endDate: string;
}) {
  const base = `/reports?start=${startDate}&end=${endDate}`;

  const tabs = [
    { id: "operaciones" as const, label: "Operaciones", href: `${base}&tab=operaciones` },
    { id: "cartera" as const, label: "Cartera", href: `${base}&tab=cartera` },
  ];

  return (
    <nav className="flex gap-1 border-b border-border" aria-label="Secciones de informes">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={cn(
            "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
            activeTab === tab.id
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
