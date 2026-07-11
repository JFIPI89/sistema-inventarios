"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function LotReceiveForm({
  action,
  currentQty,
  costPrice,
  salePrice,
}: {
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  currentQty: number;
  costPrice: number;
  salePrice: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cost, setCost] = useState(String(costPrice));
  const [sale, setSale] = useState(String(salePrice));

  const costNum = parseFloat(cost.replace(",", ".")) || 0;
  const saleNum = parseFloat(sale.replace(",", ".")) || 0;
  const priceWarning =
    saleNum <= 0
      ? "El precio de venta es 0; no se podrá vender este producto en POS hasta corregirlo."
      : saleNum < costNum
        ? "El precio de venta es menor que el costo."
        : null;

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    const result = await action(formData);
    if (result?.error) setError(result.error);
    else {
      setSuccess("Mercancía recibida correctamente");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recibir mercancía</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">Stock actual: {currentQty}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="costPrice">Precio costo</Label>
              <Input
                id="costPrice"
                name="costPrice"
                type="number"
                step="0.01"
                min={0}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Actual: {formatCurrency(costPrice)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Precio venta</Label>
              <Input
                id="salePrice"
                name="salePrice"
                type="number"
                step="0.01"
                min={0}
                value={sale}
                onChange={(e) => setSale(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Actual: {formatCurrency(salePrice)}
              </p>
            </div>
          </div>
          {priceWarning && <p className="text-sm text-warning">{priceWarning}</p>}
          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad recibida *</Label>
            <Input id="quantity" name="quantity" type="number" min={1} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">Referencia (factura, remisión)</Label>
            <Input id="reference" name="reference" placeholder="FAC-001234" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Input id="notes" name="notes" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-success">{success}</p>}
          <Button type="submit">Registrar recepción</Button>
        </form>
      </CardContent>
    </Card>
  );
}
