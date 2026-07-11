import Link from "next/link";
import { getProducts } from "@/actions/inventory";
import { suggestProducts } from "@/actions/suggest";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LiveSearchFilter } from "@/components/ui/live-search-filter";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const products = await getProducts(q);

  return (
    <div className="space-y-6">
      <PageHeader title="Productos" description="Catálogo con SKU, GTIN (AI 01) y marca">
        <Link href="/products/import">
          <Button variant="outline">Importar CSV</Button>
        </Link>
        <Link href="/products/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Button>
        </Link>
      </PageHeader>

      <div className="app-search-form">
        <LiveSearchFilter
          basePath="/products"
          hrefPrefix="/products"
          initialQuery={q}
          placeholder="Buscar SKU, GTIN, marca..."
          fetchSuggestions={suggestProducts}
          className="flex-1"
        />
      </div>

      <div className="rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>GTIN</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Precio costo</TableHead>
              <TableHead>Precio venta</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => {
              const stock = p.lots.reduce((s, l) => s + l.quantity, 0);
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                  <TableCell className="font-mono text-xs">{p.gtin || "—"}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.brand || "—"}</TableCell>
                  <TableCell>{p.category?.name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={stock <= p.minStock ? "warning" : "success"}>{stock}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(p.costPrice)}</TableCell>
                  <TableCell>{formatCurrency(p.salePrice)}</TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? "success" : "secondary"}>
                      {p.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Link href={`/products/${p.id}`} className="text-sm text-primary hover:underline">
                      Editar
                    </Link>
                    <Link
                      href={`/lots/new?productId=${p.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Entrada stock
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
