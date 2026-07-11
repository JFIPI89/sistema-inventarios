import Link from "next/link";
import { getCreditPlans, getCreditDashboard, getCreditOperationalReport, syncOverdueInstallments } from "@/actions/credit";
import { getCustomerCreditProfile } from "@/actions/credit";
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
import { Plus } from "lucide-react";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { CREDIT_PLAN_STATUS_LABELS } from "@/lib/credit-labels";
import type { CreditPlanStatus } from "@prisma/client";
import { CreditTabs, type CreditView } from "@/components/credit/credit-tabs";
import { CreditDashboard } from "@/components/credit/credit-dashboard";
import { CreditReportsView } from "@/components/credit/credit-reports-view";
import { CreditRatingBadge } from "@/components/credit/credit-rating-badge";
import { defaultDateRangeDays } from "@/lib/timezone";
import { LiveSearchFilter } from "@/components/ui/live-search-filter";
import { suggestCreditPlans } from "@/actions/suggest";

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

function defaultReportDates() {
  return defaultDateRangeDays(30);
}

function parseView(view?: string): CreditView {
  if (view === "planes" || view === "reportes") return view;
  return "dashboard";
}

export default async function CreditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; view?: string; start?: string; end?: string }>;
}) {
  const { q, status, view: viewParam, start, end } = await searchParams;
  const view = parseView(viewParam);
  await syncOverdueInstallments();

  const planStatus =
    status === "ACTIVE" || status === "PAID" || status === "CANCELLED"
      ? (status as CreditPlanStatus)
      : undefined;

  const defaults = defaultReportDates();
  const startDate = start || defaults.start;
  const endDate = end || defaults.end;

  const [dashboard, plans, report] = await Promise.all([
    view === "dashboard" ? getCreditDashboard() : Promise.resolve(null),
    view === "planes" ? getCreditPlans(q, planStatus) : Promise.resolve([]),
    view === "reportes" ? getCreditOperationalReport(startDate, endDate) : Promise.resolve(null),
  ]);

  const customerIds =
    view === "planes" ? [...new Set(plans.map((p) => p.customerId))] : [];
  const profiles = await Promise.all(
    customerIds.map(async (id) => ({ id, profile: await getCustomerCreditProfile(id) }))
  );
  const profileMap = new Map(profiles.map((p) => [p.id, p.profile]));

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

      <CreditTabs activeView={view} q={q} status={status} />

      {view === "dashboard" && dashboard && <CreditDashboard data={dashboard} />}

      {view === "reportes" && report && (
        <CreditReportsView credit={report} startDate={startDate} endDate={endDate} />
      )}

      {view === "planes" && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start">
            <LiveSearchFilter
              basePath="/credit"
              hrefPrefix="/credit"
              initialQuery={q}
              preserveParams={{ view: "planes", status }}
              placeholder="Buscar plan o cliente..."
              fetchSuggestions={suggestCreditPlans}
              className="flex-1"
            />
            <form className="flex flex-wrap gap-2">
              <input type="hidden" name="view" value="planes" />
              {q ? <input type="hidden" name="q" value={q} /> : null}
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
                Filtrar
              </Button>
            </form>
          </div>

          <div className="rounded-lg border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Calificación</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pagado</TableHead>
                  <TableHead>Pendiente</TableHead>
                  <TableHead>Disponible</TableHead>
                  <TableHead>Próxima cuota</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      Sin planes de cartera
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => {
                    const paid = planPaidCents(plan.installments);
                    const pending = plan.totalCents - paid;
                    const next = nextDueInstallment(plan.installments);
                    const profile = profileMap.get(plan.customerId);
                    return (
                      <TableRow key={plan.id}>
                        <TableCell className="font-mono">{plan.planNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p>{plan.customer.name}</p>
                            <p className="text-xs text-muted-foreground">{plan.customer.code}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {profile ? (
                            <CreditRatingBadge rating={profile.rating} label={profile.ratingLabel} />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{formatCents(plan.totalCents)}</TableCell>
                        <TableCell>{formatCents(paid)}</TableCell>
                        <TableCell>{formatCents(pending)}</TableCell>
                        <TableCell className="text-sm">
                          {profile?.limitCents != null ? (
                            formatCents(profile.availableCents ?? 0)
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
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
                          <Link
                            href={`/credit/${plan.id}`}
                            className="text-sm text-primary hover:underline"
                          >
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
        </>
      )}
    </div>
  );
}
