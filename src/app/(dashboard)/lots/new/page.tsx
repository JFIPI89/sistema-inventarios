import Link from "next/link";
import { getProducts, createLot } from "@/actions/inventory";
import { getSuppliers } from "@/actions/suppliers";
import { LotForm } from "@/components/lots/lot-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

export default async function NewLotPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>;
}) {
  const { productId } = await searchParams;
  const [products, suppliers] = await Promise.all([getProducts(), getSuppliers()]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Entrada de stock" description="Registrar lote con fechas GS1">
        <Link href="/lots">
          <Button variant="outline">Volver</Button>
        </Link>
      </PageHeader>
      <LotForm
        products={products}
        suppliers={suppliers}
        action={createLot}
        defaultProductId={productId}
      />
    </div>
  );
}
