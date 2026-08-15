import type { ComponentType } from "react";
import type { HeroProps } from "./types";
import { DefaultHero } from "./DefaultHero";
import { EditorialHero } from "./EditorialHero";

export const heroVariants: Record<string, ComponentType<HeroProps>> = {
  default: DefaultHero,
  editorial: EditorialHero,
};
