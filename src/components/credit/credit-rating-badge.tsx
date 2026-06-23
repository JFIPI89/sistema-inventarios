import { Badge } from "@/components/ui/badge";
import type { CreditRating } from "@/lib/credit-metrics";
import { RATING_LABELS } from "@/lib/credit-metrics";
import { cn } from "@/lib/utils";

const VARIANT: Record<Exclude<CreditRating, null>, "success" | "default" | "warning" | "destructive"> = {
  A: "success",
  B: "default",
  C: "warning",
  D: "destructive",
};

export function CreditRatingBadge({
  rating,
  label,
  className,
}: {
  rating: CreditRating;
  label?: string;
  className?: string;
}) {
  if (!rating) {
    return (
      <Badge variant="secondary" className={className}>
        Sin historial
      </Badge>
    );
  }

  return (
    <Badge variant={VARIANT[rating]} className={cn("font-mono", className)} title={label ?? RATING_LABELS[rating]}>
      {rating} — {label ?? RATING_LABELS[rating]}
    </Badge>
  );
}
