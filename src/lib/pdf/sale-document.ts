import PDFDocument from "pdfkit";
import type { LetterheadLogos } from "@/lib/pdf/horus-logo-image";
import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/timezone";
import { PAYMENT_METHOD_LABELS, SALE_TYPE_LABELS } from "@/lib/credit-labels";
import type { PaymentMethod, SaleStatus, SaleType } from "@prisma/client";

type PdfDoc = InstanceType<typeof PDFDocument>;

const GOLD = "#C9A84C";
const CHARCOAL = "#1a1a1a";
const MARGIN = 50;
const PAGE_WIDTH = 612;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export type SalePdfData = {
  saleNumber: string;
  saleDate: Date;
  status: SaleStatus;
  saleType: SaleType;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount: number;
  total: number;
  customerName: string | null;
  customerCode: string | null;
  sellerName: string;
  creditPlanNumber: string | null;
  items: Array<{
    productName: string;
    sku: string;
    lotNumber: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

function logoWidth(height: number, variant: "full" | "mark"): number {
  const aspect = variant === "full" ? 752 / 800 : 752 / 735;
  return height * aspect;
}

function drawLetterhead(doc: PdfDoc, saleNumber: string, logos: LetterheadLogos, compact = false) {
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
    .text("Comprobante de venta", textX, compact ? 14 : 18, {
      width: PAGE_WIDTH - textX - MARGIN,
    });

  if (!compact) {
    doc
      .fillColor("#999999")
      .fontSize(8)
      .text(saleNumber, 320, 22, { width: 240, align: "right" });
    doc.text(`Generado: ${formatDateTime(new Date())}`, 320, 38, {
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

function ensureSpace(doc: PdfDoc, needed: number, logos: LetterheadLogos, saleNumber: string) {
  if (doc.y + needed > doc.page.height - 60) {
    doc.addPage();
    drawLetterhead(doc, saleNumber, logos, true);
  }
}

export async function buildSalePdf(data: SalePdfData): Promise<Buffer> {
  const { loadLetterheadLogos } = await import("@/lib/pdf/horus-logo-image");
  const logos = await loadLetterheadLogos();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: MARGIN, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    drawLetterhead(doc, data.saleNumber, logos, false);

    if (data.status === "CANCELLED") {
      doc
        .fontSize(14)
        .fillColor("#b91c1c")
        .text("VENTA CANCELADA", MARGIN, doc.y, { width: CONTENT_WIDTH, align: "center" });
      doc.moveDown(0.6);
      doc.fillColor("#000000");
    }

    doc.fontSize(14).fillColor(CHARCOAL).text(data.saleNumber, MARGIN, doc.y);
    doc.moveDown(0.4);
    doc.fontSize(9).fillColor("#000000");

    const meta: Array<[string, string]> = [
      ["Fecha", formatDateTime(data.saleDate)],
      [
        "Cliente",
        data.customerName
          ? `${data.customerName}${data.customerCode ? ` (${data.customerCode})` : ""}`
          : "Mostrador",
      ],
      ["Vendedor", data.sellerName],
      ["Tipo", SALE_TYPE_LABELS[data.saleType]],
      ["Pago", PAYMENT_METHOD_LABELS[data.paymentMethod]],
      ["Estado", data.status === "COMPLETED" ? "Completada" : "Cancelada"],
    ];
    if (data.creditPlanNumber) {
      meta.push(["Cartera", data.creditPlanNumber]);
    }

    for (const [label, value] of meta) {
      ensureSpace(doc, 16, logos, data.saleNumber);
      doc
        .fillColor("#666666")
        .text(`${label}: `, MARGIN, doc.y, { continued: true, width: CONTENT_WIDTH });
      doc.fillColor("#000000").text(value);
    }

    doc.moveDown(0.8);
    ensureSpace(doc, 40, logos, data.saleNumber);
    doc.fontSize(11).fillColor(CHARCOAL).text("Detalle de productos", MARGIN, doc.y, {
      underline: true,
    });
    doc.moveDown(0.4);

    const colWidths = [170, 80, 45, 80, 80];
    const headers = ["Producto", "Lote", "Cant.", "Precio", "Subtotal"];
    let x = MARGIN;
    doc.fontSize(8).fillColor("#666666");
    const headerY = doc.y;
    headers.forEach((h, i) => {
      doc.text(h, x, headerY, { width: colWidths[i], lineBreak: false });
      x += colWidths[i]!;
    });
    doc.y = headerY + 14;
    doc
      .moveTo(MARGIN, doc.y)
      .lineTo(PAGE_WIDTH - MARGIN, doc.y)
      .strokeColor("#dddddd")
      .stroke();
    doc.moveDown(0.25);

    doc.fontSize(8).fillColor("#000000");
    for (const item of data.items) {
      ensureSpace(doc, 18, logos, data.saleNumber);
      const y = doc.y;
      const cells = [
        `${item.productName}${item.sku ? ` (${item.sku})` : ""}`.slice(0, 42),
        item.lotNumber,
        String(item.quantity),
        formatMoney(item.unitPrice),
        formatMoney(item.lineTotal),
      ];
      x = MARGIN;
      cells.forEach((cell, i) => {
        doc.text(cell, x, y, { width: colWidths[i], lineBreak: false });
        x += colWidths[i]!;
      });
      doc.y = y + 16;
    }

    doc.moveDown(0.8);
    ensureSpace(doc, 60, logos, data.saleNumber);
    doc
      .moveTo(MARGIN + 280, doc.y)
      .lineTo(PAGE_WIDTH - MARGIN, doc.y)
      .strokeColor("#dddddd")
      .stroke();
    doc.moveDown(0.3);

    const totals: Array<[string, string]> = [
      ["Subtotal", formatMoney(data.subtotal)],
      ["Descuento", formatMoney(data.discount)],
      ["Total", formatMoney(data.total)],
    ];
    for (const [label, value] of totals) {
      const isTotal = label === "Total";
      doc
        .fontSize(isTotal ? 11 : 9)
        .fillColor(isTotal ? CHARCOAL : "#000000")
        .text(label, MARGIN + 280, doc.y, { width: 100, continued: false });
      const y = doc.y - (isTotal ? 13 : 11);
      doc.text(value, MARGIN + 380, y, { width: 100, align: "right" });
      doc.moveDown(isTotal ? 0.5 : 0.25);
    }

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(7)
        .fillColor("#888888")
        .text(
          `DISTRIBUIDORA HORUS — Comprobante interno  |  Página ${i + 1} de ${range.count}`,
          MARGIN,
          doc.page.height - 40,
          { width: CONTENT_WIDTH, align: "center" }
        );
    }

    doc.end();
  });
}
