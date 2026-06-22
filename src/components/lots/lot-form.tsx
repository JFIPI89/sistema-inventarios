"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { GS1_FIELD_LABELS } from "@/lib/gs1";

type Product = { id: string; sku: string; name: string };
type Supplier = { id: string; name: string };

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
              defaultValue={defaultProductId || ""}
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
