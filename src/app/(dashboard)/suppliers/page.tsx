import Link from "next/link";
import { getSuppliers } from "@/actions/suppliers";
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

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const suppliers = await getSuppliers(q);

  return (
    <div className="space-y-6">
      <PageHeader title="Proveedores" description="Gestión de proveedores para entradas de stock">
        <Link href="/suppliers/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo proveedor
          </Button>
        </Link>
      </PageHeader>

      <form className="app-search-form">
        <Input name="q" defaultValue={q} placeholder="Buscar proveedor..." className="flex-1" />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      <div className="rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Lotes asociados</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s._count.lots}</TableCell>
                <TableCell>
                  <Link href={`/suppliers/${s.id}`} className="text-sm text-primary hover:underline">
                    Editar
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
