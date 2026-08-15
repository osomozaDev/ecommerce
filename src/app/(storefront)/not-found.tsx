import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

/** 404 dentro del storefront (producto/colección inexistente): con header y footer. */
export default function NotFound() {
  return (
    <Container className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-xs font-medium tracking-widest text-muted uppercase">
        Error 404
      </p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Esta página no existe
      </h1>
      <p className="max-w-md text-muted">
        Puede que el producto ya no esté disponible o que el enlace sea antiguo.
      </p>
      <div className="flex gap-3">
        <LinkButton href="/productos">Ver productos</LinkButton>
        <LinkButton href="/" variant="secondary">
          Ir al inicio
        </LinkButton>
      </div>
    </Container>
  );
}
