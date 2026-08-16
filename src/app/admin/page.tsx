import Link from "next/link";
import { tenantRegistry } from "@/lib/tenant/registry";
import type { TenantConfig } from "@/lib/tenant/types";
import { tenantData } from "@/config/tenants";
import { themes } from "@/config/themes";
import { shopifyFetch, tenantSecret } from "@/lib/commerce/shopify/client";
import { adminSecretConfigured, isAdminAuthed } from "@/lib/admin/auth";
import { readStoredTenants, tenantStoreInfo } from "@/lib/admin/store";
import {
  deleteTenantAction,
  loginAction,
  logoutAction,
  revalidateTenantsAction,
} from "./actions";
import { NewTenantForm } from "./NewTenantForm";
import { TenantValidator } from "./TenantValidator";

/**
 * Consola de la factoría: estado de TODAS las tiendas del deploy en una
 * pantalla — data source, secretos presentes (nunca sus valores), conexión
 * real con Shopify, analítica, login de clientes y legales.
 */

interface Props {
  searchParams: Promise<{ error?: string; ok?: string }>;
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={ok ? "text-green-700" : "text-red-600"}>
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

async function shopifyStatus(tenant: TenantConfig): Promise<string> {
  const source = tenant.dataSource ?? process.env.COMMERCE_DATA_SOURCE ?? "fixtures";
  if (source !== "shopify") return "— (fixtures)";
  if (!tenantSecret("SHOPIFY_STOREFRONT_TOKEN", tenant.id)) return "✗ sin token";
  try {
    const data = await shopifyFetch<{ shop: { name: string } }>({
      query: "{ shop { name } }",
      cache: "no-store",
      tenant,
    });
    return `✓ conectado (${data.shop.name})`;
  } catch (error) {
    return `✗ ${error instanceof Error ? error.message : "error"}`;
  }
}

function legalStatus(tenant: TenantConfig): string {
  const legal = tenant.legal;
  if (!legal) return "sin configurar";
  const completo = legal.taxId && legal.address && legal.email;
  return completo ? "completo" : "parcial (faltan datos registrales)";
}

export default async function AdminPage({ searchParams }: Props) {
  const { error, ok } = await searchParams;

  if (!adminSecretConfigured()) {
    return (
      <main className="mx-auto max-w-xl">
        <h1 className="font-heading text-2xl font-semibold">Consola de la factoría</h1>
        <p className="mt-4 text-muted">
          Define la variable de entorno <code>ADMIN_SECRET</code> (local y Vercel) para
          activar la consola. Sin ella, este panel queda deshabilitado.
        </p>
      </main>
    );
  }

  if (!(await isAdminAuthed())) {
    return (
      <main className="mx-auto max-w-sm">
        <h1 className="font-heading text-2xl font-semibold">Consola de la factoría</h1>
        <form action={loginAction} className="mt-8 flex flex-col gap-3">
          <label htmlFor="admin-secret" className="text-sm font-medium">
            Clave de acceso
          </label>
          <input
            id="admin-secret"
            name="secret"
            type="password"
            autoComplete="current-password"
            className="rounded-base border border-line bg-surface px-4 py-2"
          />
          {error === "clave" && (
            <p className="text-sm text-red-600">Clave incorrecta.</p>
          )}
          <button
            type="submit"
            className="mt-2 rounded-button bg-brand px-5 py-2 text-sm font-medium text-brand-contrast hover:opacity-90"
          >
            Entrar
          </button>
        </form>
      </main>
    );
  }

  const [registry, stored] = await Promise.all([tenantRegistry(), readStoredTenants()]);
  const tenants = [...registry.values()];
  const statuses = await Promise.all(tenants.map((t) => shopifyStatus(t)));
  const remoteIds = new Set(
    stored.map((t) => (t as { id?: string })?.id).filter(Boolean),
  );
  const repoIds = new Set(
    (tenantData as unknown[]).map((t) => (t as { id?: string })?.id).filter(Boolean),
  );
  const store = tenantStoreInfo();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Consola de la factoría</h1>
          <p className="mt-1 text-sm text-muted">
            {tenants.length} {tenants.length === 1 ? "tienda" : "tiendas"} en este deploy ·
            config remota{" "}
            {process.env.TENANTS_URL ? "activa (TENANTS_URL)" : "no configurada (solo repo)"}
          </p>
        </div>
        <div className="flex gap-3">
          {process.env.TENANTS_URL && (
            <form action={revalidateTenantsAction}>
              <button
                type="submit"
                className="rounded-button border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-bg"
              >
                Recargar config remota
              </button>
            </form>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-button border border-line px-4 py-2 text-sm text-muted hover:text-ink"
            >
              Salir
            </button>
          </form>
        </div>
      </div>

      {ok && <p className="text-sm text-green-700">✓ {ok.replace(/-/g, " ")}</p>}

      <section className="grid gap-4 lg:grid-cols-2">
        {tenants.map((tenant, i) => {
          const source =
            tenant.dataSource ?? process.env.COMMERCE_DATA_SOURCE ?? "fixtures";
          return (
            <article
              key={tenant.id}
              className="flex flex-col gap-3 rounded-base border border-line bg-surface p-6"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-heading text-lg font-semibold">
                  {tenant.branding.name}
                  <span className="ml-2 font-body text-xs font-normal text-muted">
                    {tenant.id} · {remoteIds.has(tenant.id) ? "remota" : "repo"}
                  </span>
                </h2>
                <div className="flex items-center gap-3 text-sm">
                  <Link
                    href={`/admin/tenants/${tenant.id}`}
                    className="text-muted underline hover:text-ink"
                  >
                    editar
                  </Link>
                  <a
                    href={tenant.domain}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted underline hover:text-ink"
                  >
                    abrir ↗
                  </a>
                  {remoteIds.has(tenant.id) && (
                    <form action={deleteTenantAction}>
                      <input type="hidden" name="id" value={tenant.id} />
                      <button
                        type="submit"
                        className="text-red-600 underline hover:opacity-80"
                        title={
                          repoIds.has(tenant.id)
                            ? "Quitar el override remoto (vuelve la versión del repo)"
                            : "Eliminar la tienda remota"
                        }
                      >
                        {repoIds.has(tenant.id) ? "quitar override" : "eliminar"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted">Dominios</dt>
                <dd>{[new URL(tenant.domain).hostname, ...(tenant.domains ?? [])].join(" · ")}</dd>
                <dt className="text-muted">Data source</dt>
                <dd>{source}</dd>
                <dt className="text-muted">Shopify</dt>
                <dd>{statuses[i]}</dd>
                <dt className="text-muted">Secretos</dt>
                <dd className="flex gap-4">
                  <Check
                    ok={Boolean(tenantSecret("SHOPIFY_STOREFRONT_TOKEN", tenant.id))}
                    label="storefront"
                  />
                  <Check
                    ok={Boolean(tenantSecret("SHOPIFY_WEBHOOK_SECRET", tenant.id))}
                    label="webhook"
                  />
                </dd>
                <dt className="text-muted">Analítica</dt>
                <dd>
                  {[
                    tenant.analytics?.ga4MeasurementId && "GA4",
                    tenant.analytics?.plausibleDomain && "Plausible",
                  ]
                    .filter(Boolean)
                    .join(" + ") || "— (solo dataLayer)"}
                </dd>
                <dt className="text-muted">Mercados</dt>
                <dd>
                  {tenant.markets?.markets?.length
                    ? `principal${tenant.markets.defaultCountry ? ` (${tenant.markets.defaultCountry})` : ""} + ${tenant.markets.markets.map((m) => `${m.id} (${m.country})`).join(", ")}`
                    : "— (mercado único)"}
                </dd>
                <dt className="text-muted">Login clientes</dt>
                <dd>{tenant.customerAccount ? "✓ activado" : "—"}</dd>
                <dt className="text-muted">Legales</dt>
                <dd>{legalStatus(tenant)}</dd>
                <dt className="text-muted">Theme</dt>
                <dd>
                  {tenant.theme.name} · {tenant.pages.homepage.length} bloques de homepage
                </dd>
              </dl>
            </article>
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold">Nueva tienda</h2>
        <p className="text-sm text-muted">
          Alta instantánea sin deploy: se valida, se publica en el almacén remoto (
          {store.backend === "blob"
            ? "Vercel Blob"
            : store.backend === "dev-file"
              ? "archivo local de desarrollo"
              : "SIN configurar"}
          ) y nace en fixtures en <code>&lt;id&gt;.localhost</code>.
        </p>
        {store.hint && (
          <p className="rounded-base border border-line bg-surface p-3 text-sm text-muted">
            ⚠️ {store.hint}
          </p>
        )}
        {store.backend && <NewTenantForm themes={Object.keys(themes)} />}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold">Validar JSON de tenant</h2>
        <p className="text-sm text-muted">
          Pega la config de una tienda (nueva o editada) y se valida con el mismo
          código que la carga en runtime. Útil antes de subirla al repo o a la
          fuente remota.
        </p>
        <TenantValidator />
      </section>
    </main>
  );
}
