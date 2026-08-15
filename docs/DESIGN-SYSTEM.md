# Design System — Manual de trabajo (para Javi)

Puedes construir y rediseñar toda la tienda **sin entender Shopify, GraphQL,
el carrito ni los tenants**. Este documento es todo lo que necesitas.

## La idea en 30 segundos

Los componentes visuales reciben **ViewModels**: objetos planos, tipados y ya
resueltos (precio formateado, ruta construida, disponibilidad calculada).
Da igual si vienen de Shopify o de los fixtures — la UI no lo sabe.

```tsx
<ProductCard product={product} />
// product.title           → "Jarrón Luna"
// product.price.formatted → "45,00 €"   (nunca formatees precios tú)
// product.href            → "/productos/jarron-luna" (nunca montes rutas tú)
```

Los tipos están en `src/lib/commerce/types.ts` (solo lectura para ti):
`Product`, `ProductVariant`, `Collection`, `Cart`, `CartLine`, `Money`, `Image`.

## Arrancar

```bash
pnpm dev
```

Abre `http://localhost:3000/dev/design-system` → todos los componentes
renderizados contra fixtures, sin red y sin credenciales. Esa página es tu
laboratorio: añade ahí cada variante nueva que crees.

## Qué puedes tocar (y qué no)

| ✅ Tuyo | 🚫 No tocar |
|---|---|
| `src/components/` (todo) | `src/lib/` |
| `src/theme/` | `src/config/tenants/` |
| `src/fixtures/` | `src/app/` (salvo `dev/design-system`) |
| `src/app/dev/design-system/` | `.env*` |
| Parte visual de `src/blocks/` | `src/lib/commerce/shopify/` (GraphQL) |

Si para lograr algo visual crees que necesitas tocar la columna derecha,
para y coméntalo con Omar: probablemente falta un dato en un ViewModel,
y eso se resuelve en el mapper, no en la UI.

## Anatomía de un componente

Cada componente del design system es un directorio con el mismo patrón:

```text
src/components/storefront/product-card/
  types.ts        ← props del componente (ProductCardProps)
  DefaultCard.tsx ← variante "default"
  MinimalCard.tsx ← variante "minimal"
  variants.ts     ← registry: { default: DefaultCard, minimal: MinimalCard }
  index.tsx       ← dispatcher (NO editar): elige variante por props o theme
```

## Cómo crear una variante nueva

Ejemplo: `ProductCard` variante `editorial`.

1. Crea `src/components/storefront/product-card/EditorialCard.tsx`:

```tsx
import type { ProductCardProps } from "./types";

export function EditorialCard({ product }: ProductCardProps) {
  return (
    /* tu diseño; usa product.title, product.price.formatted, product.href… */
  );
}
```

2. Regístrala en `variants.ts` (una línea):

```ts
export const productCardVariants = {
  default: DefaultCard,
  minimal: MinimalCard,
  editorial: EditorialCard,   // ← nueva
};
```

3. Añádela al laboratorio (`src/app/dev/design-system/page.tsx`):

```tsx
<Muestra label="editorial">
  <ProductCard variant="editorial" product={producto} />
</Muestra>
```

4. Para activarla en una tienda, cambia su theme
   (`src/config/themes/theme-a.ts` → `components.productCard: "editorial"`).

Reglas de oro: una variante = un archivo pequeño. Sin condicionales de
variante dentro de un componente. Sin duplicar lógica: si dos variantes
comparten algo no trivial, extrae un subcomponente al mismo directorio.

## Tokens y themes

Un theme (`src/config/themes/*.ts`) tiene dos partes:

- **`tokens`** — branding: fuentes, `fontScale`, `radius`, `buttonRadius`,
  `containerWidth`, `sectionSpacing` y colores (`brand`, `bg`, `surface`,
  `ink`, `muted`, `line`).
- **`components`** — qué variante usa cada componente en esa tienda.

Los tokens llegan a Tailwind como utilidades — úsalas siempre en lugar de
colores/valores a mano, y el componente funcionará en cualquier tienda:

| Utilidad | Token |
|---|---|
| `bg-brand`, `text-brand`, `bg-bg`, `bg-surface` | colores |
| `text-ink`, `text-muted`, `border-line` | colores |
| `rounded-base` (superficies), `rounded-button` (botones/pills) | radios |
| `font-heading`, `font-body` | fuentes |
| `max-w-[var(--container)]` (ya lo hace `<Container>`) | ancho |
| `gap-[var(--section-gap)]` | espaciado de secciones |

Para probar cómo responde tu componente a otro branding: edita valores en
`theme-a.ts` y mira el laboratorio (o arranca con `TENANT_ID=tienda-b`, que
usa `theme-b`, frío y de esquinas rectas).

## Fixtures

`src/fixtures/products.ts`, `collections.ts`, `cart.ts`. Son `Product[]`,
`Collection[]`, `Cart` normales. Puedes añadir productos, estados raros
(agotado, oferta, sin imagen, título larguísimo) — la única regla es respetar
los tipos de `lib/commerce/types.ts` (TypeScript te avisará).

## Interactividad y carrito

Si tu componente necesita el carrito, usa el hook — nada más:

```tsx
"use client";
import { useCart } from "@/lib/cart/cart-context";

const { cart, addItem, updateItem, removeItem, isPending } = useCart();
```

`cart` es un `Cart` ViewModel; `isPending` te sirve para estados de carga.
Nunca importes nada de `lib/commerce/` directamente en un componente cliente
(el build fallará a propósito si lo haces: es la barandilla).

## Añadir un bloque visual

Los bloques componen la homepage por configuración (`<BlockRenderer/>`).
Para un bloque nuevo (p. ej. `benefits`): pide a Omar el alta del tipo y los
datos si los necesita; tu parte es el componente visual en
`src/components/storefront/` con el patrón de variantes de siempre.
Si el bloque es puramente visual (sin datos), puedes hacerlo entero tú:
tipo en `src/blocks/types.ts` → componente `XBlock.tsx` → una línea en
`src/blocks/registry.tsx`.

## Primitivas ya disponibles

`src/components/ui/`: `Container`, `Button`/`LinkButton` (primary, secondary,
ghost), `Price` (con precio tachado), `Badge`. Amplíalas ahí.

Componentes de storefront con variantes: `header`, `hero`, `product-card`,
`collection-card`, `product-grid`, `filter-bar` (ordenación y filtros de
catálogo), `product-detail`, `cart` (vista completa), `banner`, `footer`. Además, `cart/CartDrawer.tsx` es el botón + panel lateral
del carrito que usa el header: es tuyo para restilizar (usa `useCart()`, no
toca Shopify).
