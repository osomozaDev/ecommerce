"use client";

import { useActionState } from "react";
import { createTenantAction, type ValidationResult } from "./actions";

const input =
  "rounded-base border border-line bg-surface px-3 py-2 text-sm w-full";
const label = "flex flex-col gap-1 text-sm font-medium";

/**
 * Alta de tienda desde la consola: crea el JSON (validado con el
 * hydrateTenant del runtime), lo publica en el almacén remoto y revalida.
 * La tienda nace en fixtures y responde en <id>.localhost al instante.
 */
export function NewTenantForm({ themes }: { themes: string[] }) {
  const [result, formAction, pending] = useActionState<ValidationResult | null, FormData>(
    createTenantAction,
    null,
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <label className={label}>
        id (minúsculas y guiones)
        <input name="id" required pattern="[a-z0-9-]+" placeholder="cliente-x" className={input} />
      </label>
      <label className={label}>
        Nombre
        <input name="nombre" required placeholder="Cliente X" className={input} />
      </label>
      <label className={label}>
        Tienda Shopify
        <input
          name="storeDomain"
          required
          pattern=".+\.myshopify\.com"
          placeholder="cliente-x.myshopify.com"
          className={input}
        />
      </label>
      <label className={label}>
        Dominio público
        <input
          name="dominio"
          required
          type="url"
          placeholder="https://cliente-x.com"
          className={input}
        />
      </label>
      <label className={label}>
        Tagline
        <input name="tagline" placeholder="Opcional" className={input} />
      </label>
      <label className={label}>
        Theme
        <select name="theme" className={input}>
          {themes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className={label}>
        Razón social
        <input name="razonSocial" placeholder="Cliente X S.L. (legales)" className={input} />
      </label>
      <label className={label}>
        NIF
        <input name="nif" placeholder="B12345678" className={input} />
      </label>
      <label className={label}>
        Dirección
        <input name="direccion" placeholder="Calle Mayor 1, Madrid" className={input} />
      </label>
      <label className={label}>
        Email de contacto
        <input name="email" type="email" placeholder="hola@cliente-x.com" className={input} />
      </label>
      <label className={label}>
        GA4 (opcional)
        <input name="ga4" placeholder="G-XXXXXXXXXX" className={input} />
      </label>

      <div className="flex items-end gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-button bg-brand px-5 py-2 text-sm font-medium text-brand-contrast hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Creando…" : "Crear tienda"}
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
