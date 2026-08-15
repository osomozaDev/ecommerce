import { variantOf } from "@/theme";
import { footerVariants } from "./variants";
import type { FooterProps } from "./types";

export function Footer({ variant, ...props }: FooterProps & { variant?: string }) {
  const Variant = footerVariants[variant ?? variantOf("footer")] ?? footerVariants.default;
  return <Variant {...props} />;
}
