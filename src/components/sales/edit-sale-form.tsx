"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSale } from "@/actions/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/lib/credit-labels";
import { PaymentMethod } from "@prisma/client";

type EditItem = {
  id: string;
  productName: string;
  lotNumber: string;
  quantity: number;
  unitPrice: number;
  availableStock: number;
};

export function EditSaleForm({
  saleId,
  saleType,
  discount: initialDiscount,
  paymentMethod: initialPayment,
  items,
  lockedReason,
}: {
  saleId: string;
  saleType: "CONTADO" | "CREDITO";
  discount: number;
  paymentMethod: PaymentMethod;
  items: EditItem[];
  lockedReason?: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [discount, setDiscount] = useState(initialDiscount);
  const [paymentMethod, setPaymentMethod] = useState(initialPayment);
  const [qtys, setQtys] = useState<Record<string, number>>(
    Object.fromEntries(items.map((i) => [i.id, i.quantity]))
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const preview = useMemo(() => {
    const lines = items.map((i) => {
      const quantity = Math.max(1, Math.floor(qtys[i.id] || 1));
      return {
        ...i,
        quantity,
        lineTotal: i.unitPrice * quantity,
        maxQty: i.quantity + i.availableStock,
      };
    });
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const total = Math.max(0, subtotal - (Number(discount) || 0));
    return { lines, subtotal, total };
  }, [items, qtys, discount]);

  if (lockedReason) {
    return (
      <p className="text-sm text-muted-foreground border border-border rounded-md p-3">
        {lockedReason}
      </p>
    );
  }

  if (!editing) {
    return (
      <Button variant="outline" onClick={() => setEditing(true)}>
        Editar venta
      </Button>
    );
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateSale(saleId, {
        discount: Number(discount) || 0,
        paymentMethod: saleType === "CONTADO" ? paymentMethod : undefined,
        items: items.map((i) => ({
          id: i.id,
          quantity: Math.max(1, Math.floor(qtys[i.id] || 1)),
        })),
      });
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setMessage("Venta actualizada (queda en Histórico)");
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">Editar venta</h3>
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={isPending}>
          Cancelar
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Puedes cambiar cantidades y descuento. El stock se ajusta y la modificación queda en
        Histórico.
      </p>

      <ul className="space-y-3">
        {preview.lines.map((line) => (
          <li key={line.id} className="grid gap-2 sm:grid-cols-[1fr_100px] items-end">
            <div>
              <p className="text-sm font-medium">{line.productName}</p>
              <p className="text-xs text-muted-foreground font-mono">
                Lote {line.lotNumber} · máx {line.maxQty} (stock libre {line.availableStock})
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cantidad</Label>
              <Input
                type="number"
                min={1}
                max={line.maxQty}
                value={qtys[line.id] ?? line.quantity}
                onChange={(e) =>
                  setQtys((prev) => ({
                    ...prev,
                    [line.id]: parseInt(e.target.value, 10) || 1,
                  }))
                }
              />
              <p className="text-xs text-right">{formatCurrency(line.lineTotal)}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Descuento</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
          />
        </div>
        {saleType === "CONTADO" && (
          <div className="space-y-1">
            <Label>Método de pago</Label>
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
        )}
      </div>

      <div className="flex justify-between text-sm border-t border-border pt-3">
        <span>Nuevo total</span>
        <span className="font-bold">{formatCurrency(preview.total)}</span>
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.includes("actualizada") ? "text-success" : "text-destructive"
          }`}
        >
          {message}
        </p>
      )}

      <Button className="w-full" onClick={handleSave} disabled={isPending || preview.total <= 0}>
        {isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  );
}
