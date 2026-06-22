"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function LotAdjustForm({
  action,
  currentQty,
}: {
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  currentQty: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await action(formData);
    if (result?.error) setError(result.error);
    else {
      router.refresh();
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">Stock actual: {currentQty}</p>
          <div className="space-y-2">
            <Label htmlFor="adjustment">Ajuste (+/-)</Label>
            <Input id="adjustment" name="adjustment" type="number" placeholder="Ej: -5 o 10" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Input id="notes" name="notes" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit">Aplicar ajuste</Button>
        </form>
      </CardContent>
    </Card>
  );
}
