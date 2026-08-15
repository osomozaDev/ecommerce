import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CartProvider } from "@/lib/cart/cart-context";
import { fixtureProducts } from "@/fixtures/products";
import { fixtureCart, emptyFixtureCart } from "@/fixtures/cart";
import { Container } from "@/components/ui/Container";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { Header } from "@/components/storefront/header";
import { Hero } from "@/components/storefront/hero";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ProductDetail } from "@/components/storefront/product-detail";
import { CartView } from "@/components/storefront/cart";
import { Banner } from "@/components/storefront/banner";
import { Footer } from "@/components/storefront/footer";

/**
 * LABORATORIO VISUAL — página interna, no indexada.
 * Todos los componentes del design system renderizados contra fixtures:
 * aquí se trabaja la UI sin Shopify, sin red y sin credenciales.
 * Para probar una variante nueva: regístrala en variants.ts del componente
 * y añade aquí un <Muestra> con variant="tu-variante".
 */

export const metadata: Metadata = {
  title: "Design System",
  robots: { index: false, follow: false },
};

const demoNav = [
  { label: "Productos", href: "/productos" },
  { label: "Novedades", href: "/colecciones/novedades" },
  { label: "Iluminación", href: "/colecciones/iluminacion" },
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-6 border-t border-line pt-10">
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Muestra({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium tracking-widest text-muted uppercase">{label}</p>
      <div className="overflow-hidden rounded-base border border-dashed border-line">
        {children}
      </div>
    </div>
  );
}

const secciones = [
  "tipografia",
  "botones",
  "precio-badge",
  "header",
  "hero",
  "product-card",
  "product-grid",
  "product-detail",
  "cart",
  "banner",
  "footer",
];

export default function DesignSystemPage() {
  const producto = fixtureProducts[1]; // Jarrón Luna: tiene oferta y variantes
  const productos = fixtureProducts.slice(0, 4);

  return (
    <CartProvider initialCart={fixtureCart}>
      <div className="pb-24">
        <div className="border-b border-line bg-surface">
          <Container className="flex flex-col gap-3 py-10">
            <h1 className="font-heading text-3xl font-semibold">Design System</h1>
            <p className="max-w-2xl text-muted">
              Componentes renderizados contra fixtures (src/fixtures). Sin Shopify, sin
              red. Guía completa en docs/DESIGN-SYSTEM.md.
            </p>
            <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {secciones.map((s) => (
                <a key={s} href={`#${s}`} className="text-muted hover:text-ink">
                  {s}
                </a>
              ))}
            </nav>
          </Container>
        </div>

        <Container className="flex flex-col gap-14 pt-10">
          <Section id="tipografia" title="Tipografía">
            <div className="flex flex-col gap-4">
              <h1 className="font-heading text-5xl font-semibold">Heading 1</h1>
              <h2 className="font-heading text-3xl font-semibold">Heading 2</h2>
              <h3 className="font-heading text-xl font-semibold">Heading 3</h3>
              <p className="max-w-xl">
                Body: los tokens del theme controlan familia, escala y color. Cambia
                config/themes/theme-a.ts y toda la tienda cambia con él.
              </p>
              <p className="text-sm text-muted">Texto secundario (muted)</p>
              <p className="text-xs font-medium tracking-widest uppercase">Label</p>
            </div>
          </Section>

          <Section id="botones" title="Botones">
            <div className="flex flex-wrap items-center gap-4">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button disabled>Deshabilitado</Button>
              <LinkButton href="#botones" variant="secondary">
                LinkButton
              </LinkButton>
            </div>
          </Section>

          <Section id="precio-badge" title="Precio y Badge">
            <div className="flex flex-wrap items-center gap-6">
              <Price price={producto.price} compareAtPrice={producto.compareAtPrice} />
              <Price price={fixtureProducts[0].price} />
              <Badge>Nuevo</Badge>
              <Badge>Oferta</Badge>
            </div>
          </Section>

          <Section id="header" title="Header">
            <Muestra label="default">
              <Header variant="default" shopName="Círculo Studio" nav={demoNav} />
            </Muestra>
          </Section>

          <Section id="hero" title="Hero">
            <Muestra label="default">
              <Hero
                variant="default"
                title="Objetos que hacen casa"
                subtitle="Piezas esenciales, materiales honestos."
                ctaLabel="Ver productos"
                ctaHref="/productos"
              />
            </Muestra>
            <Muestra label="editorial">
              <Hero
                variant="editorial"
                title="Objetos que hacen casa"
                subtitle="Piezas esenciales, materiales honestos."
                ctaLabel="Ver productos"
                ctaHref="/productos"
                image={{ src: "/fixtures/producto-1.svg", alt: "Muestra" }}
              />
            </Muestra>
          </Section>

          <Section id="product-card" title="Product Card">
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              <Muestra label="default">
                <div className="p-4">
                  <ProductCard variant="default" product={producto} />
                </div>
              </Muestra>
              <Muestra label="minimal">
                <div className="p-4">
                  <ProductCard variant="minimal" product={producto} />
                </div>
              </Muestra>
              <Muestra label="default · agotado">
                <div className="p-4">
                  <ProductCard variant="default" product={fixtureProducts[6]} />
                </div>
              </Muestra>
              <Muestra label="default · badge nuevo">
                <div className="p-4">
                  <ProductCard variant="default" product={fixtureProducts[3]} />
                </div>
              </Muestra>
            </div>
          </Section>

          <Section id="product-grid" title="Product Grid">
            <Muestra label="default">
              <div className="p-6">
                <ProductGrid variant="default" products={productos} />
              </div>
            </Muestra>
          </Section>

          <Section id="product-detail" title="Product Detail">
            <Muestra label="default">
              <ProductDetail variant="default" product={producto} />
            </Muestra>
          </Section>

          <Section id="cart" title="Cart">
            <Muestra label="default · con artículos">
              <div className="p-6">
                <CartView variant="default" />
              </div>
            </Muestra>
            <Muestra label="default · vacío">
              <div className="p-6">
                <CartProvider initialCart={emptyFixtureCart}>
                  <CartView variant="default" />
                </CartProvider>
              </div>
            </Muestra>
          </Section>

          <Section id="banner" title="Banner">
            <Muestra label="default">
              <Banner
                variant="default"
                text="Envío gratuito a partir de 60 €"
                href="/productos"
              />
            </Muestra>
          </Section>

          <Section id="footer" title="Footer">
            <Muestra label="default">
              <Footer
                variant="default"
                shopName="Círculo Studio"
                tagline="Objetos esenciales para casa"
                nav={demoNav}
              />
            </Muestra>
          </Section>
        </Container>
      </div>
    </CartProvider>
  );
}
