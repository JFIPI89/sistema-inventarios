"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelSale } from "@/actions/sales";
import { Button } from "@/components/ui/button";

export function CancelSaleButton({ saleId }: { saleId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    if (!confirm("¿Anular esta venta? Se restaurará el stock.")) return;
    startTransition(async () => {
      await cancelSale(saleId);
      router.refresh();
    });
  }

  return (
    <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
      {isPending ? "Anulando..." : "Anular venta"}
    </Button>
  );
}
