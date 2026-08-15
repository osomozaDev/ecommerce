import type { ComponentType } from "react";
import { DefaultCartView } from "./DefaultCartView";

export const cartVariants: Record<string, ComponentType> = {
  default: DefaultCartView,
};
