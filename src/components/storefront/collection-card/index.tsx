import { variantOf } from "@/theme";
import { collectionCardVariants } from "./variants";
import type { CollectionCardProps } from "./types";

export async function CollectionCard({
  variant,
  ...props
}: CollectionCardProps & { variant?: string }) {
  const Variant =
    collectionCardVariants[variant ?? (await variantOf("collectionCard"))] ??
    collectionCardVariants.default;
  return <Variant {...props} />;
}
