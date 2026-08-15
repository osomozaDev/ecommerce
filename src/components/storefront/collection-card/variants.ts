import type { ComponentType } from "react";
import type { CollectionCardProps } from "./types";
import { DefaultCollectionCard } from "./DefaultCollectionCard";

export const collectionCardVariants: Record<string, ComponentType<CollectionCardProps>> = {
  default: DefaultCollectionCard,
};
