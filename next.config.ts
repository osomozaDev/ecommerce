import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Imágenes reales de producto: CDN de Shopify.
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
    // Los placeholders de fixtures son SVG locales; se sirven sandboxed.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
