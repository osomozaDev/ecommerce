import type { GetProductsOptions } from "@/lib/commerce/provider";
import type { FilterParams } from "./types";

/**
 * Traducción URL ↔ opciones de catálogo. Vive junto a la barra para que
 * añadir un filtro nuevo toque un solo directorio.
 */

export const SORT_OPTIONS: {
  key: string;
  label: string;
  sort?: GetProductsOptions["sort"];
}[] = [
  { key: "", label: "Relevancia" },
  { key: "novedades", label: "Novedades", sort: "latest" },
  { key: "precio-asc", label: "Precio ↑", sort: "price-asc" },
  { key: "precio-desc", label: "Precio ↓", sort: "price-desc" },
];

export const PRICE_RANGES: {
  key: string;
  label: string;
  min?: number;
  max?: number;
}[] = [
  { key: "0-50", label: "Hasta 50", max: 50 },
  { key: "50-100", label: "50 – 100", min: 50, max: 100 },
  { key: "100-", label: "Más de 100", min: 100 },
];

/** Convierte los parámetros de URL en opciones para el provider. */
export function toCatalogOptions(params: FilterParams): {
  sort?: GetProductsOptions["sort"];
  available?: boolean;
  priceMin?: number;
  priceMax?: number;
} {
  const sort = SORT_OPTIONS.find((o) => o.key === (params.orden ?? ""))?.sort;
  const range = PRICE_RANGES.find((r) => r.key === params.precio);
  return {
    sort,
    available: params.stock === "1" ? true : undefined,
    priceMin: range?.min,
    priceMax: range?.max,
  };
}

/**
 * Construye la URL de la barra preservando el resto de filtros.
 * `extra` añade parámetros ajenos a la barra (p. ej. la paginación);
 * cambiar un filtro nunca arrastra `mostrar`, así la paginación se reinicia.
 */
export function filterHref(
  basePath: string,
  params: FilterParams,
  overrides: Partial<FilterParams>,
  extra?: Record<string, string>,
): string {
  const merged = { ...params, ...overrides };
  const search = new URLSearchParams();
  if (merged.orden) search.set("orden", merged.orden);
  if (merged.stock) search.set("stock", merged.stock);
  if (merged.precio) search.set("precio", merged.precio);
  for (const [k, v] of Object.entries(extra ?? {})) search.set(k, v);
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
