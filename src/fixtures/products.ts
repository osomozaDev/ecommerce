/**
 * Fixtures de producto. Respetan EXACTAMENTE los ViewModels de
 * lib/commerce/types.ts: la UI no distingue si los datos vienen de aquí
 * o de Shopify. Javi puede ampliarlos libremente para probar componentes.
 */
import type { Image, Product, ProductVariant } from "@/lib/commerce/types";
import { money } from "@/lib/commerce/money";

function img(n: number, alt: string): Image {
  return { src: `/fixtures/producto-${n}.svg`, alt, width: 800, height: 1000 };
}

interface VariantSpec {
  id: string;
  option: { name: string; value: string };
  price: number;
  compareAt?: number;
  available?: boolean;
}

function makeProduct(spec: {
  n: number;
  handle: string;
  title: string;
  description: string;
  optionName: string;
  variants: VariantSpec[];
  badge?: string;
  extraImage?: number;
}): Product {
  const variants: ProductVariant[] = spec.variants.map((v) => ({
    id: v.id,
    title: v.option.value,
    available: v.available ?? true,
    selectedOptions: [{ name: spec.optionName, value: v.option.value }],
    price: money(v.price),
    compareAtPrice: v.compareAt ? money(v.compareAt) : undefined,
    image: img(spec.n, spec.title),
  }));
  const cheapest = variants.reduce((a, b) =>
    b.price.amount < a.price.amount ? b : a,
  );
  const images = [img(spec.n, spec.title)];
  if (spec.extraImage) images.push(img(spec.extraImage, `${spec.title} — detalle`));
  return {
    id: `fx-prod-${spec.handle}`,
    handle: spec.handle,
    title: spec.title,
    description: spec.description,
    href: `/productos/${spec.handle}`,
    images,
    price: cheapest.price,
    compareAtPrice: cheapest.compareAtPrice,
    available: variants.some((v) => v.available),
    badge: spec.badge,
    options: [
      { name: spec.optionName, values: spec.variants.map((v) => v.option.value) },
    ],
    variants,
    seo: { title: spec.title, description: spec.description.slice(0, 155) },
  };
}

export const fixtureProducts: Product[] = [
  makeProduct({
    n: 1,
    handle: "vela-ambar",
    title: "Vela aromática Ámbar",
    description:
      "Cera de soja y esencia de ámbar con notas de vainilla. Arde de forma limpia durante más de 45 horas. Vaso de vidrio reutilizable.",
    optionName: "Tamaño",
    variants: [
      { id: "fx-var-vela-250", option: { name: "Tamaño", value: "250 g" }, price: 24 },
      { id: "fx-var-vela-480", option: { name: "Tamaño", value: "480 g" }, price: 39 },
    ],
    extraImage: 3,
  }),
  makeProduct({
    n: 2,
    handle: "jarron-luna",
    title: "Jarrón Luna",
    description:
      "Cerámica esmaltada a mano con forma orgánica. Cada pieza es ligeramente distinta: pequeñas variaciones que son parte del oficio.",
    optionName: "Tamaño",
    variants: [
      { id: "fx-var-jarron-s", option: { name: "Tamaño", value: "S — 18 cm" }, price: 32, compareAt: 42 },
      { id: "fx-var-jarron-m", option: { name: "Tamaño", value: "M — 26 cm" }, price: 45, compareAt: 58 },
    ],
    badge: "Oferta",
    extraImage: 5,
  }),
  makeProduct({
    n: 3,
    handle: "manta-lino",
    title: "Manta de lino lavado",
    description:
      "Lino europeo lavado a la piedra, suave desde el primer día. 130 × 170 cm. Se vuelve mejor con cada lavado.",
    optionName: "Color",
    variants: [
      { id: "fx-var-manta-arena", option: { name: "Color", value: "Arena" }, price: 89 },
      { id: "fx-var-manta-salvia", option: { name: "Color", value: "Verde salvia" }, price: 89, available: false },
    ],
    extraImage: 6,
  }),
  makeProduct({
    n: 4,
    handle: "lampara-arco",
    title: "Lámpara Arco",
    description:
      "Lámpara de sobremesa con pantalla de lino y base de roble macizo. Luz cálida regulable. Cable textil de 2 m.",
    optionName: "Acabado",
    variants: [
      { id: "fx-var-lampara-roble", option: { name: "Acabado", value: "Roble natural" }, price: 149 },
    ],
    badge: "Nuevo",
    extraImage: 7,
  }),
  makeProduct({
    n: 5,
    handle: "tazas-ceramica",
    title: "Set de tazas de cerámica (×2)",
    description:
      "Dos tazas de gres de 300 ml aptas para lavavajillas y microondas. Esmalte mate al tacto, interior vidriado.",
    optionName: "Color",
    variants: [
      { id: "fx-var-tazas-crudo", option: { name: "Color", value: "Crudo" }, price: 28 },
      { id: "fx-var-tazas-terracota", option: { name: "Color", value: "Terracota" }, price: 28 },
    ],
  }),
  makeProduct({
    n: 6,
    handle: "cojin-boucle",
    title: "Cojín bouclé",
    description:
      "Funda de bouclé con relleno de plumón alternativo incluido. 45 × 45 cm, cierre oculto. Lavable a máquina.",
    optionName: "Color",
    variants: [
      { id: "fx-var-cojin-crema", option: { name: "Color", value: "Crema" }, price: 35 },
      { id: "fx-var-cojin-piedra", option: { name: "Color", value: "Gris piedra" }, price: 35 },
    ],
  }),
  makeProduct({
    n: 7,
    handle: "difusor-cedro",
    title: "Difusor de cedro",
    description:
      "Difusor de varillas con aceite esencial de cedro del Atlas. Aroma seco y cálido durante unas 10 semanas. 200 ml.",
    optionName: "Formato",
    variants: [
      { id: "fx-var-difusor-200", option: { name: "Formato", value: "200 ml" }, price: 42, available: false },
    ],
  }),
  makeProduct({
    n: 8,
    handle: "espejo-orbita",
    title: "Espejo Órbita",
    description:
      "Espejo de pared circular con marco fino de acero lacado. Incluye anclaje oculto; instalación en dos puntos.",
    optionName: "Diámetro",
    variants: [
      { id: "fx-var-espejo-40", option: { name: "Diámetro", value: "Ø 40 cm" }, price: 79 },
      { id: "fx-var-espejo-60", option: { name: "Diámetro", value: "Ø 60 cm" }, price: 119 },
    ],
    badge: "Nuevo",
    extraImage: 2,
  }),
];

export function findFixtureProduct(handle: string): Product | undefined {
  return fixtureProducts.find((p) => p.handle === handle);
}

/** Busca la variante y su producto a partir de un merchandiseId. */
export function findFixtureVariant(merchandiseId: string) {
  for (const product of fixtureProducts) {
    const variant = product.variants.find((v) => v.id === merchandiseId);
    if (variant) return { product, variant };
  }
  return undefined;
}
