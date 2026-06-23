import Link from "next/link";
import { notFound } from "next/navigation";
import { getCreditPlan } from "@/actions/credit";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { formatCents } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  CREDIT_INSTALLMENT_STATUS_LABELS,
  CREDIT_PERIOD_LABELS,
  CREDIT_PLAN_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/credit-labels";
import { CreditPaymentForm } from "@/components/credit/credit-payment-form";
import { CancelCreditPlanButton } from "@/components/credit/cancel-credit-plan-button";

export default async function CreditPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [plan, session] = await Promise.all([getCreditPlan(id), getSession()]);
  if (!plan) notFound();

  const paidCents = plan.installments.reduce((s, i) => s + i.paidCents, 0);
  const pendingCents = plan.totalCents - paidCents;
  const isAdmin = session?.role === Role.ADMIN;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={plan.planNumber} description={plan.customer.name}>
        <Link href="/credit">
          <Button variant="outline">Volver</Button>
        </Link>
      </PageHeader>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Resumen</CardTitle>
          <Badge
            variant={
              plan.status === "PAID" ? "success" : plan.status === "CANCELLED" ? "secondary" : "default"
            }
          >
            {CREDIT_PLAN_STATUS_LABELS[plan.status]}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Cliente:</span> {plan.customer.code} —{" "}
            {plan.customer.name}
          </p>
          <p>
            <span className="text-muted-foreground">Cuotas:</span> {plan.installmentCount} (
            {CREDIT_PERIOD_LABELS[plan.periodUnit].toLowerCase()})
          </p>
          <p>
            <span className="text-muted-foreground">Inicio:</span> {formatDate(plan.startDate)}
          </p>
          <p>
            <span className="text-muted-foreground">Total:</span> {formatCents(plan.totalCents)}
          </p>
          <p>
            <span className="text-muted-foreground">Pagado:</span> {formatCents(paidCents)}
          </p>
          <p>
            <span className="text-muted-foreground">Pendiente:</span> {formatCents(pendingCents)}
          </p>
          {plan.sale && (
            <p>
              <span className="text-muted-foreground">Venta:</span>{" "}
              <Link href={`/sales/${plan.sale.id}`} className="text-primary hover:underline">
                {plan.sale.saleNumber}
              </Link>
            </p>
          )}
          {plan.notes && (
            <p>
              <span className="text-muted-foreground">Notas:</span> {plan.notes}
            </p>
          )}
          {isAdmin && plan.status === "ACTIVE" && (
            <div className="pt-2">
              <CancelCreditPlanButton planId={plan.id} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cuotas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan.installments.map((inst) => {
            const remaining = inst.amountCents - inst.paidCents;
            return (
              <div key={inst.id} className="rounded-md border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">Cuota {inst.number}</p>
                    <p className="text-sm text-muted-foreground">Vence: {formatDate(inst.dueDate)}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{formatCents(inst.amountCents)}</p>
                    <Badge
                      variant={
                        inst.status === "PAID"
                          ? "success"
                          : inst.status === "OVERDUE"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {CREDIT_INSTALLMENT_STATUS_LABELS[inst.status]}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Abonado: {formatCents(inst.paidCents)} · Saldo: {formatCents(remaining)}
                </p>
                {inst.payments.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {inst.payments.map((p) => (
                      <li key={p.id}>
                        {formatDateTime(p.paidAt)} — {formatCents(p.amountCents)} (
                        {PAYMENT_METHOD_LABELS[p.paymentMethod]}) — {p.user.name}
                      </li>
                    ))}
                  </ul>
                )}
                {plan.status === "ACTIVE" && remaining > 0 && (
                  <CreditPaymentForm
                    installmentId={inst.id}
                    remainingCents={remaining}
                    installmentNumber={inst.number}
                  />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
