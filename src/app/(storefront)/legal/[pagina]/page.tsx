import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { getTenant } from "@/lib/tenant/resolve";
import { legalPage } from "@/lib/legal/templates";

interface Props {
  params: Promise<{ pagina: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pagina } = await params;
  const tenant = await getTenant();
  const page = legalPage(pagina, tenant);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/legal/${page.slug}` },
  };
}

/** Páginas legales: plantilla única del engine rellenada con datos del tenant. */
export default async function LegalPage({ params }: Props) {
  const { pagina } = await params;
  const tenant = await getTenant();
  const page = legalPage(pagina, tenant);
  if (!page) notFound();

  return (
    <Container className="max-w-3xl py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">{page.title}</h1>
      {page.incomplete && (
        <p className="mt-4 rounded-base border border-line bg-surface p-4 text-sm text-muted">
          ⚠️ Faltan datos registrales de esta tienda (bloque <code>legal</code> de su
          configuración). Los huecos aparecen marcados como pendientes.
        </p>
      )}
      <div className="mt-8 flex flex-col gap-8">
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </Container>
  );
}
