import { variantOf } from "@/theme";
import { consentBannerVariants } from "./variants";
import type { ConsentBannerProps } from "./types";

export async function ConsentBanner({
  variant,
  ...props
}: ConsentBannerProps & { variant?: string }) {
  const Variant =
    consentBannerVariants[variant ?? (await variantOf("consentBanner"))] ??
    consentBannerVariants.default;
  return <Variant {...props} />;
}
