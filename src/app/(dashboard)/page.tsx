import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats, getCreditPortfolioSnapshot } from "@/actions/sales";
import { getLowStockProducts, getExpiringLots } from "@/actions/inventory";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatCents } from "@/lib/money";
import { getSession } from "@/lib/auth";
import { canWriteSales } from "@/lib/permissions";
import { DollarSign, Package, AlertTriangle, Clock, Wallet } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const [stats, lowStock, expiring, session, creditPortfolio] = await Promise.all([
    getDashboardStats(),
    getLowStockProducts(),
    getExpiringLots(30),
    getSession(),
    getCreditPortfolioSnapshot(),
  ]);

  const showCreditCard =
    session && canWriteSales(session.role) && creditPortfolio.activePlans > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="app-page-title">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido, {session?.name}</p>
      </div>

      <div className={`grid gap-4 md:grid-cols-2 ${showCreditCard ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ventas hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-cinzel">{formatCurrency(stats.todayTotal)}</div>
            <p className="text-xs text-muted-foreground">{stats.todayCount} transacciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Productos activos</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lotes por vencer</CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.expiringLots}</div>
            <p className="text-xs text-muted-foreground">Próximos 30 días</p>
          </CardContent>
        </Card>
        {showCreditCard && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cartera pendiente</CardTitle>
              <Wallet className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {formatCents(creditPortfolio.totalOutstandingCents)}
              </div>
              <p className="text-xs text-muted-foreground">
                {creditPortfolio.activePlans} planes ·{" "}
                <Link href="/credit" className="text-primary hover:underline">
                  Ver cartera
                </Link>
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Alertas de stock bajo</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin alertas</p>
            ) : (
              <ul className="space-y-2">
                {lowStock.slice(0, 5).map((p) => {
                  const total = p.lots.reduce((s, l) => s + l.quantity, 0);
                  return (
                    <li key={p.id} className="flex items-center justify-between text-sm">
                      <span>{p.name}</span>
                      <Badge variant="warning">
                        {total} / min {p.minStock}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lotes próximos a vencer</CardTitle>
          </CardHeader>
          <CardContent>
            {expiring.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin lotes por vencer</p>
            ) : (
              <ul className="space-y-2">
                {expiring.slice(0, 5).map((lot) => (
                  <li key={lot.id} className="flex items-center justify-between text-sm">
                    <span>
                      {lot.product.name} — {lot.lotNumber}
                    </span>
                    <Badge variant="destructive">{formatDate(lot.expirationDate)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
