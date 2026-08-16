import { variantOf } from "@/theme";
import { reviewsVariants } from "./variants";
import type { ReviewsProps } from "./types";

export async function Reviews({
  variant,
  ...props
}: ReviewsProps & { variant?: string }) {
  const Variant =
    reviewsVariants[variant ?? (await variantOf("reviews"))] ??
    reviewsVariants.default;
  return <Variant {...props} />;
}
