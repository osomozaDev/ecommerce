import type { MetadataRoute } from "next";
import { getTenant } from "@/lib/tenant/resolve";

export default function robots(): MetadataRoute.Robots {
  const tenant = getTenant();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dev/", "/carrito"],
      },
    ],
    sitemap: `${tenant.domain}/sitemap.xml`,
  };
}
