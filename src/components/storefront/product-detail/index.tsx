import { variantOf } from "@/theme";
import { productDetailVariants } from "./variants";
import type { ProductDetailProps } from "./types";

export async function ProductDetail({
  variant,
  ...props
}: ProductDetailProps & { variant?: string }) {
  const Variant =
    productDetailVariants[variant ?? (await variantOf("productDetail"))] ??
    productDetailVariants.default;
  return <Variant {...props} />;
}
