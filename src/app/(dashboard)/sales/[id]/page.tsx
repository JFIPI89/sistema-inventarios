import Link from "next/link";
import { notFound } from "next/navigation";
import { getSale } from "@/actions/sales";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SALE_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/credit-labels";
import { CancelSaleButton } from "@/components/sales/cancel-sale-button";
import { EditSaleForm } from "@/components/sales/edit-sale-form";
import { PageHeader } from "@/components/layout/page-header";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sale = await getSale(id);
  if (!sale) notFound();

  const creditLocked =
    sale.creditPlan?.installments.some(
      (inst) => inst.paidCents > 0 || inst._count.payments > 0
    ) ?? false;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={sale.saleNumber} description={formatDate(sale.saleDate)}>
        <a href={`/api/sales/${sale.id}/pdf`}>
          <Button variant="outline">Descargar PDF</Button>
        </a>
        <Link href="/sales">
          <Button variant="outline">Volver</Button>
        </Link>
      </PageHeader>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detalle</CardTitle>
          <Badge variant={sale.status === "COMPLETED" ? "success" : "destructive"}>
            {sale.status === "COMPLETED" ? "Completada" : "Cancelada"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Cliente:</span>{" "}
            {sale.customer?.name || "Mostrador"}
          </p>
          <p>
            <span className="text-muted-foreground">Vendedor:</span> {sale.user.name}
          </p>
          <p>
            <span className="text-muted-foreground">Tipo:</span>{" "}
            <Badge variant={sale.saleType === "CREDITO" ? "default" : "secondary"}>
              {SALE_TYPE_LABELS[sale.saleType]}
            </Badge>
          </p>
          <p>
            <span className="text-muted-foreground">Pago:</span>{" "}
            {PAYMENT_METHOD_LABELS[sale.paymentMethod]}
          </p>
          <p>
            <span className="text-muted-foreground">Descuento:</span>{" "}
            {formatCurrency(sale.discount)}
          </p>
          {sale.creditPlan && (
            <p>
              <span className="text-muted-foreground">Cartera:</span>{" "}
              <Link href={`/credit/${sale.creditPlan.id}`} className="text-primary hover:underline">
                {sale.creditPlan.planNumber}
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Lote</TableHead>
              <TableHead>Cant.</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sale.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.product.name}</TableCell>
                <TableCell className="font-mono">{item.lot.lotNumber}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                <TableCell>{formatCurrency(item.lineTotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xl font-bold">Total: {formatCurrency(sale.total)}</p>
        {sale.status === "COMPLETED" && <CancelSaleButton saleId={sale.id} />}
      </div>

      {sale.status === "COMPLETED" && (
        <EditSaleForm
          saleId={sale.id}
          saleType={sale.saleType}
          discount={sale.discount}
          paymentMethod={sale.paymentMethod}
          lockedReason={
            creditLocked
              ? "Esta venta a crédito tiene abonos: no se puede editar hasta anular los abonos en Cartera."
              : null
          }
          items={sale.items.map((item) => ({
            id: item.id,
            productName: item.product.name,
            lotNumber: item.lot.lotNumber,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            availableStock: item.lot.quantity,
          }))}
        />
      )}
    </div>
  );
}
