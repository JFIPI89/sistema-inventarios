export type SaleQtyMode = "UNIT" | "BOX";

/** Inventory units deducted for a cashier input of boxes or units. */
export function inventoryQtyFromSale(
  inputQty: number,
  saleMode: SaleQtyMode,
  unitsPerBox: number
) {
  const qty = Math.max(0, Math.floor(inputQty));
  const perBox = Math.max(1, Math.floor(unitsPerBox) || 1);
  if (saleMode === "BOX") return qty * perBox;
  return qty;
}
