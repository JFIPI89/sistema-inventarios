import Link from "next/link";
import { getCustomers } from "@/actions/sales";
import { CreditPlanForm } from "@/components/credit/credit-plan-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

export default async function NewCreditPlanPage() {
  const customers = await getCustomers();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Nueva cartera" description="Deuda manual sin venta en POS">
        <Link href="/credit">
          <Button variant="outline">Volver</Button>
        </Link>
      </PageHeader>
      <CreditPlanForm customers={customers} />
    </div>
  );
}
