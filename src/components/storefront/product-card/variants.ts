import type { ComponentType } from "react";
import type { ProductCardProps } from "./types";
import { DefaultCard } from "./DefaultCard";
import { MinimalCard } from "./MinimalCard";

export const productCardVariants: Record<string, ComponentType<ProductCardProps>> = {
  default: DefaultCard,
  minimal: MinimalCard,
};
