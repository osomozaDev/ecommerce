import type { Product } from "@/lib/commerce/types";

export interface ProductGridProps {
  products: Product[];
  /** Variante de card a usar dentro del grid (por defecto, la del theme). */
  cardVariant?: string;
}
