import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import type { HeroProps } from "./types";

/** Hero centrado, sin imagen: tipografía y espacio. */
export function DefaultHero({ title, subtitle, ctaLabel, ctaHref }: HeroProps) {
  return (
    <section className="border-b border-line">
      <Container className="flex flex-col items-center gap-6 py-24 text-center">
        <h1 className="font-heading max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {title}
        </h1>
        {subtitle && <p className="max-w-xl text-lg text-muted">{subtitle}</p>}
        {ctaLabel && ctaHref && <LinkButton href={ctaHref}>{ctaLabel}</LinkButton>}
      </Container>
    </section>
  );
}
