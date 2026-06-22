"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { GS1_FIELD_LABELS } from "@/lib/gs1";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string };

type ProductData = {
  sku: string;
  name: string;
  gtin?: string | null;
  brand?: string | null;
  description?: string | null;
  categoryId?: string | null;
  unitOfMeasure: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  barcode?: string | null;
  isActive?: boolean;
};

export function ProductForm({
  categories,
  action,
  product,
}: {
  categories: Category[];
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  product?: ProductData;
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
      router.push("/products");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input id="sku" name="sku" defaultValue={product?.sku} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gtin">{GS1_FIELD_LABELS.gtin}</Label>
              <Input id="gtin" name="gtin" defaultValue={product?.gtin || ""} placeholder="14 dígitos" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" defaultValue={product?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input id="brand" name="brand" defaultValue={product?.brand || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoría</Label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={product?.categoryId || ""}
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" name="description" defaultValue={product?.description || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitOfMeasure">Unidad</Label>
              <Input id="unitOfMeasure" name="unitOfMeasure" defaultValue={product?.unitOfMeasure || "pza"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Código de barras</Label>
              <Input id="barcode" name="barcode" defaultValue={product?.barcode || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Precio costo</Label>
              <Input id="costPrice" name="costPrice" type="number" step="0.01" defaultValue={product?.costPrice ?? 0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Precio venta</Label>
              <Input id="salePrice" name="salePrice" type="number" step="0.01" defaultValue={product?.salePrice ?? 0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Stock mínimo</Label>
              <Input id="minStock" name="minStock" type="number" defaultValue={product?.minStock ?? 0} />
            </div>
            {product && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" name="isActive" defaultChecked={product.isActive !== false} />
                <Label htmlFor="isActive">Activo</Label>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar producto"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
