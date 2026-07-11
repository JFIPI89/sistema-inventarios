import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { formatMoney } from "@/lib/currency";

export function formatCurrency(amount: number): string {
  return formatMoney(amount);
}

export {
  formatDate,
  formatDateTime,
  formatDateKey,
  formatDateTimeIso,
  toDateKey,
  defaultDateRangeDays,
  parseAppDate,
  parseAppDateRange,
  APP_TIMEZONE,
  APP_LOCALE,
} from "@/lib/timezone";
