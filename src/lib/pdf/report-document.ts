import PDFDocument from "pdfkit";
import type { LetterheadLogos } from "@/lib/pdf/horus-logo-image";
import type { ReportSection } from "@/lib/reports/sections";

type PdfDoc = InstanceType<typeof PDFDocument>;

const GOLD = "#C9A84C";
const CHARCOAL = "#1a1a1a";
const MARGIN = 50;
const PAGE_WIDTH = 612;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export type { ReportSection };

export type ReportPdfData = {
  startDate: string;
  endDate: string;
  sections: ReportSection[];
  sales?: {
    summary: { total: number; count: number };
    rows: Array<{
      saleNumber: string;
      saleDate: string;
      subtotal: number;
      discount: number;
      total: number;
      status: string;
    }>;
  };
  products?: Array<{ name: string; sku: string; units: number; revenue: number }>;
  customers?: Array<{ name: string; code: string; count: number; total: number }>;
  profit?: {
    summary: {
      totalRevenue: number;
      totalCost: number;
      totalUtility: number;
      marginPercent: number;
      salesCount: number;
    };
    rows: Array<{
      name: string;
      sku: string;
      units: number;
      revenue: number;
      cost: number;
      utility: number;
    }>;
  };
  inventory?: Array<{
    productName: string;
    sku: string;
    lotNumber: string;
    quantity: number;
    value: number;
  }>;
  credit?: {
    summary: {
      activePlans: number;
      totalPortfolioCents: number;
      totalOutstandingCents: number;
      totalCollectedCents?: number;
      collectedInPeriodCents: number;
      paymentsInPeriodCount: number;
      overdueInstallmentsCount: number;
      overdueAmountCents: number;
      newPlansInPeriod: number;
      newPlansAmountCents: number;
      collectionRatePercent?: number;
      dueNext7Cents?: number;
      dueNext30Cents?: number;
    };
    agingBuckets?: {
      alDia: number;
      vencido_1_7: number;
      vencido_8_30: number;
      vencido_31_60: number;
      vencido_60_plus: number;
    };
    byCustomer: Array<{
      name: string;
      code: string;
      activePlans: number;
      outstandingCents: number;
      overdueCents: number;
      rating?: string | null;
      creditLimitCents?: number | null;
      availableCents?: number | null;
    }>;
    overdueInstallments: Array<{
      planNumber: string;
      customerName: string;
      installmentNumber: number;
      dueDate: string;
      remainingCents: number;
    }>;
    paymentsInPeriod: Array<{
      paidAt: string;
      planNumber: string;
      customerName: string;
      installmentNumber: number;
      amountCents: number;
      paymentMethod: string;
    }>;
  };
};

type ReportCtx = {
  title: string;
  start: string;
  end: string;
  logos: LetterheadLogos;
};

function money(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: process.env.CURRENCY_CODE || "MXN",
  }).format(n);
}

function moneyCents(cents: number): string {
  return money(cents / 100);
}

function logoWidth(height: number, variant: "full" | "mark"): number {
  const aspect = variant === "full" ? 752 / 800 : 752 / 735;
  return height * aspect;
}

function drawLetterhead(
  doc: PdfDoc,
  title: string,
  startDate: string,
  endDate: string,
  logos: LetterheadLogos,
  compact = false
) {
  const logoHeight = compact ? 36 : 64;
  const variant = compact ? "mark" : "full";
  const logoBuffer = compact ? logos.mark : logos.full;
  const bandHeight = compact ? 52 : 84;
  const logoY = compact ? 8 : 10;
  const textX = MARGIN + logoWidth(logoHeight, variant) + 14;

  doc.rect(0, 0, PAGE_WIDTH, bandHeight).fill(CHARCOAL);
  doc.image(logoBuffer, MARGIN, logoY, { height: logoHeight });

  doc
    .fillColor("#cccccc")
    .fontSize(compact ? 8 : 9)
    .text(title, textX, compact ? 14 : 18, { width: PAGE_WIDTH - textX - MARGIN });

  if (!compact) {
    doc
      .fillColor("#999999")
      .fontSize(8)
      .text(`Período: ${startDate} — ${endDate}`, 320, 22, { width: 240, align: "right" });
    doc.text(`Generado: ${new Date().toLocaleString("es-MX")}`, 320, 38, {
      width: 240,
      align: "right",
    });
  }

  doc
    .moveTo(MARGIN, bandHeight + 4)
    .lineTo(PAGE_WIDTH - MARGIN, bandHeight + 4)
    .strokeColor(GOLD)
    .lineWidth(1.5)
    .stroke();

  doc.fillColor("#000000").fontSize(10);
  doc.y = bandHeight + 16;
}

function ensureSpace(doc: PdfDoc, needed: number, ctx: ReportCtx) {
  if (doc.y + needed > doc.page.height - 60) {
    doc.addPage();
    drawLetterhead(doc, ctx.title, ctx.start, ctx.end, ctx.logos, true);
  }
}

function drawSectionTitle(doc: PdfDoc, text: string) {
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor(CHARCOAL).text(text, MARGIN, doc.y, { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor("#000000");
}

function drawTable(
  doc: PdfDoc,
  headers: string[],
  rows: string[][],
  colWidths: number[],
  ctx: ReportCtx
) {
  const rowHeight = 16;
  const headerHeight = 18;

  ensureSpace(doc, headerHeight + rowHeight * Math.min(rows.length, 3) + 10, ctx);

  let x = MARGIN;
  doc.fontSize(8).fillColor("#666666");
  headers.forEach((h, i) => {
    doc.text(h, x, doc.y, { width: colWidths[i], continued: false });
    x += colWidths[i];
  });
  doc.moveDown(0.2);
  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(PAGE_WIDTH - MARGIN, doc.y)
    .strokeColor("#dddddd")
    .stroke();
  doc.moveDown(0.2);

  doc.fontSize(8).fillColor("#000000");
  for (const row of rows) {
    ensureSpace(doc, rowHeight + 4, ctx);
    x = MARGIN;
    const y = doc.y;
    row.forEach((cell, i) => {
      doc.text(cell, x, y, { width: colWidths[i], lineBreak: false });
      x += colWidths[i];
    });
    doc.y = y + rowHeight;
  }
  doc.moveDown(0.8);
}

export async function buildReportPdf(data: ReportPdfData): Promise<Buffer> {
  const { loadLetterheadLogos } = await import("@/lib/pdf/horus-logo-image");
  const logos = await loadLetterheadLogos();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: MARGIN, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const ctx: ReportCtx = {
      title: "Informe de operaciones",
      start: data.startDate,
      end: data.endDate,
      logos,
    };

    drawLetterhead(doc, ctx.title, data.startDate, data.endDate, logos);

    if (data.sections.includes("sales") && data.sales) {
      drawSectionTitle(doc, "Ventas del período");
      doc.fontSize(9).text(
        `Total: ${money(data.sales.summary.total)}  |  Transacciones: ${data.sales.summary.count}`
      );
      doc.moveDown(0.4);
      drawTable(
        doc,
        ["Número", "Fecha", "Subtotal", "Desc.", "Total"],
        data.sales.rows.map((s) => [
          s.saleNumber,
          s.saleDate.slice(0, 10),
          money(s.subtotal),
          money(s.discount),
          money(s.total),
        ]),
        [90, 70, 80, 60, 80],
        ctx
      );
    }

    if (data.sections.includes("products") && data.products) {
      drawSectionTitle(doc, "Top productos");
      drawTable(
        doc,
        ["Producto", "SKU", "Unidades", "Ingresos"],
        data.products.slice(0, 50).map((p) => [p.name.slice(0, 28), p.sku, String(p.units), money(p.revenue)]),
        [180, 80, 60, 90],
        ctx
      );
    }

    if (data.sections.includes("customers") && data.customers) {
      drawSectionTitle(doc, "Top clientes");
      drawTable(
        doc,
        ["Cliente", "Código", "Compras", "Total"],
        data.customers.slice(0, 50).map((c) => [
          c.name.slice(0, 28),
          c.code,
          String(c.count),
          money(c.total),
        ]),
        [180, 80, 60, 90],
        ctx
      );
    }

    if (data.sections.includes("profit") && data.profit) {
      drawSectionTitle(doc, "Utilidades");
      const s = data.profit.summary;
      doc.fontSize(9).text(
        `Ingresos: ${money(s.totalRevenue)}  |  Costo: ${money(s.totalCost)}  |  Utilidad: ${money(s.totalUtility)}  |  Margen: ${s.marginPercent.toFixed(1)}%`
      );
      doc.moveDown(0.4);
      drawTable(
        doc,
        ["Producto", "Uds", "Ingreso", "Costo", "Utilidad"],
        data.profit.rows.slice(0, 50).map((p) => [
          p.name.slice(0, 24),
          String(p.units),
          money(p.revenue),
          money(p.cost),
          money(p.utility),
        ]),
        [150, 40, 80, 80, 80],
        ctx
      );
    }

    if (data.sections.includes("inventory") && data.inventory) {
      drawSectionTitle(doc, "Inventario valorizado (snapshot actual)");
      const totalVal = data.inventory.reduce((a, i) => a + i.value, 0);
      doc.fontSize(9).text(`Valor total a costo: ${money(totalVal)}`);
      doc.moveDown(0.4);
      drawTable(
        doc,
        ["Producto", "Lote", "Cant.", "Valor"],
        data.inventory.slice(0, 80).map((i) => [
          i.productName.slice(0, 24),
          i.lotNumber,
          String(i.quantity),
          money(i.value),
        ]),
        [160, 100, 50, 90],
        ctx
      );
    }

    if (data.sections.includes("credit") && data.credit) {
      drawSectionTitle(doc, "Cartera / crédito");
      const s = data.credit.summary;
      doc.fontSize(9).text(
        `Cartera activa: ${moneyCents(s.totalPortfolioCents)} (${s.activePlans} planes)  |  Pendiente: ${moneyCents(s.totalOutstandingCents)}  |  Recuperación: ${s.collectionRatePercent ?? 0}%  |  Cobrado período: ${moneyCents(s.collectedInPeriodCents)}  |  Vencido: ${moneyCents(s.overdueAmountCents)} (${s.overdueInstallmentsCount} cuotas)`
      );
      doc.moveDown(0.4);

      if (data.credit.agingBuckets) {
        const a = data.credit.agingBuckets;
        drawSectionTitle(doc, "Antigüedad de saldos");
        drawTable(
          doc,
          ["Bucket", "Monto"],
          [
            ["Al día", moneyCents(a.alDia)],
            ["Vencido 1-7 días", moneyCents(a.vencido_1_7)],
            ["Vencido 8-30 días", moneyCents(a.vencido_8_30)],
            ["Vencido 31-60 días", moneyCents(a.vencido_31_60)],
            ["Vencido +60 días", moneyCents(a.vencido_60_plus)],
          ],
          [200, 120],
          ctx
        );
      }

      drawSectionTitle(doc, "Calificación por cliente");
      drawTable(
        doc,
        ["Cliente", "Cód.", "Cal.", "Pendiente", "Tope", "Disp."],
        data.credit.byCustomer.slice(0, 40).map((c) => [
          c.name.slice(0, 20),
          c.code,
          c.rating ?? "N/A",
          moneyCents(c.outstandingCents),
          c.creditLimitCents != null ? moneyCents(c.creditLimitCents) : "—",
          c.availableCents != null ? moneyCents(c.availableCents) : "—",
        ]),
        [110, 55, 35, 75, 70, 70],
        ctx
      );

      if (data.credit.overdueInstallments.length > 0) {
        drawSectionTitle(doc, "Cuotas vencidas");
        drawTable(
          doc,
          ["Plan", "Cliente", "Cuota", "Vence", "Saldo"],
          data.credit.overdueInstallments.slice(0, 40).map((i) => [
            i.planNumber,
            i.customerName.slice(0, 18),
            String(i.installmentNumber),
            i.dueDate.slice(0, 10),
            moneyCents(i.remainingCents),
          ]),
          [80, 120, 40, 70, 70],
          ctx
        );
      }

      if (data.credit.paymentsInPeriod.length > 0) {
        drawSectionTitle(doc, "Abonos del período");
        drawTable(
          doc,
          ["Fecha", "Plan", "Cliente", "Cuota", "Monto"],
          data.credit.paymentsInPeriod.slice(0, 50).map((p) => [
            p.paidAt.slice(0, 10),
            p.planNumber,
            p.customerName.slice(0, 18),
            String(p.installmentNumber),
            moneyCents(p.amountCents),
          ]),
          [70, 80, 120, 40, 70],
          ctx
        );
      }
    }

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(7)
        .fillColor("#888888")
        .text(
          `DISTRIBUIDORA HORUS — Inventarios  |  Página ${i + 1} de ${range.count}`,
          MARGIN,
          doc.page.height - 40,
          { width: CONTENT_WIDTH, align: "center" }
        );
    }

    doc.end();
  });
}
