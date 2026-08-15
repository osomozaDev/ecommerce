import { variantOf } from "@/theme";
import { filterBarVariants } from "./variants";
import type { FilterBarProps } from "./types";

export async function FilterBar({
  variant,
  ...props
}: FilterBarProps & { variant?: string }) {
  const Variant =
    filterBarVariants[variant ?? (await variantOf("filterBar"))] ??
    filterBarVariants.default;
  return <Variant {...props} />;
}
