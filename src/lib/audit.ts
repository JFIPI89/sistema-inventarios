import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import { AuditAction, Prisma } from "@prisma/client";

export type AuditSession = Pick<SessionUser, "id" | "name" | "email">;

export type ChangeRecord = Record<string, { from: unknown; to: unknown }>;

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "Alta",
  UPDATE: "Modificación",
  DELETE: "Eliminación",
  LOGIN: "Inicio de sesión",
  LOGOUT: "Cierre de sesión",
  IMPORT: "Importación",
  CANCEL: "Cancelación",
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  Product: "Producto",
  Lot: "Lote",
  Supplier: "Proveedor",
  Customer: "Cliente",
  Sale: "Venta",
  Session: "Sesión",
  ImportBatch: "Importación CSV",
};

export function buildChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields?: string[]
): ChangeRecord | null {
  const keys = fields ?? [...new Set([...Object.keys(before), ...Object.keys(after)])];
  const changes: ChangeRecord = {};

  for (const key of keys) {
    const fromVal = before[key];
    const toVal = after[key];
    if (JSON.stringify(fromVal) !== JSON.stringify(toVal)) {
      changes[key] = { from: fromVal ?? null, to: toVal ?? null };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

export async function logAudit(params: {
  session: AuditSession | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  summary: string;
  changes?: ChangeRecord | Record<string, unknown> | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.session?.id ?? null,
        userName: params.session?.name ?? "Sistema",
        userEmail: params.session?.email ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        entityLabel: params.entityLabel ?? null,
        summary: params.summary,
        changes: params.changes
          ? (params.changes as Prisma.InputJsonValue)
          : undefined,
      },
    });
  } catch (e) {
    console.error("[audit]", e);
  }
}

export function formatAuditChanges(changes: unknown): string {
  if (!changes || typeof changes !== "object") return "—";
  const entries = Object.entries(changes as Record<string, { from: unknown; to: unknown }>);
  if (entries.length === 0) return "—";
  return entries
    .map(([field, diff]) => {
      if (diff && typeof diff === "object" && "from" in diff && "to" in diff) {
        return `${field}: ${String(diff.from)} → ${String(diff.to)}`;
      }
      return `${field}: ${JSON.stringify(diff)}`;
    })
    .join("; ");
}
