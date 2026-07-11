import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { adjustLotStock, receiveLotStock } from "@/actions/inventory";
import { LotAdjustForm } from "@/components/lots/lot-adjust-form";
import { LotReceiveForm } from "@/components/lots/lot-receive-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";

export default async function LotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lot = await prisma.lot.findUnique({
    where: { id },
    include: { product: true, supplier: true },
  });
  if (!lot) notFound();

  const adjustAction = adjustLotStock.bind(null, id);
  const receiveAction = receiveLotStock.bind(null, id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Gestión de lote"
        description={`${lot.product.name} — Lote ${lot.lotNumber}`}
      >
        <Link href={`/stock/history?lotId=${lot.id}`}>
          <Button variant="outline" size="sm">
            Ver movimientos
          </Button>
        </Link>
        <Link href="/lots">
          <Button variant="outline">Volver</Button>
        </Link>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Detalle del lote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Stock actual:</span> {lot.quantity}
          </p>
          <p>
            <span className="text-muted-foreground">Precio costo:</span>{" "}
            {formatCurrency(lot.product.costPrice)}
          </p>
          <p>
            <span className="text-muted-foreground">Precio venta:</span>{" "}
            {formatCurrency(lot.product.salePrice)}
          </p>
          <p>
            <span className="text-muted-foreground">Proveedor:</span> {lot.supplier?.name || "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Vencimiento:</span>{" "}
            {formatDate(lot.expirationDate)}
          </p>
          <p>
            <span className="text-muted-foreground">Ubicación:</span> {lot.location || "—"}
          </p>
        </CardContent>
      </Card>
      <LotReceiveForm
        action={receiveAction}
        currentQty={lot.quantity}
        costPrice={lot.product.costPrice}
        salePrice={lot.product.salePrice}
      />
      <LotAdjustForm action={adjustAction} currentQty={lot.quantity} />
    </div>
  );
}
