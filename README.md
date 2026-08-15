# Storefront Engine

Frontend ecommerce headless: **1 engine Next.js → N tiendas Shopify por
configuración**. Shopify hace el commerce (catálogo, carrito, checkout,
pagos); este proyecto hace la experiencia (frontend, branding, SEO).

**Producción**: https://ecommerce-one-theta-33.vercel.app
(tienda `stellazon.myshopify.com`; cada push a `main` despliega automáticamente).

## Arranque rápido

```bash
pnpm install
pnpm dev
```

Por defecto funciona en **modo fixtures** (sin credenciales ni red):

- Tienda: `http://localhost:3000`
- Laboratorio visual: `http://localhost:3000/dev/design-system`

Para conectar una tienda Shopify real: copia `.env.example` a `.env.local`,
pon `COMMERCE_DATA_SOURCE=shopify` y el `SHOPIFY_STOREFRONT_TOKEN` de la
tienda (el `storeDomain` va en `src/config/tenants/`).

## Documentación

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — capas, Shopify, ViewModels,
  carrito, tenants, caché, seguridad (lado plataforma).
- [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) — manual de UI: variantes,
  tokens, fixtures, qué tocar y qué no (lado diseño).

## Alta de tienda nueva

```bash
node scripts/nueva-tienda.mjs --id=cliente-x --nombre="Cliente X" \
  --store=cliente-x.myshopify.com --dominio=https://cliente-x.com
```

Multi-tenant por dominio: N tiendas en un deploy, resueltas por `Host`.
En local cada tienda responde en `http://<id>.localhost:3000`.

## Mapa rápido

```text
src/lib/commerce/   datos: ViewModels + providers (shopify | fixtures)
src/lib/cart/       Server Actions + useCart()
src/lib/tenant/     resolución de tenant
src/config/         tenants y themes (conectar tienda nueva = config)
src/theme/          Theme Engine (tokens → CSS variables)
src/components/     design system (variantes por registry)
src/blocks/         BlockRenderer para páginas configurables
src/fixtures/       datos de prueba con forma de ViewModel
src/app/            rutas, SEO, robots, sitemap
```
