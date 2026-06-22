"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Users,
  ShoppingCart,
  BarChart3,
  LogOut,
  Truck,
  History,
  ScrollText,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";
import { canAccess } from "@/lib/permissions";
import { HorusLogo } from "@/components/brand/horus-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, resource: null },
  { href: "/products", label: "Productos", icon: Package, resource: "products" as const },
  { href: "/lots", label: "Lotes", icon: Boxes, resource: "lots" as const },
  { href: "/suppliers", label: "Proveedores", icon: Truck, resource: "suppliers" as const },
  { href: "/stock/history", label: "Movimientos", icon: History, resource: "stock" as const },
  { href: "/customers", label: "Clientes", icon: Users, resource: "customers" as const },
  { href: "/sales", label: "Ventas", icon: ShoppingCart, resource: "sales" as const },
  { href: "/reports", label: "Informes", icon: BarChart3, resource: "reports" as const },
  { href: "/admin/historico", label: "Histórico", icon: ScrollText, resource: "audit" as const },
];

export function Sidebar({
  role,
  userName,
  className,
  onNavigate,
  showClose,
  onClose,
  ariaHidden,
}: {
  role: Role;
  userName: string;
  className?: string;
  onNavigate?: () => void;
  showClose?: boolean;
  onClose?: () => void;
  ariaHidden?: boolean;
}) {
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) => {
    if (!item.resource) return true;
    return canAccess(role, item.resource);
  });

  return (
    <aside
      className={cn(
        "relative flex h-screen h-[100dvh] w-64 flex-col border-r text-sidebar-foreground",
        className
      )}
      style={{
        background: "var(--sidebar)",
        borderColor: "var(--sidebar-border)",
      }}
      aria-hidden={ariaHidden}
    >
      <div className="gold-line" />
      <div
        className="flex items-start justify-between border-b p-4 sm:p-6"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <div className="min-w-0 flex-1">
          <HorusLogo size="md" />
          <p className="mt-3 truncate font-space-mono text-[10px] tracking-wide text-muted-foreground">
            {userName}
          </p>
        </div>
        {showClose ? (
          <button
            type="button"
            aria-label="Cerrar menú"
            className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                active
                  ? "font-medium text-gold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              style={
                active
                  ? {
                      background: "var(--sidebar-active)",
                      border: "1px solid var(--sidebar-border)",
                    }
                  : undefined
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div
        className="space-y-2 border-t p-4"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <ThemeToggle className="w-full" />
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
