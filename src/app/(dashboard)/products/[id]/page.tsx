import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getCategories, updateProduct } from "@/actions/inventory";
import { ProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getProduct(id), getCategories()]);
  if (!product) notFound();

  const updateAction = updateProduct.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Editar producto" description={product.sku}>
        <Link href={`/lots/new?productId=${id}`}>
          <Button>Entrada de stock</Button>
        </Link>
        <Link href={`/stock/history?productId=${id}`}>
          <Button variant="outline">Movimientos</Button>
        </Link>
        <Link href="/products">
          <Button variant="outline">Volver</Button>
        </Link>
      </PageHeader>
      <ProductForm categories={categories} action={updateAction} product={product} />
    </div>
  );
}
