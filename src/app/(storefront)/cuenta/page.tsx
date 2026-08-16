import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { getTenant } from "@/lib/tenant/resolve";
import { readCustomerSession, sessionIsExpired } from "@/lib/customer/session";
import { getCustomerOverview, type CustomerOverview } from "@/lib/customer/api";

export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ error?: string }>;
}

/**
 * Cuenta del cliente: perfil + pedidos vía Customer Account API.
 * Estados: tienda sin login configurado → aviso; sin sesión → CTA de login;
 * sesión caducada → refresh (route handler); sesión inválida → logout.
 */
export default async function CuentaPage({ searchParams }: Props) {
  const [tenant, session, { error }] = await Promise.all([
    getTenant(),
    readCustomerSession(),
    searchParams,
  ]);

  if (!tenant.customerAccount) {
    return (
      <Container className="py-20 text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Mi cuenta</h1>
        <p className="mt-4 text-muted">
          Esta tienda aún no tiene activado el acceso de clientes.
        </p>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container className="py-20 text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Mi cuenta</h1>
        <p className="mt-4 text-muted">
          Accede para ver tus pedidos y tus datos. El login ocurre en Shopify:
          aquí nunca se teclea tu contraseña.
        </p>
        {error === "login" && (
          <p className="mt-4 text-sm text-red-600">
            No se pudo completar el acceso. Inténtalo de nuevo.
          </p>
        )}
        <div className="mt-8">
          <LinkButton href="/api/cuenta/login">Iniciar sesión</LinkButton>
        </div>
      </Container>
    );
  }

  if (sessionIsExpired(session)) {
    redirect("/api/cuenta/refresh?returnTo=/cuenta");
  }

  let overview: CustomerOverview | null = null;
  try {
    overview = await getCustomerOverview(tenant, session);
  } catch {
    overview = null;
  }
  // Token inválido/revocado: se limpia la sesión y se vuelve a empezar.
  if (!overview) redirect("/api/cuenta/logout");

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {overview.firstName ? `Hola, ${overview.firstName}` : "Mi cuenta"}
          </h1>
          {overview.email && <p className="mt-1 text-sm text-muted">{overview.email}</p>}
        </div>
        <LinkButton variant="ghost" href="/api/cuenta/logout">
          Cerrar sesión
        </LinkButton>
      </div>

      <h2 className="mt-12 font-heading text-xl font-semibold tracking-tight">Pedidos</h2>
      {overview.orders.length === 0 ? (
        <p className="mt-4 text-muted">Todavía no tienes pedidos.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-base border border-line bg-surface">
          {overview.orders.map((order) => (
            <li
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 p-4"
            >
              <div>
                <p className="font-medium">{order.name}</p>
                <p className="text-sm text-muted">{order.date}</p>
              </div>
              <div className="text-right">
                <p className="font-medium tabular-nums">{order.total.formatted}</p>
                {order.status && <p className="text-sm text-muted">{order.status}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
