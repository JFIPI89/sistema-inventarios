import Link from "next/link";
import { createCustomer } from "@/actions/sales";
import { CustomerForm } from "@/components/customers/customer-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Nuevo cliente">
        <Link href="/customers">
          <Button variant="outline">Volver</Button>
        </Link>
      </PageHeader>
      <CustomerForm action={createCustomer} />
    </div>
  );
}
