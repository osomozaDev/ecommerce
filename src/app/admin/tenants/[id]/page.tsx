import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin/auth";
import { readStoredTenants } from "@/lib/admin/store";
import { tenantData } from "@/config/tenants";
import { TenantJsonEditor } from "./TenantJsonEditor";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Edición del JSON crudo de una tienda. Se parte de la versión remota si
 * existe (es la que manda) y si no, de la del repo; al publicar se guarda
 * como override remoto — el repo no se toca desde aquí.
 */
export default async function EditarTenantPage({ params }: Props) {
  if (!(await isAdminAuthed())) redirect("/admin");
  const { id } = await params;

  const stored = await readStoredTenants();
  const remote = stored.find((t) => (t as { id?: string })?.id === id);
  const repo = (tenantData as unknown[]).find((t) => (t as { id?: string })?.id === id);
  const raw = remote ?? repo;
  if (!raw) notFound();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold">
          Editar tienda <code>{id}</code>
        </h1>
        <Link href="/admin" className="text-sm text-muted underline hover:text-ink">
          ← Volver a la consola
        </Link>
      </div>
      <p className="text-sm text-muted">
        Editando la versión {remote ? "remota (la activa)" : "del repo (al publicar se crea el override remoto)"}.
        Los cambios se validan con el mismo código del runtime y se aplican al instante,
        sin deploy.
      </p>
      <TenantJsonEditor initialJson={JSON.stringify(raw, null, 2)} />
    </main>
  );
}
