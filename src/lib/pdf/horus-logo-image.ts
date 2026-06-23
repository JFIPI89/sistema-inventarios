import sharp from "sharp";
import {
  buildHorusLogoSvg,
  PDF_LOGO_COLORS,
} from "@/lib/brand/build-horus-logo-svg";
import type { HorusLogoVariant } from "@/lib/brand/horus-logo-paths";

const cache = new Map<string, Buffer>();

export async function getHorusLogoPng(
  variant: HorusLogoVariant,
  heightPx: number
): Promise<Buffer> {
  const key = `${variant}:${heightPx}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const svg = buildHorusLogoSvg(PDF_LOGO_COLORS, variant);
  const png = await sharp(Buffer.from(svg)).png().resize({ height: heightPx }).toBuffer();
  cache.set(key, png);
  return png;
}

export async function loadLetterheadLogos() {
  const [full, mark] = await Promise.all([
    getHorusLogoPng("full", 256),
    getHorusLogoPng("mark", 160),
  ]);
  return { full, mark };
}

export type LetterheadLogos = Awaited<ReturnType<typeof loadLetterheadLogos>>;
