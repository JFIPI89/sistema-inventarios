import {
  getSalesByPeriod,
  getSalesByProduct,
  getSalesByCustomer,
  getInventoryValuation,
  getSalesProfitReport,
} from "@/actions/reports";
import { ReportsClient } from "@/components/reports/reports-client";
import { ReportsExportPanel } from "@/components/reports/reports-export-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";

function defaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const defaults = defaultDates();
  const startDate = params.start || defaults.start;
  const endDate = params.end || defaults.end;

  const [period, byProduct, byCustomer, inventory, profit] = await Promise.all([
    getSalesByPeriod(startDate, endDate),
    getSalesByProduct(startDate, endDate),
    getSalesByCustomer(startDate, endDate),
    getInventoryValuation(),
    getSalesProfitReport(startDate, endDate),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Informes"
        description="Ventas, utilidades, productos, clientes e inventario"
      />

      <form className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full space-y-1 sm:w-auto">
          <label className="text-sm font-medium">Desde</label>
          <Input name="start" type="date" defaultValue={startDate} />
        </div>
        <div className="w-full space-y-1 sm:w-auto">
          <label className="text-sm font-medium">Hasta</label>
          <Input name="end" type="date" defaultValue={endDate} />
        </div>
        <Button type="submit" className="w-full sm:w-auto">
          Filtrar
        </Button>
      </form>

      <ReportsExportPanel startDate={startDate} endDate={endDate} />

      <ReportsClient
        chartData={period.chartData}
        summary={period.summary}
        byProduct={byProduct}
        byCustomer={byCustomer}
        inventory={inventory}
        profit={profit}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}
