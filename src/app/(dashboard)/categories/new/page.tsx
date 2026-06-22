import Link from "next/link";
import { getCategoriesForSelect, createCategory } from "@/actions/categories";
import { CategoryForm } from "@/components/categories/category-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

export default async function NewCategoryPage() {
  const categories = await getCategoriesForSelect();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Nueva categoría" description="Alta de categoría de producto">
        <Link href="/categories">
          <Button variant="outline">Volver</Button>
        </Link>
      </PageHeader>
      <CategoryForm action={createCategory} categories={categories} />
    </div>
  );
}
