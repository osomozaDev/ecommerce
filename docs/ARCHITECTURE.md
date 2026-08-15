# Arquitectura — Storefront Engine

Un único frontend Next.js que sirve **N tiendas Shopify por configuración**.
Shopify es el motor comercial (catálogo, carrito, checkout, pagos, pedidos);
nosotros controlamos frontend, experiencia, branding y SEO.

Documento para el lado plataforma (Omar). El manual de UI está en
[DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md).

## Capas

Dependencia estrictamente descendente. La frontera con el design system son
los **ViewModels**: ningún tipo de Shopify cruza hacia la UI.

```text
Shopify Storefront API (GraphQL)
        ↓
INFRAESTRUCTURA   src/lib/commerce/shopify/     [server-only]
  client.ts · queries/ · mutations/ · types.ts (crudos) · mappers.ts
        ↓
DOMINIO           src/lib/commerce/
  types.ts (ViewModels) · provider.ts (interfaz + selección) · fixtures/
        ↓  ══ EL CONTRATO ══
DESIGN SYSTEM     src/components/ + src/theme/ + src/fixtures/
        ↓
BLOQUES/PÁGINAS   src/blocks/ + src/app/
```

## Flujo de datos (catálogo)

```text
Shopify → shopifyFetch (fetch + revalidate/tags) → tipo crudo ShopifyProduct
       → mappers.ts → Product (ViewModel) ←—— fixtures/products.ts
       → <ProductCard product={p} />          (la UI no sabe el origen)
```

- `Money` llega **ya formateado** (`Intl.NumberFormat` con el locale del
  tenant). La UI nunca formatea precios.
- `href` llega ya resuelto (`/productos/<handle>`). La UI nunca construye rutas.
- `badge`, `available`, `variantTitle` llegan ya derivados.

## Provider conmutable

`getCommerce()` (src/lib/commerce/provider.ts) devuelve una implementación de
`CommerceProvider` según `COMMERCE_DATA_SOURCE`:

| | `shopify` | `fixtures` |
|---|---|---|
| Catálogo | Storefront API | `src/fixtures/*` |
| Carrito | Cart API de Shopify | Map en memoria del proceso dev |
| Uso | producción / staging | desarrollo de UI, demos, arranque sin credenciales |

Es la única abstracción "extra" del proyecto: paga su coste permitiendo
trabajar sin Shopify y sin red.

## Carrito

```text
UI (Client Component)
  → useCart()                       src/lib/cart/cart-context.tsx
  → Server Action                   src/lib/cart/actions.ts
  → cookie httpOnly "cartId" + getCommerce()
  → Shopify Cart API (o fixtures)
  → Cart (ViewModel) fresco → re-render
  → "Finalizar compra" → cart.checkoutUrl → Shopify Checkout
```

- `useCart()` expone `{ cart, addItem, updateItem, removeItem, isPending }`.
  Context ligero + `useOptimistic`: cantidades y totales responden al instante.
- El `cartId` vive en cookie httpOnly (30 días). El cliente jamás ve ids de
  mutación ni el token.
- **No hay checkout propio**: el pago ocurre siempre en Shopify.

## Tenant

- Config pública en `src/config/tenants/<id>.ts` (`TenantConfig`): branding,
  theme, bloques de homepage, `shopify.storeDomain`.
- **Secretos solo en env** (`SHOPIFY_STOREFRONT_TOKEN`), nunca en la config ni
  con prefijo `NEXT_PUBLIC_`.
- Fase 1: un tenant por despliegue, seleccionado con `TENANT_ID`.
  `getTenant()` (src/lib/tenant/resolve.ts) es el único punto de resolución:
  evolucionar a resolución por dominio (middleware) no toca la UI.

### Conectar una tienda nueva (test arquitectónico)

1. `src/config/tenants/mi-tienda.ts` (copiar `tienda-b.ts`).
2. `src/config/themes/mi-theme.ts` si quiere identidad propia.
3. Registrarla en `src/lib/tenant/resolve.ts` (1 línea).
4. Env del despliegue: `TENANT_ID=mi-tienda`, `COMMERCE_DATA_SOURCE=shopify`,
   `SHOPIFY_STOREFRONT_TOKEN=…`.

Cero cambios en `components/`, `lib/commerce/`, `app/`. Si algún cambio de
tienda exige tocar esas carpetas, la arquitectura se ha roto: revisarla.

## Theme Engine

- `ThemeConfig` = `tokens` (fuentes, escala, radios, container, spacing,
  colores) + `components` (variante activa por componente).
- `ThemeStyle` inyecta los tokens como CSS custom properties en `:root`;
  `globals.css` los mapea a utilidades Tailwind (`bg-brand`, `rounded-base`…).
- Detalle en [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md).

## Blocks

Las páginas configurables se definen como `Block[]` (src/blocks/types.ts) en
el tenant y se renderizan con `<BlockRenderer/>`. Los bloques con datos
(`featuredCollection`) los cargan server-side vía `getCommerce()`. Los tipos
desconocidos se ignoran (una config más nueva no rompe un storefront viejo).
En el futuro esta config la generará IA/CMS; el patrón ya está.

## Caché y revalidación

- Catálogo: `next: { revalidate: 300, tags }` en `shopifyFetch`.
  Tags: `products`, `product:<handle>`, `collections`, `collection:<handle>`.
- Carrito: siempre `no-store` (dato por-usuario).
- Las páginas del storefront son dinámicas (leen la cookie del carrito en el
  layout); el coste real lo amortigua la caché de datos de fetch.

### Invalidación por webhook (implementado)

```text
Shopify Webhook (products/*, collections/*)
  → POST /api/webhooks/shopify        src/app/api/webhooks/shopify/route.ts
  → verificación HMAC (SHOPIFY_WEBHOOK_SECRET)
  → revalidateTag("product:<handle>") / revalidateTag("products") / …
```

Alta en Shopify: admin → **Settings → Notifications → Webhooks** → crear
suscripciones `products/create|update|delete` y
`collections/create|update|delete` apuntando a
`https://<dominio>/api/webhooks/shopify` (formato JSON). El secreto de firma
de esa página va en `SHOPIFY_WEBHOOK_SECRET` (Vercel + .env.local).
Sin webhooks configurados, la ventana máxima de dato obsoleto sigue siendo
`revalidate` (300 s) — el sistema funciona igual, solo tarda más en reflejar
cambios de catálogo.

## Seguridad

- Todo acceso a Shopify es server-side (Server Components + Server Actions).
- `import "server-only"` en `lib/commerce/*` y `lib/tenant/resolve.ts`:
  importarlos desde un Client Component **rompe el build**.
- Token Storefront solo en env server. Sin Admin API en esta fase (no se
  necesita; no introducirla desde el navegador jamás).
- Inputs de Server Actions validados (cantidad entera 1–99, ids presentes).
- `robots`: `/dev/` y `/carrito` excluidos; `/dev/design-system` además
  lleva metadata `noindex`.

## SEO

- `generateMetadata` en producto y colección desde datos Shopify
  (title, description, OG image), canonical relativo + `metadataBase` desde
  `tenant.domain`.
- `sitemap.ts` dinámico (home, productos, colecciones) y `robots.ts`.

## Responsabilidades

| Zona | Owner | Contenido |
|---|---|---|
| `src/lib/` | Omar | Shopify, providers, cart actions, tenant |
| `src/config/` | Omar | tenants (Javi puede editar themes con revisión) |
| `src/app/` | Omar | rutas, layouts, SEO técnico |
| `src/components/` | Javi | design system completo |
| `src/theme/` | Javi | tokens, tipos de theme |
| `src/fixtures/` | Javi | datos de prueba (respetando ViewModels) |
| `src/blocks/` | ambos | Omar: datos/registro · Javi: presentación |

## Comandos

```bash
pnpm dev      # desarrollo (fixtures por defecto)
pnpm build    # build de producción
pnpm lint     # eslint
```

Variables: ver [.env.example](../.env.example).
