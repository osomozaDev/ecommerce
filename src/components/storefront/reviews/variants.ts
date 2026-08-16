import type { ComponentType } from "react";
import type { ReviewsProps } from "./types";
import { DefaultReviews } from "./DefaultReviews";

export const reviewsVariants: Record<string, ComponentType<ReviewsProps>> = {
  default: DefaultReviews,
};
