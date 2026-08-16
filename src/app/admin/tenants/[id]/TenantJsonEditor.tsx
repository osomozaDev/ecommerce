"use client";

import { useActionState } from "react";
import { saveTenantJsonAction, type ValidationResult } from "../../actions";

/** Editor crudo del JSON de una tienda: valida con hydrateTenant y publica. */
export function TenantJsonEditor({ initialJson }: { initialJson: string }) {
  const [result, formAction, pending] = useActionState<ValidationResult | null, FormData>(
    saveTenantJsonAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <textarea
        name="json"
        rows={24}
        spellCheck={false}
        defaultValue={initialJson}
        className="w-full rounded-base border border-line bg-surface p-4 font-mono text-xs leading-relaxed"
      />
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-button bg-brand px-5 py-2 text-sm font-medium text-brand-contrast hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Validar y publicar"}
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
