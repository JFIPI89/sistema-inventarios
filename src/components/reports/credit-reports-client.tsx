"use client";

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
import type { CreditReport } from "@/actions/reports";
import { formatCents } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/lib/credit-labels";
import type { PaymentMethod } from "@prisma/client";

export function CreditReportsClient({
  credit,
  startDate,
  endDate,
}: {
  credit: CreditReport;
  startDate: string;
  endDate: string;
}) {
  const { summary } = credit;

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
                {summary.overdueInstallmentsCount} cuotas
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
            <div className="rounded-lg border border-border bg-background p-4 text-sm">
              <Link href="/credit" className="text-primary hover:underline">
                Ir a gestión de cartera →
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Saldo por cliente</CardTitle>
          </CardHeader>
          <CardContent>
            {credit.byCustomer.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin cartera activa</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Planes</TableHead>
                    <TableHead>Pendiente</TableHead>
                    <TableHead>Vencido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credit.byCustomer.slice(0, 15).map((c) => (
                    <TableRow key={c.customerId}>
                      <TableCell>
                        <div>
                          <p>{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>{c.activePlans}</TableCell>
                      <TableCell>{formatCents(c.outstandingCents)}</TableCell>
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
                        <Link href={`/credit/${i.planId}`} className="font-mono text-primary hover:underline">
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
