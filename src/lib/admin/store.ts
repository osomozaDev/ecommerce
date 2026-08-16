import "server-only";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * Almacén ESCRIBIBLE de tenants para la consola: la fuente que TENANTS_URL
 * hace llegar al registry (y que PISA a los tenants del repo por id).
 *
 * Dos backends con el mismo contrato:
 *  - "blob": Vercel Blob (producción). Requiere BLOB_READ_WRITE_TOKEN; el
 *    JSON se publica en una URL estable que se pone como TENANTS_URL.
 *  - "dev-file": archivo local (TENANTS_URL con esquema file:, gitignored),
 *    leído de disco por el registry — sin red y siempre fresco.
 *
 * El repo sigue siendo la base versionada; esto es la capa de edición
 * instantánea sin deploy.
 */

const BLOB_PATHNAME = "tenants.json";
const DEV_FILE = ".dev-tenants.json";
const DEV_URL = `file:${DEV_FILE}`;

export interface TenantStoreInfo {
  backend: "blob" | "dev-file" | null;
  /** Aviso de configuración para el operador (null = todo listo). */
  hint: string | null;
}

export function tenantStoreInfo(): TenantStoreInfo {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      backend: "blob",
      hint: process.env.TENANTS_URL
        ? null
        : "Guarda una tienda para obtener la URL del Blob y ponla como TENANTS_URL (local y Vercel).",
    };
  }
  if (process.env.NODE_ENV !== "production") {
    return {
      backend: "dev-file",
      hint:
        process.env.TENANTS_URL === DEV_URL
          ? null
          : `Añade TENANTS_URL=${DEV_URL} a .env.local para que el storefront lea lo que guardes aquí.`,
    };
  }
  return {
    backend: null,
    hint: "Sin almacén de escritura: crea un Blob store en Vercel (Storage → Blob) y define BLOB_READ_WRITE_TOKEN. La consola queda en solo lectura.",
  };
}

/** Tenants remotos crudos (los editables). [] si no hay fuente o falla. */
export async function readStoredTenants(): Promise<unknown[]> {
  const url = process.env.TENANTS_URL;
  if (!url) return [];
  try {
    if (url.startsWith("file:")) {
      const raw = await readFile(url.slice("file:".length), "utf8").catch(() => null);
      const data = raw === null ? [] : (JSON.parse(raw) as unknown);
      return Array.isArray(data) ? data : [];
    }
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Publica el array completo. Devuelve la URL pública donde quedó servido. */
export async function writeStoredTenants(tenants: unknown[]): Promise<string> {
  const body = JSON.stringify(tenants, null, 2);
  const info = tenantStoreInfo();

  if (info.backend === "blob") {
    const { put } = await import("@vercel/blob");
    const blob = await put(BLOB_PATHNAME, body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return blob.url;
  }

  if (info.backend === "dev-file") {
    await writeFile(resolve(process.cwd(), DEV_FILE), body);
    return DEV_URL;
  }

  throw new Error("Sin almacén de tenants configurado (BLOB_READ_WRITE_TOKEN).");
}

// ── Helpers puros (testeables) ──

/** JSON de tienda nueva a partir del formulario de alta (como el CLI). */
export function buildTenantFromForm(formData: FormData): Record<string, unknown> {
  const get = (name: string) => String(formData.get(name) ?? "").trim();
  const id = get("id");
  const nombre = get("nombre");
  const tagline = get("tagline");
  const ga4 = get("ga4");
  return {
    id,
    slug: id,
    domain: get("dominio"),
    domains: [`${id}.localhost`],
    locale: "es-ES",
    dataSource: "fixtures",
    branding: { name: nombre, ...(tagline ? { tagline } : {}) },
    ...(ga4 ? { analytics: { ga4MeasurementId: ga4 } } : {}),
    legal: {
      companyName: get("razonSocial") || nombre,
      ...(get("nif") ? { taxId: get("nif") } : {}),
      ...(get("direccion") ? { address: get("direccion") } : {}),
      ...(get("email") ? { email: get("email") } : {}),
    },
    theme: get("theme") || "theme-a",
    pages: {
      homepage: [
        {
          type: "hero",
          title: nombre,
          subtitle: tagline,
          ctaLabel: "Ver productos",
          ctaHref: "/productos",
        },
        { type: "banner", text: "Envío gratuito a partir de 60 €" },
      ],
    },
    shopify: { storeDomain: get("storeDomain") },
  };
}

export function upsertStoredTenant(list: unknown[], tenant: { id: string }): unknown[] {
  const rest = list.filter((t) => (t as { id?: string })?.id !== tenant.id);
  return [...rest, tenant];
}

export function removeStoredTenant(list: unknown[], id: string): unknown[] {
  return list.filter((t) => (t as { id?: string })?.id !== id);
}
