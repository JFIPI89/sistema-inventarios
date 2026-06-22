import { cn } from "@/lib/utils";

export function HorusEye({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 130 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <polygon
        points="65,12 118,108 12,108"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.8"
      />
      <ellipse
        cx="65"
        cy="75"
        rx="30"
        ry="16"
        stroke="currentColor"
        strokeWidth="2"
        fill="var(--surface)"
      />
      <circle
        cx="65"
        cy="75"
        r="10"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="color-mix(in srgb, var(--gold) 8%, transparent)"
      />
      <circle cx="65" cy="75" r="3" fill="currentColor" />
      <circle cx="63" cy="73" r="1" fill="color-mix(in srgb, white 60%, transparent)" />
    </svg>
  );
}

export function HorusLogo({
  size = "md",
  subtitle = "inventarios",
  className,
}: {
  size?: "sm" | "md" | "lg";
  subtitle?: string;
  className?: string;
}) {
  const sizes = {
    sm: { eye: 24, title: "text-sm", sub: "text-[8px]" },
    md: { eye: 32, title: "text-lg", sub: "text-[9px]" },
    lg: { eye: 80, title: "text-4xl", sub: "text-xs" },
  };
  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <HorusEye size={s.eye} className="text-gold" />
      <div>
        <span
          className={cn(
            "block font-cinzel font-black tracking-[0.25em] text-gold",
            s.title
          )}
        >
          HORUS
        </span>
        {subtitle ? (
          <span
            className={cn(
              "block font-space-mono uppercase leading-none tracking-[0.15em] text-muted-foreground",
              s.sub,
              size === "lg" && "-mt-1"
            )}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}
