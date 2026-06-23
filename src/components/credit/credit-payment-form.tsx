"use client";

import { useState, useTransition } from "react";
import { registerCreditPayment } from "@/actions/credit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCents, fromCents } from "@/lib/money";
import { PaymentMethod } from "@prisma/client";
import { PAYMENT_METHOD_LABELS } from "@/lib/credit-labels";

export function CreditPaymentForm({
  installmentId,
  remainingCents,
  installmentNumber,
}: {
  installmentId: string;
  remainingCents: number;
  installmentNumber: number;
}) {
  const [amount, setAmount] = useState(fromCents(remainingCents).toFixed(2));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await registerCreditPayment({
        installmentId,
        amount: parseFloat(amount) || 0,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage("Abono registrado");
        setAmount("0");
      }
    });
  }

  if (remainingCents <= 0) return null;

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-md border border-border p-3">
      <p className="text-sm font-medium">Abonar cuota {installmentNumber}</p>
      <p className="text-xs text-muted-foreground">Saldo: {formatCents(remainingCents)}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Monto</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            max={fromCents(remainingCents)}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Método</Label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          >
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Input
        placeholder="Notas (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {message && (
        <p className={`text-sm ${message.includes("registrado") ? "text-success" : "text-destructive"}`}>
          {message}
        </p>
      )}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Guardando..." : "Registrar abono"}
      </Button>
    </form>
  );
}
