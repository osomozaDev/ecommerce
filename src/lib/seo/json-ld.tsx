/**
 * Serializa un objeto JSON-LD en un <script type="application/ld+json">.
 * El escape de "<" evita cierres de script inyectados vía contenido
 * (títulos/descripciones vienen del admin de Shopify, que es input externo).
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
