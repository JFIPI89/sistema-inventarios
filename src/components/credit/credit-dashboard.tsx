import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { CreditDashboardData } from "@/actions/credit";
import { formatCents } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/utils";
import { CreditRatingBadge } from "@/components/credit/credit-rating-badge";
import { PAYMENT_METHOD_LABELS } from "@/lib/credit-labels";
import type { PaymentMethod } from "@prisma/client";
import type { AgingBuckets } from "@/lib/credit-metrics";

const AGING_LABELS: { key: keyof AgingBuckets; label: string }[] = [
  { key: "alDia", label: "Al día" },
  { key: "vencido_1_7", label: "1–7 días vencido" },
  { key: "vencido_8_30", label: "8–30 días vencido" },
  { key: "vencido_31_60", label: "31–60 días vencido" },
  { key: "vencido_60_plus", label: "Más de 60 días" },
];

function AgingBar({ buckets }: { buckets: AgingBuckets }) {
  const total = Object.values(buckets).reduce((s, v) => s + v, 0);
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Sin saldos abiertos</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {AGING_LABELS.map(({ key, label }) => {
          const pct = (buckets[key] / total) * 100;
          if (pct <= 0) return null;
          const color =
            key === "alDia"
              ? "bg-success"
              : key === "vencido_1_7"
                ? "bg-warning"
                : key === "vencido_8_30"
                  ? "bg-orange-500"
                  : "bg-destructive";
          return (
            <div
              key={key}
              className={color}
              style={{ width: `${pct}%` }}
              title={`${label}: ${formatCents(buckets[key])}`}
            />
          );
        })}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {AGING_LABELS.map(({ key, label }) => (
          <div key={key} className="rounded-md border border-border px-3 py-2 text-sm">
            <p className="text-muted-foreground">{label}</p>
            <p className="font-medium">{formatCents(buckets[key])}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CreditDashboard({ data }: { data: CreditDashboardData }) {
  const { summary } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cartera activa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCents(summary.totalPortfolioCents)}</p>
            <p className="text-xs text-muted-foreground">{summary.activePlans} planes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">{formatCents(summary.totalOutstandingCents)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de recuperación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{summary.collectionRatePercent}%</p>
            <p className="text-xs text-muted-foreground">
              Cobrado {formatCents(summary.totalCollectedCents)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vencido / próximos 7 días</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatCents(summary.overdueAmountCents)}</p>
            <p className="text-xs text-muted-foreground">
              Por cobrar 7d: {formatCents(summary.dueNext7Cents)} · 30d: {formatCents(summary.dueNext30Cents)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Antigüedad de saldos</CardTitle>
        </CardHeader>
        <CardContent>
          <AgingBar buckets={data.agingBuckets} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clientes con mayor exposición</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin cartera activa</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Calificación</TableHead>
                  <TableHead>Pendiente</TableHead>
                  <TableHead>Tope / disponible</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topCustomers.map((c) => (
                  <TableRow key={c.customerId}>
                    <TableCell>
                      <div>
                        <p>{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <CreditRatingBadge rating={c.rating} label={c.ratingLabel} />
                    </TableCell>
                    <TableCell>{formatCents(c.outstandingCents)}</TableCell>
                    <TableCell className="text-sm">
                      {c.creditLimitCents != null ? (
                        <>
                          {formatCents(c.creditLimitCents)} /{" "}
                          <span className="text-success">{formatCents(c.availableCents ?? 0)}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Sin tope</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cuotas vencidas (prioridad)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.overdueInstallments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin cuotas vencidas</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.overdueInstallments.map((i) => (
                    <TableRow key={`${i.planId}-${i.installmentNumber}`}>
                      <TableCell>
                        <Link href={`/credit/${i.planId}`} className="font-mono text-primary hover:underline">
                          {i.planNumber}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          #{i.installmentNumber} · {formatDate(i.dueDate)}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">{i.customerName}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{formatCents(i.remainingCents)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos vencimientos (7 días)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingInstallments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin vencimientos próximos</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Vence</TableHead>
                    <TableHead>Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.upcomingInstallments.map((i) => (
                    <TableRow key={`${i.planId}-${i.installmentNumber}`}>
                      <TableCell>
                        <Link href={`/credit/${i.planId}`} className="font-mono text-primary hover:underline">
                          {i.planNumber}
                        </Link>
                        <p className="text-xs text-muted-foreground">{i.customerName}</p>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(i.dueDate)}</TableCell>
                      <TableCell>{formatCents(i.remainingCents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos abonos</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin abonos registrados</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentPayments.map((p, idx) => (
                  <TableRow key={`${p.planNumber}-${idx}`}>
                    <TableCell className="text-sm">{formatDateTime(p.paidAt)}</TableCell>
                    <TableCell className="font-mono text-sm">{p.planNumber}</TableCell>
                    <TableCell>{formatCents(p.amountCents)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {PAYMENT_METHOD_LABELS[p.paymentMethod as PaymentMethod]}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
