"use client";

import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
import type { CreditReport } from "@/actions/reports";
import { formatCents } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/lib/credit-labels";
import type { PaymentMethod } from "@prisma/client";
import { CreditRatingBadge } from "@/components/credit/credit-rating-badge";
import type { AgingBuckets } from "@/lib/credit-metrics";

const AGING_ROWS: { key: keyof AgingBuckets; label: string }[] = [
  { key: "alDia", label: "Al día" },
  { key: "vencido_1_7", label: "1–7 días vencido" },
  { key: "vencido_8_30", label: "8–30 días vencido" },
  { key: "vencido_31_60", label: "31–60 días vencido" },
  { key: "vencido_60_plus", label: "Más de 60 días" },
];

export function CreditReportsClient({
  credit,
  startDate,
  endDate,
  showAdminLink = true,
}: {
  credit: CreditReport;
  startDate: string;
  endDate: string;
  showAdminLink?: boolean;
}) {
  const { summary } = credit;
  const chartData = credit.collectionsChart.map((d) => ({
    date: d.date.slice(5),
    total: d.totalCents / 100,
    count: d.count,
  }));

  return (
    <div className="space-y-6">
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle>
            Resumen de cartera ({startDate} — {endDate})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Saldos y vencimientos al día de hoy; cobros y altas filtrados por el período seleccionado.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Cartera activa</p>
              <p className="text-xl font-bold">{formatCents(summary.totalPortfolioCents)}</p>
              <p className="text-xs text-muted-foreground">{summary.activePlans} planes</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Saldo pendiente</p>
              <p className="text-xl font-bold text-warning">
                {formatCents(summary.totalOutstandingCents)}
              </p>
              <p className="text-xs text-muted-foreground">
                Recuperación {summary.collectionRatePercent}%
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Cobrado en período</p>
              <p className="text-xl font-bold text-success">
                {formatCents(summary.collectedInPeriodCents)}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.paymentsInPeriodCount} abonos
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Cuotas vencidas</p>
              <p className="text-xl font-bold text-destructive">
                {formatCents(summary.overdueAmountCents)}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.overdueInstallmentsCount} cuotas · 7d: {formatCents(summary.dueNext7Cents)}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-background p-4 text-sm">
              <span className="text-muted-foreground">Nuevos planes en período:</span>{" "}
              <span className="font-medium">{summary.newPlansInPeriod}</span>
              {" · "}
              <span className="font-medium">{formatCents(summary.newPlansAmountCents)}</span>
            </div>
            {showAdminLink && (
              <div className="rounded-lg border border-border bg-background p-4 text-sm">
                <Link href="/credit" className="text-primary hover:underline">
                  Ir a gestión de cartera →
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Antigüedad de saldos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bucket</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {AGING_ROWS.map(({ key, label }) => (
                  <TableRow key={key}>
                    <TableCell>{label}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCents(credit.agingBuckets[key])}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cobros por día</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin cobros en el período</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatCents(Math.round(Number(v) * 100))} />
                    <Bar dataKey="total" fill="var(--gold)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calificación de cartera por cliente</CardTitle>
        </CardHeader>
        <CardContent>
          {credit.byCustomer.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin cartera activa</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Calificación</TableHead>
                  <TableHead>Tope</TableHead>
                  <TableHead>Usado</TableHead>
                  <TableHead>Disponible</TableHead>
                  <TableHead>Vencido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credit.byCustomer.slice(0, 20).map((c) => (
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
                    <TableCell>
                      {c.creditLimitCents != null ? formatCents(c.creditLimitCents) : "—"}
                    </TableCell>
                    <TableCell>{formatCents(c.outstandingCents)}</TableCell>
                    <TableCell>
                      {c.availableCents != null ? formatCents(c.availableCents) : "—"}
                    </TableCell>
                    <TableCell>
                      {c.overdueCents > 0 ? (
                        <Badge variant="destructive">{formatCents(c.overdueCents)}</Badge>
                      ) : (
                        "—"
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
            <CardTitle>Cuotas vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            {credit.overdueInstallments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin cuotas vencidas</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Cuota</TableHead>
                    <TableHead>Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credit.overdueInstallments.slice(0, 15).map((i) => (
                    <TableRow key={`${i.planId}-${i.installmentNumber}`}>
                      <TableCell>
                        <Link
                          href={`/credit/${i.planId}`}
                          className="font-mono text-primary hover:underline"
                        >
                          {i.planNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{i.customerName}</TableCell>
                      <TableCell className="text-sm">
                        #{i.installmentNumber}
                        <br />
                        <span className="text-muted-foreground">{formatDate(i.dueDate)}</span>
                      </TableCell>
                      <TableCell>{formatCents(i.remainingCents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cuotas por vencer en período</CardTitle>
          </CardHeader>
          <CardContent>
            {credit.upcomingInstallments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin vencimientos en el rango</p>
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
                  {credit.upcomingInstallments.slice(0, 15).map((i) => (
                    <TableRow key={`${i.planId}-${i.installmentNumber}`}>
                      <TableCell>
                        <Link
                          href={`/credit/${i.planId}`}
                          className="font-mono text-primary hover:underline"
                        >
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
          <CardTitle>Abonos del período</CardTitle>
        </CardHeader>
        <CardContent>
          {credit.paymentsInPeriod.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin abonos en el rango seleccionado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cuota</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credit.paymentsInPeriod.map((p, idx) => (
                  <TableRow key={`${p.planNumber}-${p.installmentNumber}-${idx}`}>
                    <TableCell className="text-sm">{formatDateTime(p.paidAt)}</TableCell>
                    <TableCell className="font-mono text-sm">{p.planNumber}</TableCell>
                    <TableCell>{p.customerName}</TableCell>
                    <TableCell>#{p.installmentNumber}</TableCell>
                    <TableCell>{formatCents(p.amountCents)}</TableCell>
                    <TableCell>
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
