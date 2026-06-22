"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const SECTIONS = [
  { id: "sales", label: "Ventas del período" },
  { id: "products", label: "Top productos" },
  { id: "customers", label: "Top clientes" },
  { id: "profit", label: "Utilidades" },
  { id: "inventory", label: "Inventario valorizado (snapshot)" },
] as const;

export function ReportsExportPanel({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const [selected, setSelected] = useState<string[]>(
    SECTIONS.map((s) => s.id)
  );
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setError(null);
  }

  function exportUrl(format: "pdf" | "csv") {
    if (selected.length === 0) return null;
    const base =
      format === "pdf"
        ? "/api/reports/export-pdf"
        : "/api/reports/export-csv";
    return `${base}?start=${startDate}&end=${endDate}&sections=${selected.join(",")}`;
  }

  function handleExport(format: "pdf" | "csv") {
    const url = exportUrl(format);
    if (!url) {
      setError("Selecciona al menos una sección para exportar.");
      return;
    }
    window.location.href = url;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Exportar informe</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Elige las secciones a incluir. Las fechas del filtro superior aplican a ventas, productos, clientes y utilidades.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <label
            key={s.id}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50"
          >
            <input
              type="checkbox"
              checked={selected.includes(s.id)}
              onChange={() => toggle(s.id)}
              className="h-4 w-4 accent-[var(--gold)]"
            />
            {s.label}
          </label>
        ))}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => handleExport("pdf")}>
          Exportar PDF
        </Button>
        <Button type="button" variant="outline" onClick={() => handleExport("csv")}>
          Exportar CSV
        </Button>
      </div>
    </div>
  );
}
