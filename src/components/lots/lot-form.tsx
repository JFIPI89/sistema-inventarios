"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { GS1_FIELD_LABELS } from "@/lib/gs1";
import { formatCurrency } from "@/lib/utils";

type Product = {
  id: string;
  sku: string;
  name: string;
  costPrice: number;
  salePrice: number;
};
type Supplier = { id: string; name: string };

function pricesFromProduct(products: Product[], id: string) {
  const p = products.find((x) => x.id === id);
  return {
    costPrice: p ? String(p.costPrice) : "",
    salePrice: p ? String(p.salePrice) : "",
  };
}

export function LotForm({
  products,
  suppliers,
  action,
  defaultProductId,
}: {
  products: Product[];
  suppliers: Supplier[];
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  defaultProductId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const initialId = defaultProductId || "";
  const initialPrices = pricesFromProduct(products, initialId);
  const [productId, setProductId] = useState(initialId);
  const [costPrice, setCostPrice] = useState(initialPrices.costPrice);
  const [salePrice, setSalePrice] = useState(initialPrices.salePrice);
  const selected = products.find((p) => p.id === productId);

  function handleProductChange(id: string) {
    setProductId(id);
    const next = pricesFromProduct(products, id);
    setCostPrice(next.costPrice);
    setSalePrice(next.salePrice);
  }

  const costNum = parseFloat(costPrice.replace(",", ".")) || 0;
  const saleNum = parseFloat(salePrice.replace(",", ".")) || 0;
  const priceWarning =
    productId &&
    (saleNum <= 0
      ? "El precio de venta es 0; no se podrá vender este producto en POS hasta corregirlo."
      : saleNum < costNum
        ? "El precio de venta es menor que el costo."
        : null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await action(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/lots");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productId">Producto *</Label>
            <select
              id="productId"
              name="productId"
              required
              value={productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
            >
              <option value="">Seleccionar...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
          </div>
          {selected && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Precio costo</Label>
                <Input
                  id="costPrice"
                  name="costPrice"
                  type="number"
                  step="0.01"
                  min={0}
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Actual: {formatCurrency(selected.costPrice)}
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
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Actual: {formatCurrency(selected.salePrice)}
                </p>
              </div>
              {priceWarning && (
                <p className="text-sm text-warning md:col-span-2">{priceWarning}</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="supplierId">Proveedor</Label>
            <select
              id="supplierId"
              name="supplierId"
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
            >
              <option value="">Sin proveedor</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lotNumber">{GS1_FIELD_LABELS.lotNumber} *</Label>
              <Input id="lotNumber" name="lotNumber" required maxLength={20} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">{GS1_FIELD_LABELS.serialNumber}</Label>
              <Input id="serialNumber" name="serialNumber" maxLength={20} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad *</Label>
              <Input id="quantity" name="quantity" type="number" min={0} defaultValue={0} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input id="location" name="location" placeholder="Estante A-1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productionDate">{GS1_FIELD_LABELS.productionDate}</Label>
              <Input id="productionDate" name="productionDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expirationDate">{GS1_FIELD_LABELS.expirationDate}</Label>
              <Input id="expirationDate" name="expirationDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bestBeforeDate">{GS1_FIELD_LABELS.bestBeforeDate}</Label>
              <Input id="bestBeforeDate" name="bestBeforeDate" type="date" />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Registrar entrada"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
