import type { ComponentType } from "react";
import type { Block } from "./types";
import { blockRegistry } from "./registry";

/**
 * Renderiza una página definida como lista de bloques (config del tenant,
 * futuro CMS/IA). Los bloques desconocidos se ignoran de forma segura para
 * que una config más nueva no rompa un storefront desplegado.
 */
export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col gap-[var(--section-gap)] pb-[var(--section-gap)]">
      {blocks.map((block, index) => {
        const Component = blockRegistry[block.type] as
          | ComponentType<{ block: Block }>
          | undefined;
        if (!Component) return null;
        return <Component key={`${block.type}-${index}`} block={block} />;
      })}
    </div>
  );
}
