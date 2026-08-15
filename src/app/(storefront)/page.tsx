import { getTenant } from "@/lib/tenant/resolve";
import { BlockRenderer } from "@/blocks/BlockRenderer";

/** La homepage es 100 % configuración: bloques definidos en el tenant. */
export default function HomePage() {
  const tenant = getTenant();
  return <BlockRenderer blocks={tenant.pages.homepage} />;
}
