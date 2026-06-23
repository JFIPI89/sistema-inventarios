export type ReportSection =
  | "sales"
  | "products"
  | "customers"
  | "profit"
  | "inventory"
  | "credit";

export const VALID_SECTIONS: ReportSection[] = [
  "sales",
  "products",
  "customers",
  "profit",
  "inventory",
  "credit",
];

export function parseSections(param: string): ReportSection[] {
  return param
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is ReportSection =>
      VALID_SECTIONS.includes(s as ReportSection)
    );
}
