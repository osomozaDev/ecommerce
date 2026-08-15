import type { ComponentType } from "react";
import type { ProductGridProps } from "./types";
import { DefaultGrid } from "./DefaultGrid";

export const productGridVariants: Record<string, ComponentType<ProductGridProps>> = {
  default: DefaultGrid,
};
