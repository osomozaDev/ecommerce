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

## Tenant (multi-tenant por dominio — fase 2)

- Cada tienda es un **JSON** en `src/config/tenants/<id>.json` (branding,
  theme por nombre, bloques de homepage, dominios, `shopify.storeDomain`,
  `dataSource` opcional). Los JSON se validan e hidratan en
  `src/lib/tenant/registry.ts` (referencia de theme → `config/themes`,
  bloques desconocidos descartados). Este formato es el que en el futuro
  generará la IA/CMS.
- **Resolución por request** (`getTenant()`, async): primero por `Host`
  (dominio canónico o alias en `domains`, p. ej. `tienda-b.localhost`);
  fallback a `TENANT_ID` para hosts no registrados y prerender estático.
  **N dominios → 1 deploy.**
- **Secretos por tenant** vía convención de env con fallback:
  `SHOPIFY_STOREFRONT_TOKEN__TIENDA_B` > `SHOPIFY_STOREFRONT_TOKEN`
  (ídem `SHOPIFY_WEBHOOK_SECRET__*`). Nunca en los JSON ni con `NEXT_PUBLIC_`.
- **Data source por tenant**: `dataSource: "fixtures" | "shopify"` en el JSON
  (fallback al env `COMMERCE_DATA_SOURCE`). Una tienda demo en fixtures y una
  real en Shopify conviven en el mismo deploy; las tiendas nuevas nacen en
  fixtures hasta tener token.
- **Caché aislada por tenant**: los tags llevan namespace (`t:<id>:products`),
  y el webhook resuelve el tenant por `X-Shopify-Shop-Domain`, verifica con
  SU secreto e invalida solo SUS tags.

### Config externa sin deploy (fase 3, opcional)

Con `TENANTS_URL` definida, el registro carga además un array JSON remoto de
tenants que PISA a los del repo por id (revalidación 300 s, tag `tenants`).
Editar una tienda deja de requerir deploy; `POST /api/revalidate` con el
bearer `REVALIDATE_SECRET` aplica cambios al instante. Si la URL falla, se
sirven los tenants del repo (fail-safe).

### Identidad visual por datos: `themeOverrides` (fase 3)

Un tenant puede llevar `themeOverrides` (tokens y variantes parciales) que se
mezclan sobre su theme base en la hidratación: identidad visual completa sin
crear archivos de theme. Es el formato que produce la generación por IA.

### Generación de tiendas por IA (fase 3)

```bash
node scripts/genera-tienda.mjs \
  --brief="Tienda de velas artesanales de lujo llamada Lumen" \
  --store=lumen.myshopify.com --dominio=https://lumen.com \
  [--colecciones=novedades,esenciales]
```

Claude (claude-opus-5, structured outputs contra el JSON Schema del tenant)
diseña naming, copy, paleta accesible, tipografías, variantes y bloques; el
script lo registra como una tienda más, nacida en fixtures. Requiere
`ANTHROPIC_API_KEY` (o `ant auth login`) solo al ejecutarlo.

### Analítica por tenant (fase 3)

Capa propia de eventos ecommerce con esquema GA4 (`src/lib/analytics/`):
`view_item`, `add_to_cart`, `remove_from_cart`, `begin_checkout` y `search`,
emitidos desde la UI vía `track()`/helpers. Los eventos van SIEMPRE a
`window.dataLayer` (compatible con Google Tag Manager y verificado en e2e sin
vendor); los vendors se configuran por tenant en su JSON — ids públicos, no
secretos:

```json
"analytics": { "ga4MeasurementId": "G-XXXXXXXXXX", "plausibleDomain": "tienda.com" }
```

Sin configuración no se carga ningún script externo.

**Consentimiento (RGPD)**: si el tenant define un vendor, el layout muestra
el banner de cookies (`consent-banner`, variantable) hasta que el visitante
decide; la decisión vive 180 días en la cookie `cookie_consent` y
`AnalyticsScripts` solo inyecta vendors con consentimiento CONCEDIDO
(`src/lib/analytics/consent.ts` / `consent-server.ts`). Con rechazo o sin
decisión: cero scripts de terceros (verificado en e2e). Los eventos de
dataLayer son first-party y no requieren banner, por eso una tienda sin
vendor no lo muestra.

### Reseñas de producto (fase 3)

`getProductReviews(handle)` en el provider devuelve `ProductReviews`
(media, total y lista con fecha ya formateada). En fixtures salen de
`src/fixtures/reviews.ts`; en Shopify se modelan como **metaobjetos** de
tipo `review` (Settings → Custom data → Metaobjects, con acceso Storefront),
campos: `product` (handle), `author`, `rating` (1–5), `title`, `body`,
`date`. Si la tienda no define el metaobjeto, degrada a "sin reseñas" sin
romper la ficha (fail-safe, verificado contra Stellazon). La ficha añade
`aggregateRating` + `review` al JSON-LD cuando hay reseñas (rich results),
y el componente variantable `reviews` las pinta bajo el detalle.

### Cuentas de cliente (fase 3 — Customer Account API)

Login de clientes SIN contraseñas propias: OAuth 2.0 + PKCE contra el login
alojado de Shopify (cliente "public", sin client_secret). Todo en
`src/lib/customer/` + `app/api/cuenta/*`:

```text
/cuenta (sin sesión) → GET /api/cuenta/login   (PKCE + state en cookie efímera)
  → login alojado de Shopify → GET /api/cuenta/callback (valida state, canjea code)
  → cookie httpOnly customer_session (tokens; jamás legibles por JS)
  → /cuenta: perfil + pedidos vía Customer Account API GraphQL (no-store)
  · access token caducado → /api/cuenta/refresh (rota el refresh token)
  · /api/cuenta/logout → borra cookie + cierra la sesión en Shopify (id_token)
```

Se activa POR TENANT en su JSON (identificadores públicos, no secretos):

```json
"customerAccount": { "shopId": "60857843734", "clientId": "shp_xxxxx" }
```

Alta en el admin (una vez por tienda): **Sales channels → Headless (o
Hydrogen) → Customer Account API** → copiar el Client ID y el shop id, y
registrar los callback URIs (`https://<dominio>/api/cuenta/callback` y
`http://localhost:3000/api/cuenta/callback` para desarrollo) y el logout
URI (el dominio). Sin el bloque `customerAccount`, `/cuenta` explica que la
tienda no tiene login y el header no muestra el enlace "Cuenta".

### Wishlist (fase 4)

Estado del visitante, como el carrito: handles de producto en la cookie
httpOnly `wishlist` (180 días, máx. 100, validados contra un patrón).
Lectura en `lib/wishlist/read.ts` (Server Components), escritura solo vía
Server Action (`toggleWishlistAction`), y `useWishlist()` con toggle
optimista reconciliado con la respuesta del servidor. UI: corazón en
tarjetas y ficha (`components/storefront/wishlist/`), contador en el header
y página `/favoritos` (noindex) que resuelve los handles con el provider.
Evento `add_to_wishlist` (esquema GA4) al guardar.

### Cross-sell (fase 4)

`getRelatedProducts(productId)` en el contrato: en Shopify usa las
recomendaciones nativas (`productRecommendations`, intent RELATED,
verificado contra Stellazon); en fixtures, los productos que comparten
colección primero. La ficha muestra "También te puede gustar" con el
ProductGrid del theme; sin recomendaciones, sin sección.

### Emails transaccionales (fase 4)

Los emails de pedido los envía SHOPIFY (sus notificaciones no se pueden
desactivar y su infraestructura ya firma SPF/DKIM); enviarlos nosotros
duplicaría cada confirmación. La pieza de plataforma es el branding POR
DATA: `src/lib/email/templates.ts` genera las plantillas (confirmación de
pedido y envío) con los tokens del theme, el branding y las legales del
tenant — HTML de email (tablas + estilos inline) con las variables Liquid
de las notificaciones de Shopify. `/dev/emails` muestra el preview con
datos de muestra y el código listo para pegar UNA vez por tienda en
admin → Settings → Notifications → Customer notifications → "Edit code".
Cambiar el theme del tenant re-brandea también sus emails.

### Páginas legales por plantilla (fase 4)

`/legal/aviso-legal · privacidad · cookies · devoluciones`. La plantilla vive
UNA vez en `src/lib/legal/templates.ts` y se rellena con el bloque `legal`
del tenant (razón social, NIF, dirección, email, días de devolución) más
datos que ya existen: el dominio, los vendors de analítica (la política de
cookies solo lista GA4/Plausible si la tienda los configura) y el login de
clientes. Lo que falte aparece marcado como pendiente en la propia página.
El CLI de alta acepta `--razon-social --nif --direccion --email
--dias-devolucion`. El texto es una base razonable es-ES: la revisión final
de cada tienda es de su abogado.

### Consola de la factoría (/admin, fase 4)

Panel único para TODAS las tiendas del deploy, protegido por `ADMIN_SECRET`
(cookie httpOnly con token derivado sha256, comparaciones en tiempo
constante; sin la variable, el panel queda deshabilitado). Muestra por
tienda: dominios, data source, presencia de secretos (nunca sus valores),
conexión REAL con Shopify (`{ shop { name } }` en vivo), analítica, login de
clientes, estado de legales, theme y bloques. Incluye un validador de JSON
de tenant (usa el mismo `hydrateTenant` del runtime) y el botón de recarga
de la config remota cuando hay `TENANTS_URL`. `noindex` + disallow en
robots.

### Alta de tienda nueva (provisioning)

```bash
node scripts/nueva-tienda.mjs \
  --id=cliente-x --nombre="Cliente X" \
  --store=cliente-x.myshopify.com --dominio=https://cliente-x.com \
  [--theme=theme-a] [--admin-token=shpat_…]   # ← registra webhooks él solo
```

El CLI crea el JSON, lo registra en el índice, opcionalmente da de alta los
webhooks vía Admin API, e imprime los pasos restantes (envs y dominio en
Vercel). La tienda nace en fixtures y funciona al instante en
`http://<id>.localhost:3000`. Cero cambios en `components/`, `lib/` o `app/`;
si algún alta exige tocarlos, la arquitectura se ha roto: revisarla.

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
