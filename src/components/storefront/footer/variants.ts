import type { ComponentType } from "react";
import type { FooterProps } from "./types";
import { DefaultFooter } from "./DefaultFooter";

export const footerVariants: Record<string, ComponentType<FooterProps>> = {
  default: DefaultFooter,
};
