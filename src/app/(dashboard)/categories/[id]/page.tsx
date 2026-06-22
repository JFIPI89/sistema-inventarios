import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, getCategoriesForSelect } from "@/actions/categories";
import { CategoryForm, bindUpdateCategory } from "@/components/categories/category-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, categories] = await Promise.all([
    getCategory(id),
    getCategoriesForSelect(id),
  ]);

  if (!category) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Editar categoría" description={category.name}>
        <Link href="/categories">
          <Button variant="outline">Volver</Button>
        </Link>
      </PageHeader>
      <CategoryForm
        action={bindUpdateCategory(id)}
        category={{ name: category.name, parentId: category.parentId }}
        categories={categories}
        categoryId={id}
      />
    </div>
  );
}
