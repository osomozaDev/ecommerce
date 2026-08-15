"use client";

import { useEffect } from "react";
import type { Product } from "@/lib/commerce/types";
import { trackViewItem } from "./track";

/** Emite view_item al montar la ficha de producto. Sin render. */
export function TrackViewItem({ product }: { product: Product }) {
  useEffect(() => {
    trackViewItem(product);
    // Solo al cambiar de producto, no en cada re-render del objeto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);
  return null;
}
