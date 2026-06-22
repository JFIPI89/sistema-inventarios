/** GS1 GTIN check digit validation (modulo 10) */
export function validateGtin(gtin: string): boolean {
  const digits = gtin.replace(/\D/g, "");
  if (![8, 12, 13, 14].includes(digits.length)) return false;

  const padded = digits.padStart(14, "0");
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    const n = parseInt(padded[i], 10);
    sum += i % 2 === 0 ? n * 3 : n;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(padded[13], 10);
}

/** GS1 AI 10: batch/lot — up to 20 alphanumeric chars */
export function validateLotNumber(lot: string): boolean {
  return lot.length > 0 && lot.length <= 20 && /^[A-Za-z0-9\-_.]+$/.test(lot);
}

export function normalizeGtin(gtin: string): string {
  return gtin.replace(/\D/g, "").padStart(14, "0");
}

export const GS1_FIELD_LABELS = {
  gtin: "GTIN (AI 01)",
  lotNumber: "Lote / Batch (AI 10)",
  productionDate: "Fecha producción (AI 11)",
  expirationDate: "Vencimiento (AI 17)",
  bestBeforeDate: "Consumir preferente (AI 15)",
  serialNumber: "Número de serie (AI 21)",
} as const;
