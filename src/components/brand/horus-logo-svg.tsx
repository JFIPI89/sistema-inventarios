import {
  HORUS_LOGO_VIEWBOX,
  pathBase,
  pathDetail,
  pathInk,
  pathMid,
  type HorusLogoVariant,
} from "@/lib/brand/horus-logo-paths";
import { FRONTEND_LOGO_FILLS } from "@/lib/brand/build-horus-logo-svg";
import { cn } from "@/lib/utils";

const heights = {
  sm: "h-11",
  md: "h-12",
  lg: "h-36",
} as const;

export function HorusLogoSvg({
  variant = "full",
  size = "md",
  className,
}: {
  variant?: HorusLogoVariant;
  size?: keyof typeof heights;
  className?: string;
}) {
  const viewBox = HORUS_LOGO_VIEWBOX[variant];

  return (
    <svg
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("w-auto shrink-0", heights[size], className)}
    >
      <path d={pathBase} fill={FRONTEND_LOGO_FILLS.base} />
      <path d={pathDetail} fill={FRONTEND_LOGO_FILLS.detail} />
      <path d={pathMid} fill={FRONTEND_LOGO_FILLS.mid} />
      <path d={pathInk} fill={FRONTEND_LOGO_FILLS.ink} />
    </svg>
  );
}
