import { variantOf } from "@/theme";
import { bannerVariants } from "./variants";
import type { BannerProps } from "./types";

export async function Banner({ variant, ...props }: BannerProps & { variant?: string }) {
  const Variant = bannerVariants[variant ?? (await variantOf("banner"))] ?? bannerVariants.default;
  return <Variant {...props} />;
}
