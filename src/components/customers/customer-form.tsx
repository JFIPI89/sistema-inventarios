"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type CustomerData = {
  code: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

export function CustomerForm({
  action,
  customer,
}: {
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  customer?: CustomerData;
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
      router.push("/customers");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input id="code" name="code" defaultValue={customer?.code} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" defaultValue={customer?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={customer?.email || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" defaultValue={customer?.phone || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">ID Fiscal (NIT/RFC)</Label>
              <Input id="taxId" name="taxId" defaultValue={customer?.taxId || ""} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" defaultValue={customer?.address || ""} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Input id="notes" name="notes" defaultValue={customer?.notes || ""} />
            </div>
            {customer && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" name="isActive" defaultChecked={customer.isActive !== false} />
                <Label htmlFor="isActive">Activo</Label>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar cliente"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
