const MXN_FORMATTER = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: process.env.CURRENCY_CODE || "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a decimal amount (e.g. sale.total) as MXN. */
export function formatMoney(amount: number): string {
  if (!Number.isFinite(amount)) return MXN_FORMATTER.format(0);
  return MXN_FORMATTER.format(amount);
}

/** Format integer cents as MXN. */
export function formatMoneyCents(cents: number): string {
  return formatMoney(cents / 100);
}

export function getCurrencyCode(): string {
  return process.env.CURRENCY_CODE || "MXN";
}
