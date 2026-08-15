import type { MetadataRoute } from "next";
import { getTenant } from "@/lib/tenant/resolve";
import { getCommerce } from "@/lib/commerce/provider";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenant = getTenant();
  const commerce = getCommerce();
  const [products, collections] = await Promise.all([
    commerce.getProducts({ first: 100 }),
    commerce.getCollections(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: tenant.domain, changeFrequency: "daily", priority: 1 },
    { url: `${tenant.domain}/productos`, changeFrequency: "daily", priority: 0.9 },
  ];

  return [
    ...staticEntries,
    ...collections.map((c) => ({
      url: `${tenant.domain}${c.href}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${tenant.domain}${p.href}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
