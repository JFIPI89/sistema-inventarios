import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupplier, updateSupplier } from "@/actions/suppliers";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await getSupplier(id);
  if (!supplier) notFound();

  const updateAction = updateSupplier.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Editar proveedor">
        <Link href="/suppliers">
          <Button variant="outline">Volver</Button>
        </Link>
      </PageHeader>
      <SupplierForm action={updateAction} supplier={supplier} />
      {supplier.lots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lotes recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {supplier.lots.map((lot) => (
                <li key={lot.id} className="flex justify-between">
                  <Link href={`/lots/${lot.id}`} className="text-primary hover:underline">
                    {lot.product.sku} — {lot.lotNumber}
                  </Link>
                  <span className="text-muted-foreground">
                    {lot.quantity} pzas · {formatDate(lot.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
