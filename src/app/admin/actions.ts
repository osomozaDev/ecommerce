"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import {
  ADMIN_COOKIE,
  adminCookieToken,
  isAdminAuthed,
  verifyAdminSecret,
} from "@/lib/admin/auth";
import {
  buildTenantFromForm,
  readStoredTenants,
  removeStoredTenant,
  upsertStoredTenant,
  writeStoredTenants,
} from "@/lib/admin/store";
import { hydrateTenant } from "@/lib/tenant/registry";

export async function loginAction(formData: FormData) {
  const secret = String(formData.get("secret") ?? "");
  if (!verifyAdminSecret(secret)) redirect("/admin?error=clave");
  (await cookies()).set(ADMIN_COOKIE, adminCookieToken()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/admin");
}

export async function logoutAction() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin");
}

/** Fuerza la recarga de la config remota de tenants (TENANTS_URL). */
export async function revalidateTenantsAction() {
  if (!(await isAdminAuthed())) redirect("/admin");
  revalidateTag("tenants", "max");
  redirect("/admin?ok=config-recargada");
}

export interface ValidationResult {
  ok: boolean;
  message: string;
}

async function persistTenant(raw: Record<string, unknown>): Promise<ValidationResult> {
  let id: string;
  try {
    id = hydrateTenant(raw).id;
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
  const stored = await readStoredTenants();
  const url = await writeStoredTenants(upsertStoredTenant(stored, { ...raw, id }));
  revalidateTag("tenants", "max");
  const urlHint =
    process.env.TENANTS_URL === url ? "" : ` · TENANTS_URL debe apuntar a ${url}`;
  return { ok: true, message: `Guardado ✓ — "${id}" activo sin deploy${urlHint}` };
}

export async function createTenantAction(
  _prev: ValidationResult | null,
  formData: FormData,
): Promise<ValidationResult> {
  if (!(await isAdminAuthed())) return { ok: false, message: "Sesión caducada." };
  const raw = buildTenantFromForm(formData);
  if (!/^[a-z0-9-]+$/.test(String(raw.id))) {
    return { ok: false, message: "id inválido (minúsculas, números y guiones)" };
  }
  try {
    return await persistTenant(raw);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

export async function saveTenantJsonAction(
  _prev: ValidationResult | null,
  formData: FormData,
): Promise<ValidationResult> {
  if (!(await isAdminAuthed())) return { ok: false, message: "Sesión caducada." };
  try {
    const raw = JSON.parse(String(formData.get("json") ?? "")) as Record<string, unknown>;
    return await persistTenant(raw);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof SyntaxError
          ? `JSON mal formado: ${error.message}`
          : error instanceof Error
            ? error.message
            : String(error),
    };
  }
}

export async function deleteTenantAction(formData: FormData) {
  if (!(await isAdminAuthed())) redirect("/admin");
  const id = String(formData.get("id") ?? "");
  const stored = await readStoredTenants();
  await writeStoredTenants(removeStoredTenant(stored, id));
  revalidateTag("tenants", "max");
  redirect("/admin?ok=override-eliminado");
}

/** Valida un JSON de tenant con el MISMO hydrateTenant del runtime. */
export async function validateTenantAction(
  _prev: ValidationResult | null,
  formData: FormData,
): Promise<ValidationResult> {
  if (!(await isAdminAuthed())) return { ok: false, message: "Sesión caducada." };
  const text = String(formData.get("json") ?? "");
  try {
    const tenant = hydrateTenant(JSON.parse(text));
    const dataSource = tenant.dataSource ?? "(hereda del env)";
    return {
      ok: true,
      message: `Válido ✓ — id "${tenant.id}" (${tenant.branding.name}) · theme ${tenant.theme.name} · dataSource ${dataSource} · ${tenant.pages.homepage.length} bloques de homepage · legal ${tenant.legal ? "configurado" : "SIN configurar"}`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof SyntaxError
        ? `JSON mal formado: ${error.message}`
        : error instanceof Error
          ? error.message
          : String(error),
    };
  }
}
