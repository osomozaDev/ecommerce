import { Hero } from "@/components/storefront/hero";
import type { Block } from "./types";

export function HeroBlock({ block }: { block: Extract<Block, { type: "hero" }> }) {
  return (
    <Hero
      variant={block.variant}
      title={block.title}
      subtitle={block.subtitle}
      ctaLabel={block.ctaLabel}
      ctaHref={block.ctaHref}
      image={block.image}
    />
  );
}
