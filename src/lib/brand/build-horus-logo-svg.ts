import {
  HORUS_LOGO_VIEWBOX,
  pathBase,
  pathDetail,
  pathInk,
  pathMid,
  type HorusLogoVariant,
} from "@/lib/brand/horus-logo-paths";

export type HorusLogoColors = {
  ink: string;
  detail: string;
  mid: string;
  base: string;
};

export function buildHorusLogoSvg(
  colors: HorusLogoColors,
  variant: HorusLogoVariant = "full"
): string {
  const viewBox = HORUS_LOGO_VIEWBOX[variant];
  const baseFill =
    colors.base === "transparent" || colors.base === "none" ? "none" : colors.base;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
  <path d="${pathBase}" fill="${baseFill}"/>
  <path d="${pathDetail}" fill="${colors.detail}"/>
  <path d="${pathMid}" fill="${colors.mid}"/>
  <path d="${pathInk}" fill="${colors.ink}"/>
</svg>`;
}

/** Frontend palette via CSS variables (used in inline SVG with var()). */
export const FRONTEND_LOGO_FILLS = {
  base: "var(--logo-base)",
  detail: "var(--logo-detail)",
  mid: "var(--logo-mid)",
  ink: "var(--logo-ink)",
} as const;

/** PDF letterhead on charcoal band. */
export const PDF_LOGO_COLORS: HorusLogoColors = {
  ink: "#f0ede8",
  detail: "#c9a84c",
  mid: "#a8a4a0",
  base: "none",
};

/** Favicon / static SVG on light background. */
export const FAVICON_LOGO_COLORS: HorusLogoColors = {
  ink: "#1a1816",
  detail: "#8a8580",
  mid: "#b8b4ae",
  base: "#f5f2ec",
};
