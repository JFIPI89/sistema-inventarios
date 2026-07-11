import Link from "next/link";
import { getLots } from "@/actions/inventory";
import { suggestLots } from "@/actions/suggest";
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
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LiveSearchFilter } from "@/components/ui/live-search-filter";

export default async function LotsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const lots = await getLots(q);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lotes / Stock"
        description="Trazabilidad por lote (GS1 AI 10) y vencimiento (AI 17)"
      >
        <Link href="/stock/history">
          <Button variant="outline">Movimientos</Button>
        </Link>
        <Link href="/lots/new">
          <Button>
            <Plus className="h-4 w-4" />
            Entrada de stock
          </Button>
        </Link>
      </PageHeader>

      <div className="app-search-form">
        <LiveSearchFilter
          basePath="/lots"
          hrefPrefix="/lots"
          initialQuery={q}
          placeholder="Buscar lote, producto..."
          fetchSuggestions={suggestLots}
          className="flex-1"
        />
      </div>

      <div className="rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Lote (AI 10)</TableHead>
              <TableHead>Serie (AI 21)</TableHead>
              <TableHead>Vencimiento (AI 17)</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lots.map((lot) => {
              const isExpiring =
                lot.expirationDate &&
                lot.expirationDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
              return (
                <TableRow key={lot.id}>
                  <TableCell>
                    <div>{lot.product.name}</div>
                    <div className="text-xs text-muted-foreground">{lot.product.sku}</div>
                  </TableCell>
                  <TableCell className="font-mono">{lot.lotNumber}</TableCell>
                  <TableCell>{lot.serialNumber || "—"}</TableCell>
                  <TableCell>
                    {lot.expirationDate ? (
                      <Badge variant={isExpiring ? "destructive" : "secondary"}>
                        {formatDate(lot.expirationDate)}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{lot.supplier?.name || "—"}</TableCell>
                  <TableCell>{lot.location || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={lot.quantity > 0 ? "success" : "warning"}>{lot.quantity}</Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/lots/${lot.id}`} className="text-sm text-primary hover:underline">
                      Gestionar
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
