import Link from "next/link";
import { getCategoriesList } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const categories = await getCategoriesList(q);

  return (
    <div className="space-y-6">
      <PageHeader title="Categorías" description="Organiza el catálogo de productos">
        <Link href="/categories/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nueva categoría
          </Button>
        </Link>
      </PageHeader>

      <form className="app-search-form">
        <Input name="q" defaultValue={q} placeholder="Buscar categoría..." className="flex-1" />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      <div className="rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría padre</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Subcategorías</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No hay categorías registradas
                </TableCell>
              </TableRow>
            ) : (
              categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.parent?.name || "—"}</TableCell>
                  <TableCell>{c._count.products}</TableCell>
                  <TableCell>{c._count.children}</TableCell>
                  <TableCell>
                    <Link href={`/categories/${c.id}`} className="text-sm text-primary hover:underline">
                      Editar
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
