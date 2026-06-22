import Link from "next/link";
import { getCustomers } from "@/actions/sales";
import { PosClient } from "@/components/sales/pos-client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

export default async function PosPage() {
  const customers = await getCustomers();

  return (
    <div className="space-y-6">
      <PageHeader title="Punto de venta" description="Descuento de stock por lote (FIFO)">
        <Link href="/sales">
          <Button variant="outline">Historial</Button>
        </Link>
      </PageHeader>
      <PosClient customers={customers} />
    </div>
  );
}
