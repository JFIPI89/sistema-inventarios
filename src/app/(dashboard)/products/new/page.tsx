import Link from "next/link";
import { getCategories } from "@/actions/inventory";
import { createProduct } from "@/actions/inventory";
import { ProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Nuevo producto" description="Registra un producto con campos GS1">
        <Link href="/products">
          <Button variant="outline">Volver</Button>
        </Link>
      </PageHeader>
      <ProductForm categories={categories} action={createProduct} />
    </div>
  );
}
