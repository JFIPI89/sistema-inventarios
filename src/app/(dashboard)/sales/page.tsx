import Link from "next/link";
import { getSales } from "@/actions/sales";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const sales = await getSales(q);

  return (
    <div className="space-y-6">
      <PageHeader title="Ventas" description="Punto de venta e historial">
        <Link href="/sales/pos">
          <Button>
            <Plus className="h-4 w-4" />
            Nueva venta (POS)
          </Button>
        </Link>
      </PageHeader>

      <form className="app-search-form">
        <Input name="q" defaultValue={q} placeholder="Buscar venta o cliente..." className="flex-1" />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      <div className="rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-mono">{sale.saleNumber}</TableCell>
                <TableCell>{formatDate(sale.saleDate)}</TableCell>
                <TableCell>{sale.customer?.name || "Mostrador"}</TableCell>
                <TableCell>{sale.user.name}</TableCell>
                <TableCell>{formatCurrency(sale.total)}</TableCell>
                <TableCell>
                  <Badge variant={sale.status === "COMPLETED" ? "success" : "destructive"}>
                    {sale.status === "COMPLETED" ? "Completada" : "Cancelada"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/sales/${sale.id}`} className="text-sm text-primary hover:underline">
                    Detalle
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
