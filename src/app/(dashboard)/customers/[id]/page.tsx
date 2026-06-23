import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomer, updateCustomer } from "@/actions/sales";
import { getCustomerCreditSummary, getCustomerCreditPlans, getCustomerCreditProfile } from "@/actions/credit";
import { CustomerForm } from "@/components/customers/customer-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatCents } from "@/lib/money";
import { CREDIT_PLAN_STATUS_LABELS } from "@/lib/credit-labels";
import { PageHeader } from "@/components/layout/page-header";
import { CreditRatingBadge } from "@/components/credit/credit-rating-badge";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const [creditSummary, customerPlans, creditProfile, session] = await Promise.all([
    getCustomerCreditSummary(id),
    getCustomerCreditPlans(id),
    getCustomerCreditProfile(id),
    getSession(),
  ]);

  const updateAction = updateCustomer.bind(null, id);
  const isAdmin = session?.role === Role.ADMIN;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={customer.name} description={customer.code}>
        <Link href="/customers">
          <Button variant="outline">Volver</Button>
        </Link>
      </PageHeader>
      <CustomerForm action={updateAction} customer={customer} isAdmin={isAdmin} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cartera</CardTitle>
          <Link href="/credit/new">
            <Button size="sm" variant="outline">
              Nueva cartera
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {creditProfile && (
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
              <CreditRatingBadge rating={creditProfile.rating} label={creditProfile.ratingLabel} />
              <span className="text-muted-foreground">
                Puntualidad: {creditProfile.onTimePercent}%
              </span>
              {creditProfile.limitCents != null ? (
                <>
                  <span>
                    Tope: <span className="font-medium">{formatCents(creditProfile.limitCents)}</span>
                  </span>
                  <span>
                    Usado: <span className="font-medium">{formatCents(creditProfile.outstandingCents)}</span>
                  </span>
                  <span>
                    Disponible:{" "}
                    <span className="font-medium text-success">
                      {formatCents(creditProfile.availableCents ?? 0)}
                    </span>
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">Sin tope de crédito</span>
              )}
            </div>
          )}
          <p>
            <span className="text-muted-foreground">Planes activos:</span> {creditSummary.activePlans}
          </p>
          <p>
            <span className="text-muted-foreground">Saldo pendiente:</span>{" "}
            <span className="font-medium">{formatCents(creditSummary.pendingCents)}</span>
          </p>
          {customerPlans.length === 0 ? (
            <p className="text-muted-foreground">Sin planes de cartera</p>
          ) : (
            <ul className="space-y-2">
              {customerPlans.map((plan) => {
                const paid = plan.installments.reduce((s, i) => s + i.paidCents, 0);
                return (
                  <li key={plan.id} className="flex items-center justify-between gap-2">
                    <Link href={`/credit/${plan.id}`} className="text-primary hover:underline">
                      {plan.planNumber}
                    </Link>
                    <span className="text-muted-foreground">
                      {formatCents(plan.totalCents - paid)} pendiente
                    </span>
                    <Badge variant="secondary">{CREDIT_PLAN_STATUS_LABELS[plan.status]}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de compras</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.sales.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin compras registradas</p>
          ) : (
            <ul className="space-y-2">
              {customer.sales.map((sale) => (
                <li key={sale.id} className="flex justify-between text-sm">
                  <Link href={`/sales/${sale.id}`} className="text-primary hover:underline">
                    {sale.saleNumber}
                  </Link>
                  <span>{formatDate(sale.saleDate)} — {formatCurrency(sale.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
