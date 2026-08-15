import { Banner } from "@/components/storefront/banner";
import type { Block } from "./types";

export function BannerBlock({ block }: { block: Extract<Block, { type: "banner" }> }) {
  return <Banner variant={block.variant} text={block.text} href={block.href} />;
}
