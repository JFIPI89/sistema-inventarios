import type PDFDocument from "pdfkit";

type PdfDoc = InstanceType<typeof PDFDocument>;

const GOLD = "#C9A84C";
const GOLD_LIGHT = "#E8C97A";
const GOLD_DIM = "#8B6B2A";

/** Draw Horus isotipo (triangle + eye) scaled to `size` pt at (x, y). */
export function drawHorusMarkPdf(doc: PdfDoc, x: number, y: number, size: number) {
  const s = size / 48;

  doc.save();

  // Triangle
  doc
    .moveTo(x + 24 * s, y + 4 * s)
    .lineTo(x + 42 * s, y + 40 * s)
    .lineTo(x + 6 * s, y + 40 * s)
    .closePath()
    .fillOpacity(0.12)
    .fillColor(GOLD)
    .fill()
    .fillOpacity(1)
    .strokeColor(GOLD)
    .lineWidth(1.75 * s)
    .stroke();

  // Eye ellipse
  doc
    .ellipse(x + 24 * s, y + 26 * s, 9 * s, 5.5 * s)
    .fillColor(CHARCOAL_FILL)
    .fill()
    .strokeColor(GOLD)
    .lineWidth(1.25 * s)
    .stroke();

  // Pupil
  doc
    .circle(x + 24 * s, y + 26 * s, 3.25 * s)
    .fillColor(GOLD_DIM)
    .fill()
    .strokeColor(GOLD_LIGHT)
    .lineWidth(0.75 * s)
    .stroke();

  doc.restore();
}

const CHARCOAL_FILL = "#1a1a1a";

export const PDF_BRAND = {
  GOLD,
  GOLD_LIGHT,
  CHARCOAL: CHARCOAL_FILL,
} as const;
