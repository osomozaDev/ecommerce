import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

/** 404 global (rutas que no existen fuera del storefront). */
export default function RootNotFound() {
  return (
    <main className="flex min-h-dvh items-center">
      <Container className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-xs font-medium tracking-widest text-muted uppercase">
          Error 404
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Esta página no existe
        </h1>
        <LinkButton href="/">Ir a la tienda</LinkButton>
      </Container>
    </main>
  );
}
