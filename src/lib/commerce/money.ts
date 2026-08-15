import type { Money } from "./types";

/** Construye un Money con el importe ya formateado. Único punto de formateo de precios. */
export function money(
  amount: number,
  currencyCode = "EUR",
  locale = "es-ES",
): Money {
  return {
    amount,
    currencyCode,
    formatted: new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
    }).format(amount),
  };
}
