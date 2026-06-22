import Link from "next/link";
import { createSupplier } from "@/actions/suppliers";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

export default function NewSupplierPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Nuevo proveedor">
        <Link href="/suppliers">
          <Button variant="outline">Volver</Button>
        </Link>
      </PageHeader>
      <SupplierForm action={createSupplier} />
    </div>
  );
}
