import { variantOf } from "@/theme";
import { heroVariants } from "./variants";
import type { HeroProps } from "./types";

export function Hero({ variant, ...props }: HeroProps & { variant?: string }) {
  const Variant = heroVariants[variant ?? variantOf("hero")] ?? heroVariants.default;
  return <Variant {...props} />;
}
