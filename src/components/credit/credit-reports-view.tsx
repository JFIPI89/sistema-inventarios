"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditReportsClient } from "@/components/reports/credit-reports-client";
import { ReportsExportPanel } from "@/components/reports/reports-export-panel";
import type { CreditReport } from "@/actions/reports";

export function CreditReportsView({
  credit,
  startDate,
  endDate,
}: {
  credit: CreditReport;
  startDate: string;
  endDate: string;
}) {
  return (
    <div className="space-y-6">
      <form className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <input type="hidden" name="view" value="reportes" />
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

      <CreditReportsClient credit={credit} startDate={startDate} endDate={endDate} showAdminLink={false} />
    </div>
  );
}
