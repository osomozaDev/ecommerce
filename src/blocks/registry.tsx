import type { ComponentType } from "react";
import type { Block } from "./types";
import { HeroBlock } from "./HeroBlock";
import { FeaturedCollectionBlock } from "./FeaturedCollectionBlock";
import { BannerBlock } from "./BannerBlock";

/**
 * Registro de bloques. Añadir un tipo de bloque:
 *  1. Añadir el caso a la unión Block (types.ts).
 *  2. Crear su componente <XBlock>.
 *  3. Registrarlo aquí. `satisfies` obliga a que no falte ninguno.
 */
export const blockRegistry = {
  hero: HeroBlock,
  featuredCollection: FeaturedCollectionBlock,
  banner: BannerBlock,
} satisfies {
  [K in Block["type"]]: ComponentType<{ block: Extract<Block, { type: K }> }>;
};
