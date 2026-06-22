import { Role } from "@prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  SELLER: "Vendedor",
  WAREHOUSE: "Almacén",
};

export function canAccess(
  role: Role,
  resource: "products" | "lots" | "customers" | "sales" | "reports" | "users" | "suppliers" | "stock" | "audit"
): boolean {
  const permissions: Record<Role, string[]> = {
    ADMIN: ["products", "lots", "customers", "sales", "reports", "users", "suppliers", "stock", "audit"],
    SELLER: ["customers", "sales"],
    WAREHOUSE: ["products", "lots", "suppliers", "stock"],
  };
  return permissions[role].includes(resource);
}

export function canWriteProducts(role: Role) {
  return role === Role.ADMIN || role === Role.WAREHOUSE;
}

export function canWriteSales(role: Role) {
  return role === Role.ADMIN || role === Role.SELLER;
}

export function canViewReports(role: Role) {
  return role === Role.ADMIN;
}
