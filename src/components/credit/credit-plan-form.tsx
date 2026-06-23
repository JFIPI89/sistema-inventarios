"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCreditPlanManual } from "@/actions/credit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { buildInstallmentPreview, formatCents, toCents } from "@/lib/money";
import { CreditPeriodUnit } from "@prisma/client";
import { formatDate } from "@/lib/utils";

type Customer = { id: string; code: string; name: string };

export function CreditPlanForm({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [installmentCount, setInstallmentCount] = useState(3);
  const [periodUnit, setPeriodUnit] = useState<CreditPeriodUnit>(CreditPeriodUnit.MONTHS);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const preview = useMemo(() => {
    const cents = toCents(totalAmount || "0");
    if (cents <= 0) return [];
    const start = new Date(startDate + "T12:00:00");
    if (Number.isNaN(start.getTime())) return [];
    return buildInstallmentPreview(cents, installmentCount, periodUnit, start);
  }, [totalAmount, installmentCount, periodUnit, startDate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createCreditPlanManual({
        customerId,
        totalAmount: parseFloat(totalAmount) || 0,
        installmentCount,
        periodUnit,
        startDate,
        notes: notes.trim() || undefined,
      });
      if (result.error) {
        setError(result.error);
      } else if (result.planId) {
        router.push(`/credit/${result.planId}`);
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
            >
              <option value="">Seleccionar...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Monto total</Label>
            <Input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cuotas (n)</Label>
              <Input
                type="number"
                min={1}
                max={52}
                value={installmentCount}
                onChange={(e) => setInstallmentCount(parseInt(e.target.value, 10) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Periodicidad</Label>
              <select
                value={periodUnit}
                onChange={(e) => setPeriodUnit(e.target.value as CreditPeriodUnit)}
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
              >
                <option value={CreditPeriodUnit.WEEKS}>Semanas</option>
                <option value={CreditPeriodUnit.MONTHS}>Meses</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Primera cuota</Label>
            <Input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {preview.length > 0 && (
            <ul className="rounded-md border border-border p-3 text-sm">
              {preview.map((row) => (
                <li key={row.number} className="flex justify-between gap-2 py-1">
                  <span>
                    Cuota {row.number} — {formatDate(row.dueDate)}
                  </span>
                  <span>{formatCents(row.amountCents)}</span>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Guardando..." : "Crear cartera"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
