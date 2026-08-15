import type { ComponentType } from "react";
import type { BannerProps } from "./types";
import { DefaultBanner } from "./DefaultBanner";

export const bannerVariants: Record<string, ComponentType<BannerProps>> = {
  default: DefaultBanner,
};
