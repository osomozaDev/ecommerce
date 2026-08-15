import { Container } from "@/components/ui/Container";

/** Estado de carga por defecto de todas las páginas del storefront. */
export default function Loading() {
  return (
    <Container className="flex justify-center py-24">
      <div className="flex items-center gap-3 text-sm text-muted" role="status">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand" />
        Cargando…
      </div>
    </Container>
  );
}
