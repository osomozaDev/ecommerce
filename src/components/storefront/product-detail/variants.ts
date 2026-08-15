import type { ComponentType } from "react";
import type { ProductDetailProps } from "./types";
import { DefaultDetail } from "./DefaultDetail";

export const productDetailVariants: Record<string, ComponentType<ProductDetailProps>> = {
  default: DefaultDetail,
};
