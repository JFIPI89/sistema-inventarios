import Link from "next/link";
import { getStockMovements } from "@/actions/stock-history";
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
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";

export default async function StockHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    productId?: string;
    lotId?: string;
    dateFrom?: string;
    dateTo?: string;
    type?: "IN" | "OUT" | "ADJUST";
  }>;
}) {
  const params = await searchParams;
  const movements = await getStockMovements({
    search: params.q,
    productId: params.productId,
    lotId: params.lotId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    type: params.type,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historial de movimientos"
        description="Kardex de entradas, salidas y ajustes por producto/lote"
      />

      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
        {params.productId && <input type="hidden" name="productId" value={params.productId} />}
        {params.lotId && <input type="hidden" name="lotId" value={params.lotId} />}
        <div className="space-y-1">
          <label className="text-sm font-medium">Buscar</label>
          <Input name="q" defaultValue={params.q} placeholder="SKU, lote, referencia..." />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Desde</label>
          <Input name="dateFrom" type="date" defaultValue={params.dateFrom} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Hasta</label>
          <Input name="dateTo" type="date" defaultValue={params.dateTo} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Tipo</label>
          <select
            name="type"
            defaultValue={params.type || ""}
            className="flex h-10 rounded-md border border-border bg-surface px-3 text-sm"
          >
            <option value="">Todos</option>
            <option value="IN">Entrada</option>
            <option value="OUT">Salida</option>
            <option value="ADJUST">Ajuste</option>
          </select>
        </div>
        <Button type="submit" variant="secondary" className="w-full sm:w-auto lg:col-span-1">
          Filtrar
        </Button>
      </form>

      <div className="rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Lote</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Sin movimientos
                </TableCell>
              </TableRow>
            ) : (
              movements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{formatDate(m.createdAt)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        m.type === "IN" ? "success" : m.type === "OUT" ? "destructive" : "warning"
                      }
                    >
                      {m.typeLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>{m.product.name}</div>
                    <div className="text-xs text-muted-foreground">{m.product.sku}</div>
                  </TableCell>
                  <TableCell className="font-mono">{m.lot.lotNumber}</TableCell>
                  <TableCell>
                    {m.type === "OUT"
                      ? `-${Math.abs(m.quantity)}`
                      : m.quantity > 0
                        ? `+${m.quantity}`
                        : m.quantity}
                  </TableCell>
                  <TableCell>{m.reference || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.notes || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
