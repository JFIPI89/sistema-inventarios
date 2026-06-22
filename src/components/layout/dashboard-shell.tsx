"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { HorusLogo } from "@/components/brand/horus-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Sidebar } from "@/components/layout/sidebar";

export function DashboardShell({
  role,
  userName,
  children,
}: {
  role: Role;
  userName: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-background">
      <Sidebar
        role={role}
        userName={userName}
        className="hidden shrink-0 lg:flex"
      />

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <Sidebar
        role={role}
        userName={userName}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[min(85vw,18rem)] transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
        onNavigate={() => setMobileOpen(false)}
        showClose
        onClose={() => setMobileOpen(false)}
        ariaHidden={!mobileOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b px-4 lg:hidden"
          style={{
            background: "var(--sidebar)",
            borderColor: "var(--sidebar-border)",
          }}
        >
          <button
            type="button"
            aria-label="Abrir menú"
            className="flex h-10 w-10 items-center justify-center rounded-md text-foreground"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <HorusLogo size="sm" subtitle="" />
          <ThemeToggle compact />
        </header>

        <main className="relative min-w-0 flex-1 overflow-auto">
          <div className="gold-line hidden lg:block" />
          <div className="app-main-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
