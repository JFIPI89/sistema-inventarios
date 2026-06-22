import Link from "next/link";
import { getCustomers } from "@/actions/sales";
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
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const customers = await getCustomers(q);

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description="Registro de clientes y datos fiscales">
        <Link href="/customers/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        </Link>
      </PageHeader>

      <form className="app-search-form">
        <Input name="q" defaultValue={q} placeholder="Buscar por nombre o código..." className="flex-1" />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      <div className="rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>ID Fiscal</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono">{c.code}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.email || "—"}</TableCell>
                <TableCell>{c.phone || "—"}</TableCell>
                <TableCell>{c.taxId || "—"}</TableCell>
                <TableCell>
                  <Badge variant={c.isActive ? "success" : "secondary"}>
                    {c.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/customers/${c.id}`} className="text-sm text-primary hover:underline">
                    Ver
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
