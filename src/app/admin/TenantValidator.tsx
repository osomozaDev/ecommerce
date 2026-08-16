"use client";

import { useActionState } from "react";
import { validateTenantAction, type ValidationResult } from "./actions";

/**
 * Validador de JSON de tenant: pega una config y la valida el MISMO
 * hydrateTenant que usa el runtime. Pensado para preparar tenants de la
 * fuente remota (TENANTS_URL) o del repo sin sorpresas al desplegar.
 */
export function TenantValidator() {
  const [result, formAction, pending] = useActionState<ValidationResult | null, FormData>(
    validateTenantAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <textarea
        name="json"
        rows={10}
        spellCheck={false}
        placeholder='{"id": "cliente-x", "domain": "https://…", "theme": "theme-a", …}'
        className="w-full rounded-base border border-line bg-surface p-4 font-mono text-xs"
      />
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-button bg-brand px-5 py-2 text-sm font-medium text-brand-contrast hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Validando…" : "Validar JSON"}
        </button>
        {result && (
          <p className={`text-sm ${result.ok ? "text-green-700" : "text-red-600"}`}>
            {result.message}
          </p>
        )}
      </div>
    </form>
  );
}
