import type { ComponentType } from "react";
import type { ConsentBannerProps } from "./types";
import { DefaultConsentBanner } from "./DefaultConsentBanner";

export const consentBannerVariants: Record<string, ComponentType<ConsentBannerProps>> = {
  default: DefaultConsentBanner,
};
