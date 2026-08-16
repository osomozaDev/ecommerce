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
