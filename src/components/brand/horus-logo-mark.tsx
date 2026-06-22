import { cn } from "@/lib/utils";

const markSizes = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-12 w-12",
} as const;

export function HorusLogoMark({
  size = "md",
  className,
}: {
  size?: keyof typeof markSizes;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("shrink-0", markSizes[size], className)}
    >
      <path
        d="M24 4L42 40H6L24 4Z"
        stroke="var(--gold)"
        strokeWidth="1.75"
        strokeLinejoin="round"
        fill="color-mix(in srgb, var(--gold) 12%, transparent)"
      />
      <ellipse
        cx="24"
        cy="26"
        rx="9"
        ry="5.5"
        stroke="var(--gold)"
        strokeWidth="1.25"
        fill="var(--background)"
      />
      <circle
        cx="24"
        cy="26"
        r="3.25"
        fill="var(--gold-dim)"
        stroke="var(--gold-light)"
        strokeWidth="0.75"
      />
      <path
        d="M22 25.5c0-1.1.9-2 2-2s2 .9 2 2"
        stroke="var(--gold-light)"
        strokeWidth="0.6"
        fill="none"
        opacity="0.8"
      />
      <path
        d="M24 4v4M16 38h16"
        stroke="var(--gold)"
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}
