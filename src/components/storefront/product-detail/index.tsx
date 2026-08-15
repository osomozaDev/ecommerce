import { variantOf } from "@/theme";
import { productDetailVariants } from "./variants";
import type { ProductDetailProps } from "./types";

export function ProductDetail({
  variant,
  ...props
}: ProductDetailProps & { variant?: string }) {
  const Variant =
    productDetailVariants[variant ?? variantOf("productDetail")] ??
    productDetailVariants.default;
  return <Variant {...props} />;
}
