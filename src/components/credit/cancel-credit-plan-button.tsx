"use client";

import { useTransition } from "react";
import { cancelCreditPlan } from "@/actions/credit";
import { Button } from "@/components/ui/button";

export function CancelCreditPlanButton({ planId }: { planId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("¿Cancelar este plan de cartera? No revierte la venta asociada.")) return;
        startTransition(async () => {
          await cancelCreditPlan(planId);
        });
      }}
    >
      {isPending ? "Cancelando..." : "Cancelar plan"}
    </Button>
  );
}
