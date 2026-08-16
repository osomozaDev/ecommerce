import type { MetadataRoute } from "next";
import { getTenant } from "@/lib/tenant/resolve";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const tenant = await getTenant();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dev/", "/carrito", "/buscar", "/cuenta", "/api/", "/admin", "/favoritos"],
      },
    ],
    sitemap: `${tenant.domain}/sitemap.xml`,
  };
}
