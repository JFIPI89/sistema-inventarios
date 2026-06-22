import Link from "next/link";
import { CSV_TEMPLATE } from "@/lib/product-import-template";
import { ImportProductsForm } from "@/components/products/import-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

export default function ImportProductsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Importar productos" description="Carga masiva desde archivo CSV">
        <Link href="/products">
          <Button variant="outline">Volver</Button>
        </Link>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Plantilla CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Columnas: sku, name, brand, gtin, costPrice, salePrice, minStock, unitOfMeasure,
            category, description, barcode. Los productos existentes se actualizan por SKU.
          </p>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`}
            download="plantilla-productos.csv"
            className="inline-flex"
          >
            <Button type="button" variant="outline">
              Descargar plantilla
            </Button>
          </a>
        </CardContent>
      </Card>

      <ImportProductsForm />
    </div>
  );
}
