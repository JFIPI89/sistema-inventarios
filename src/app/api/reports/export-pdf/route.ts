import { NextRequest, NextResponse } from "next/server";
import {
  getSalesByPeriod,
  getSalesByProduct,
  getSalesByCustomer,
  getInventoryValuation,
  getSalesProfitReport,
} from "@/actions/reports";
import { getCreditOperationalReport } from "@/actions/credit";
import { buildReportPdf, type ReportPdfData } from "@/lib/pdf/report-document";
import { parseSections } from "@/lib/reports/sections";

export async function GET(request: NextRequest) {
  const start = request.nextUrl.searchParams.get("start") || "";
  const end = request.nextUrl.searchParams.get("end") || "";
  const sectionsParam = request.nextUrl.searchParams.get("sections") || "";

  if (!start || !end) {
    return NextResponse.json({ error: "Fechas requeridas" }, { status: 400 });
  }

  const sections = parseSections(sectionsParam);

  if (sections.length === 0) {
    return NextResponse.json({ error: "Selecciona al menos una sección" }, { status: 400 });
  }

  try {
    const pdfData: ReportPdfData = { startDate: start, endDate: end, sections };

    if (sections.includes("sales")) {
      const { sales, summary } = await getSalesByPeriod(start, end);
      pdfData.sales = {
        summary,
        rows: sales.map((s) => ({
          saleNumber: s.saleNumber,
          saleDate: s.saleDate.toISOString(),
          subtotal: s.subtotal,
          discount: s.discount,
          total: s.total,
          status: s.status,
        })),
      };
    }

    if (sections.includes("products")) {
      pdfData.products = await getSalesByProduct(start, end);
    }

    if (sections.includes("customers")) {
      pdfData.customers = await getSalesByCustomer(start, end);
    }

    if (sections.includes("profit")) {
      const profit = await getSalesProfitReport(start, end);
      pdfData.profit = { summary: profit.summary, rows: profit.byProduct };
    }

    if (sections.includes("inventory")) {
      pdfData.inventory = (await getInventoryValuation()).map((i) => ({
        productName: i.productName,
        sku: i.sku,
        lotNumber: i.lotNumber,
        quantity: i.quantity,
        value: i.value,
      }));
    }

    if (sections.includes("credit")) {
      const credit = await getCreditOperationalReport(start, end);
      pdfData.credit = {
        summary: credit.summary,
        agingBuckets: credit.agingBuckets,
        byCustomer: credit.byCustomer.map((c) => ({
          name: c.name,
          code: c.code,
          activePlans: c.activePlans,
          outstandingCents: c.outstandingCents,
          overdueCents: c.overdueCents,
          rating: c.rating,
          creditLimitCents: c.creditLimitCents,
          availableCents: c.availableCents,
        })),
        overdueInstallments: credit.overdueInstallments.map((i) => ({
          planNumber: i.planNumber,
          customerName: i.customerName,
          installmentNumber: i.installmentNumber,
          dueDate: i.dueDate.toISOString(),
          remainingCents: i.remainingCents,
        })),
        paymentsInPeriod: credit.paymentsInPeriod.map((p) => ({
          paidAt: p.paidAt.toISOString(),
          planNumber: p.planNumber,
          customerName: p.customerName,
          installmentNumber: p.installmentNumber,
          amountCents: p.amountCents,
          paymentMethod: p.paymentMethod,
        })),
      };
    }

    const buffer = await buildReportPdf(pdfData);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="informe-horus-${start}-${end}.pdf"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al generar PDF";
    const status = message === "No autorizado" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
