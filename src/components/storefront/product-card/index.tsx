import { variantOf } from "@/theme";
import { productCardVariants } from "./variants";
import type { ProductCardProps } from "./types";

export async function ProductCard({
  variant,
  ...props
}: ProductCardProps & { variant?: string }) {
  const Variant =
    productCardVariants[variant ?? (await variantOf("productCard"))] ??
    productCardVariants.default;
  return <Variant {...props} />;
}
