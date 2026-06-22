import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomer, updateCustomer } from "@/actions/sales";
import { CustomerForm } from "@/components/customers/customer-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const updateAction = updateCustomer.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={customer.name} description={customer.code}>
        <Link href="/customers">
          <Button variant="outline">Volver</Button>
        </Link>
      </PageHeader>
      <CustomerForm action={updateAction} customer={customer} />
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
