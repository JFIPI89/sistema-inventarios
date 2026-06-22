import Link from "next/link";
import { cn } from "@/lib/utils";
import { HorusLogoMark } from "@/components/brand/horus-logo-mark";

const sizes = {
  sm: {
    mark: "sm" as const,
    label: "text-[8px] tracking-[0.18em]",
    title: "text-sm tracking-[0.12em]",
    gap: "gap-2",
  },
  md: {
    mark: "md" as const,
    label: "text-[9px] tracking-[0.2em]",
    title: "text-base tracking-[0.14em]",
    gap: "gap-2.5",
  },
  lg: {
    mark: "lg" as const,
    label: "text-[10px] tracking-[0.22em]",
    title: "text-xl tracking-[0.16em]",
    gap: "gap-3",
  },
} as const;

export function HorusLogo({
  size = "md",
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  const s = sizes[size];

  return (
    <Link
      href="/"
      aria-label="Ir al inicio — Distribuidora Horus"
      className={cn(
        "inline-flex shrink-0 items-center rounded-md text-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        s.gap,
        className
      )}
    >
      <HorusLogoMark size={s.mark} />
      <span className="min-w-0 text-left leading-tight">
        <span
          className={cn(
            "block font-cinzel font-bold uppercase text-muted-foreground",
            s.label
          )}
        >
          Distribuidora
        </span>
        <span className={cn("block font-cinzel font-black uppercase", s.title)}>
          Horus
        </span>
      </span>
    </Link>
  );
}
