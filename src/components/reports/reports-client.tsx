"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

type ChartPoint = { date: string; total: number; count: number };
type ProductRow = { name: string; sku: string; units: number; revenue: number };
type CustomerRow = { name: string; code: string; count: number; total: number };
type InventoryRow = {
  productName: string;
  sku: string;
  brand: string | null;
  lotNumber: string;
  quantity: number;
  costPrice: number;
  value: number;
  expirationDate: Date | null;
};

type ProfitChartPoint = { date: string; revenue: number; cost: number; utility: number; count: number };
type ProfitProductRow = {
  name: string;
  sku: string;
  units: number;
  revenue: number;
  cost: number;
  utility: number;
};
type ProfitReport = {
  summary: {
    totalRevenue: number;
    totalCost: number;
    totalDiscount: number;
    totalUtility: number;
    marginPercent: number;
    salesCount: number;
  };
  chartData: ProfitChartPoint[];
  byProduct: ProfitProductRow[];
};

export function ReportsClient({
  chartData,
  summary,
  byProduct,
  byCustomer,
  inventory,
  profit,
  startDate,
  endDate,
}: {
  chartData: ChartPoint[];
  summary: { total: number; count: number };
  byProduct: ProductRow[];
  byCustomer: CustomerRow[];
  inventory: InventoryRow[];
  profit: ProfitReport;
  startDate: string;
  endDate: string;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Ventas por período ({startDate} — {endDate})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-4 sm:gap-8">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.total)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transacciones</p>
              <p className="text-2xl font-bold">{summary.count}</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top productos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Unidades</TableHead>
                  <TableHead>Ingresos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byProduct.slice(0, 10).map((p) => (
                  <TableRow key={p.sku}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.units}</TableCell>
                    <TableCell>{formatCurrency(p.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Compras</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byCustomer.slice(0, 10).map((c) => (
                  <TableRow key={c.code}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.count}</TableCell>
                    <TableCell>{formatCurrency(c.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventario valorizado</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Cant.</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((row, i) => (
                <TableRow key={`${row.sku}-${row.lotNumber}-${i}`}>
                  <TableCell>{row.productName}</TableCell>
                  <TableCell>{row.brand || "—"}</TableCell>
                  <TableCell className="font-mono">{row.lotNumber}</TableCell>
                  <TableCell>{row.quantity}</TableCell>
                  <TableCell>{formatCurrency(row.value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-4 text-right font-bold">
            Total inventario: {formatCurrency(inventory.reduce((s, r) => s + r.value, 0))}
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle>
            Utilidades de ventas ({startDate} — {endDate})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Calculado automáticamente: ingresos netos − costo de productos vendidos
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Ingresos netos</p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(profit.summary.totalRevenue)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Costo vendido</p>
              <p className="text-xl font-bold">{formatCurrency(profit.summary.totalCost)}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Descuentos</p>
              <p className="text-xl font-bold text-warning">
                {formatCurrency(profit.summary.totalDiscount)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Utilidad bruta</p>
              <p
                className={`text-xl font-bold ${
                  profit.summary.totalUtility >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                {formatCurrency(profit.summary.totalUtility)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Margen</p>
              <p className="text-xl font-bold">{profit.summary.marginPercent.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">
                {profit.summary.salesCount} ventas
              </p>
            </div>
          </div>

          {profit.chartData.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Utilidad diaria</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profit.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Bar dataKey="utility" fill="#16a34a" name="Utilidad" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cost" fill="#94a3b8" name="Costo" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium">Utilidad por producto</p>
            {profit.byProduct.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay ventas en el rango seleccionado
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Unidades</TableHead>
                    <TableHead>Ingresos</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Utilidad</TableHead>
                    <TableHead>Margen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profit.byProduct.map((p) => {
                    const margin = p.revenue > 0 ? (p.utility / p.revenue) * 100 : 0;
                    return (
                      <TableRow key={p.sku}>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{p.units}</TableCell>
                        <TableCell>{formatCurrency(p.revenue)}</TableCell>
                        <TableCell>{formatCurrency(p.cost)}</TableCell>
                        <TableCell
                          className={p.utility >= 0 ? "text-success font-medium" : "text-destructive font-medium"}
                        >
                          {formatCurrency(p.utility)}
                        </TableCell>
                        <TableCell>{margin.toFixed(1)}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
            <p className="text-lg font-bold">
              Utilidad total del período:{" "}
              <span className={profit.summary.totalUtility >= 0 ? "text-success" : "text-destructive"}>
                {formatCurrency(profit.summary.totalUtility)}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
