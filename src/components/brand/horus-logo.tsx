import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/brand/distribuidora-horus-logo.png";

const sizes = {
  sm: { width: 120, height: 40, className: "h-8 w-auto max-w-[120px]" },
  md: { width: 160, height: 53, className: "h-10 w-auto max-w-[160px]" },
  lg: { width: 220, height: 73, className: "h-14 w-auto max-w-[220px]" },
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
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md bg-[#1a1a1a] px-2 py-1",
        className
      )}
    >
      <Image
        src={LOGO_SRC}
        alt="Distribuidora Horus"
        width={s.width}
        height={s.height}
        className={cn(s.className, "object-contain")}
        priority={size === "lg"}
      />
    </div>
  );
}
