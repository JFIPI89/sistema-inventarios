import Link from "next/link";
import { getCustomers } from "@/actions/sales";
import { suggestCustomers } from "@/actions/suggest";
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
import { PageHeader } from "@/components/layout/page-header";
import { LiveSearchFilter } from "@/components/ui/live-search-filter";

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

      <div className="app-search-form">
        <LiveSearchFilter
          basePath="/customers"
          hrefPrefix="/customers"
          initialQuery={q}
          placeholder="Buscar por nombre o código..."
          fetchSuggestions={suggestCustomers}
          className="flex-1"
        />
      </div>

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
