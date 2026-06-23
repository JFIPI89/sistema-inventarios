import Link from "next/link";
import { getCreditPlans, syncOverdueInstallments } from "@/actions/credit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import {
  CREDIT_PLAN_STATUS_LABELS,
} from "@/lib/credit-labels";
import type { CreditPlanStatus } from "@prisma/client";

function planPaidCents(installments: { paidCents: number }[]) {
  return installments.reduce((s, i) => s + i.paidCents, 0);
}

function nextDueInstallment(
  installments: { dueDate: Date; status: string; number: number }[]
) {
  const open = installments
    .filter((i) => i.status !== "PAID")
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  return open[0];
}

export default async function CreditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  await syncOverdueInstallments();

  const planStatus =
    status === "ACTIVE" || status === "PAID" || status === "CANCELLED"
      ? (status as CreditPlanStatus)
      : undefined;

  const plans = await getCreditPlans(q, planStatus);

  return (
    <div className="space-y-6">
      <PageHeader title="Cartera" description="Crédito multi-plazo sin interés">
        <Link href="/credit/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nueva cartera
          </Button>
        </Link>
      </PageHeader>

      <form className="app-search-form flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Buscar plan o cliente..." className="flex-1" />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activos</option>
          <option value="PAID">Pagados</option>
          <option value="CANCELLED">Cancelados</option>
        </select>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      <div className="rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Pagado</TableHead>
              <TableHead>Pendiente</TableHead>
              <TableHead>Próxima cuota</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Sin planes de cartera
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => {
                const paid = planPaidCents(plan.installments);
                const pending = plan.totalCents - paid;
                const next = nextDueInstallment(plan.installments);
                return (
                  <TableRow key={plan.id}>
                    <TableCell className="font-mono">{plan.planNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p>{plan.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{plan.customer.code}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatCents(plan.totalCents)}</TableCell>
                    <TableCell>{formatCents(paid)}</TableCell>
                    <TableCell>{formatCents(pending)}</TableCell>
                    <TableCell>
                      {next ? (
                        <span className="text-sm">
                          #{next.number} — {formatDate(next.dueDate)}
                          {next.status === "OVERDUE" && (
                            <Badge variant="destructive" className="ml-2">
                              Vencida
                            </Badge>
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          plan.status === "PAID"
                            ? "success"
                            : plan.status === "CANCELLED"
                              ? "secondary"
                              : "default"
                        }
                      >
                        {CREDIT_PLAN_STATUS_LABELS[plan.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/credit/${plan.id}`} className="text-sm text-primary hover:underline">
                        Detalle
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
