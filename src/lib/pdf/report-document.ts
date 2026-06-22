import PDFDocument from "pdfkit";
import { readFileSync } from "fs";
import { join } from "path";

type PdfDoc = InstanceType<typeof PDFDocument>;

const GOLD = "#C9A84C";
const CHARCOAL = "#1a1a1a";
const MARGIN = 50;
const PAGE_WIDTH = 612;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

import type { ReportSection } from "@/lib/reports/sections";

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
};

function money(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: process.env.CURRENCY_CODE || "USD",
  }).format(n);
}

function logoPath(): string {
  return join(process.cwd(), "public/brand/distribuidora-horus-logo.png");
}

function drawLetterhead(
  doc: PdfDoc,
  title: string,
  startDate: string,
  endDate: string,
  compact = false
) {
  const bandHeight = compact ? 56 : 72;

  doc.rect(0, 0, PAGE_WIDTH, bandHeight).fill(CHARCOAL);

  try {
    const logo = readFileSync(logoPath());
    doc.image(logo, MARGIN, compact ? 8 : 10, { height: compact ? 36 : 48 });
  } catch {
    doc.fillColor("#ffffff").fontSize(compact ? 12 : 14).text("DISTRIBUIDORA HORUS", MARGIN, compact ? 18 : 24);
  }

  doc
    .fillColor(GOLD)
    .fontSize(compact ? 9 : 10)
    .text("DISTRIBUIDORA HORUS", MARGIN + (compact ? 100 : 120), compact ? 14 : 18, {
      width: 200,
    });

  doc
    .fillColor("#cccccc")
    .fontSize(compact ? 8 : 9)
    .text(title, MARGIN + (compact ? 100 : 120), compact ? 28 : 36, { width: 280 });

  if (!compact) {
    doc
      .fillColor("#999999")
      .fontSize(8)
      .text(`Período: ${startDate} — ${endDate}`, MARGIN + 120, 52, { width: 280 });
    doc.text(`Generado: ${new Date().toLocaleString("es-MX")}`, 350, 52, {
      width: 200,
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

function ensureSpace(doc: PdfDoc, needed: number, ctx: { title: string; start: string; end: string }) {
  if (doc.y + needed > doc.page.height - 60) {
    doc.addPage();
    drawLetterhead(doc, ctx.title, ctx.start, ctx.end, true);
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
  ctx: { title: string; start: string; end: string }
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

export function buildReportPdf(data: ReportPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: MARGIN, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const ctx = {
      title: "Informe de operaciones",
      start: data.startDate,
      end: data.endDate,
    };

    drawLetterhead(doc, ctx.title, data.startDate, data.endDate);

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
