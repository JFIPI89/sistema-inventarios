"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LotReceiveForm({
  action,
  currentQty,
}: {
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  currentQty: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
