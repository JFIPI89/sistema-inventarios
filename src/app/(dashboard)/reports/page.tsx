import {
  getSalesByPeriod,
  getSalesByProduct,
  getSalesByCustomer,
  getInventoryValuation,
  getSalesProfitReport,
  getCreditReport,
} from "@/actions/reports";
import { ReportsClient } from "@/components/reports/reports-client";
import { CreditReportsClient } from "@/components/reports/credit-reports-client";
import { ReportsExportPanel } from "@/components/reports/reports-export-panel";
import { ReportsTabs } from "@/components/reports/reports-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { defaultDateRangeDays } from "@/lib/timezone";

function defaultDates() {
  return defaultDateRangeDays(30);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const defaults = defaultDates();
  const startDate = params.start || defaults.start;
  const endDate = params.end || defaults.end;
  const tab = params.tab === "cartera" ? "cartera" : "operaciones";

  if (tab === "cartera") {
    const credit = await getCreditReport(startDate, endDate);

    return (
      <div className="space-y-6">
        <PageHeader
          title="Informes"
          description="Ventas, utilidades, inventario y cartera a crédito"
        />

        <ReportsTabs activeTab="cartera" startDate={startDate} endDate={endDate} />

        <form className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <input type="hidden" name="tab" value="cartera" />
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

        <ReportsExportPanel startDate={startDate} endDate={endDate} activeTab="cartera" />

        <CreditReportsClient credit={credit} startDate={startDate} endDate={endDate} />
      </div>
    );
  }

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
        description="Ventas, utilidades, inventario y cartera a crédito"
      />

      <ReportsTabs activeTab="operaciones" startDate={startDate} endDate={endDate} />

      <form className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <input type="hidden" name="tab" value="operaciones" />
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

      <ReportsExportPanel startDate={startDate} endDate={endDate} activeTab="operaciones" />

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
