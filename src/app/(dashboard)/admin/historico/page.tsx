import { getAuditLogs } from "@/actions/audit-log";
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS } from "@/lib/audit";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { formatAuditChanges } from "@/lib/audit";
import { formatDateTime } from "@/lib/utils";
import type { AuditAction } from "@prisma/client";

const ENTITY_TYPES = Object.keys(AUDIT_ENTITY_LABELS);

export default async function AuditHistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    entityType?: string;
    action?: AuditAction;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const params = await searchParams;
  const logs = await getAuditLogs({
    search: params.q,
    entityType: params.entityType,
    action: params.action,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico"
        description="Auditoría de acciones: quién modificó qué y cuándo (solo administrador)"
      />

      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
        <div className="space-y-1 lg:min-w-[200px]">
          <label className="text-sm font-medium">Buscar</label>
          <Input name="q" defaultValue={params.q} placeholder="Usuario, resumen, entidad..." />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Desde</label>
          <Input name="dateFrom" type="date" defaultValue={params.dateFrom} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Hasta</label>
          <Input name="dateTo" type="date" defaultValue={params.dateTo} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Entidad</label>
          <select
            name="entityType"
            defaultValue={params.entityType || ""}
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          >
            <option value="">Todas</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {AUDIT_ENTITY_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Acción</label>
          <select
            name="action"
            defaultValue={params.action || ""}
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          >
            <option value="">Todas</option>
            {(Object.keys(AUDIT_ACTION_LABELS) as AuditAction[]).map((a) => (
              <option key={a} value={a}>
                {AUDIT_ACTION_LABELS[a]}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary" className="w-full sm:w-auto">
          Filtrar
        </Button>
      </form>

      <div className="rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Resumen</TableHead>
              <TableHead>Cambios</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Sin registros de auditoría
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{log.userName}</div>
                    {log.userEmail && (
                      <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{log.actionLabel}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{log.entityTypeLabel}</div>
                    {log.entityLabel && (
                      <div className="font-mono text-xs text-muted-foreground">{log.entityLabel}</div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs text-sm">{log.summary}</TableCell>
                  <TableCell className="max-w-md text-xs text-muted-foreground">
                    {formatAuditChanges(log.changes)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
