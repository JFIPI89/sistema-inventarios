import type {
  CreditInstallmentStatus,
  CreditPeriodUnit,
  CreditPlanStatus,
  PaymentMethod,
  SaleType,
} from "@prisma/client";

export const SALE_TYPE_LABELS: Record<SaleType, string> = {
  CONTADO: "Contado",
  CREDITO: "Crédito",
};

export const CREDIT_PLAN_STATUS_LABELS: Record<CreditPlanStatus, string> = {
  ACTIVE: "Activo",
  PAID: "Pagado",
  CANCELLED: "Cancelado",
};

export const CREDIT_INSTALLMENT_STATUS_LABELS: Record<CreditInstallmentStatus, string> = {
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagada",
  OVERDUE: "Vencida",
};

export const CREDIT_PERIOD_LABELS: Record<CreditPeriodUnit, string> = {
  WEEKS: "Semanas",
  MONTHS: "Meses",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  OTHER: "Otro",
};
