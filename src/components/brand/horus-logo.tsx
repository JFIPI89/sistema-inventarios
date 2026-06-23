import Link from "next/link";
import { HorusLogoSvg } from "@/components/brand/horus-logo-svg";
import { cn } from "@/lib/utils";

const config = {
  sm: { variant: "mark" as const, size: "sm" as const },
  md: { variant: "mark" as const, size: "md" as const },
  lg: { variant: "full" as const, size: "lg" as const },
};

export function HorusLogo({
  size = "md",
  className,
}: {
  size?: keyof typeof config;
  className?: string;
}) {
  const c = config[size];

  return (
    <Link
      href="/"
      aria-label="Ir al inicio — Distribuidora Horus"
      className={cn(
        "inline-flex shrink-0 items-center overflow-visible rounded-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <HorusLogoSvg variant={c.variant} size={c.size} />
    </Link>
  );
}
