import type { ComponentType } from "react";
import type { FilterBarProps } from "./types";
import { DefaultFilterBar } from "./DefaultFilterBar";

export const filterBarVariants: Record<string, ComponentType<FilterBarProps>> = {
  default: DefaultFilterBar,
};
