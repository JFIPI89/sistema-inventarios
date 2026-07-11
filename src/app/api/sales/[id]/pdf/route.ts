import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canWriteSales } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { buildSalePdf } from "@/lib/pdf/sale-document";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !canWriteSales(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await context.params;

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      user: { select: { name: true } },
      items: { include: { product: true, lot: true } },
      creditPlan: { select: { planNumber: true } },
    },
  });

  if (!sale) {
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
  }

  try {
    const buffer = await buildSalePdf({
      saleNumber: sale.saleNumber,
      saleDate: sale.saleDate,
      status: sale.status,
      saleType: sale.saleType,
      paymentMethod: sale.paymentMethod,
      subtotal: sale.subtotal,
      discount: sale.discount,
      total: sale.total,
      customerName: sale.customer?.name ?? null,
      customerCode: sale.customer?.code ?? null,
      sellerName: sale.user.name,
      creditPlanNumber: sale.creditPlan?.planNumber ?? null,
      items: sale.items.map((item) => ({
        productName: item.product.name,
        sku: item.product.sku,
        lotNumber: item.lot.lotNumber,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
    });

    const safeName = sale.saleNumber.replace(/[^\w.-]+/g, "_");

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="venta-${safeName}.pdf"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al generar PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
