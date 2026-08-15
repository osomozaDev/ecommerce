import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import type { HeroProps } from "./types";

/** Hero a dos columnas con imagen: texto grande a la izquierda, imagen a la derecha. */
export function EditorialHero({ title, subtitle, ctaLabel, ctaHref, image }: HeroProps) {
  return (
    <section className="border-b border-line bg-surface">
      <Container className="grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            {title}
          </h1>
          {subtitle && <p className="max-w-md text-lg text-muted">{subtitle}</p>}
          {ctaLabel && ctaHref && <LinkButton href={ctaHref}>{ctaLabel}</LinkButton>}
        </div>
        {image && (
          <div className="relative aspect-4/5 max-h-[32rem] w-full overflow-hidden rounded-base">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        )}
      </Container>
    </section>
  );
}
