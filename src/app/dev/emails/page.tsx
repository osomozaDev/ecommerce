import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { getTenant } from "@/lib/tenant/resolve";
import { emailTemplates } from "@/lib/email/templates";

export const metadata: Metadata = {
  title: "Emails transaccionales",
  robots: { index: false, follow: false },
};

/**
 * Laboratorio de emails: preview brandeado del tenant actual + el Liquid
 * listo para pegar en Shopify. Cambia de tienda cambiando de host
 * (localhost / tienda-b.localhost) y el email cambia de marca solo.
 */
export default async function EmailsPage() {
  const tenant = await getTenant();
  const templates = emailTemplates(tenant);

  return (
    <Container className="flex flex-col gap-12 py-12">
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Emails transaccionales
        </h1>
        <p className="max-w-2xl text-muted">
          Plantillas generadas desde la config de <strong>{tenant.branding.name}</strong>{" "}
          (tokens del theme + branding + legales). Los emails los envía Shopify: pega el
          código en <em>admin → Settings → Notifications → Customer notifications</em>,
          en la notificación indicada, con &quot;Edit code&quot;.
        </p>
      </div>

      {templates.map((template) => (
        <section key={template.title} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              {template.title}
            </h2>
            <p className="text-sm text-muted">
              Notificación de Shopify: <code>{template.shopifyNotification}</code> ·
              Asunto: <code>{template.subject}</code>
            </p>
          </div>
          <iframe
            title={template.title}
            srcDoc={template.previewHtml}
            className="h-[560px] w-full rounded-base border border-line bg-surface"
          />
          <details className="rounded-base border border-line bg-surface">
            <summary className="cursor-pointer p-4 text-sm font-medium">
              Ver código Liquid (copiar y pegar en Shopify)
            </summary>
            <pre className="max-h-96 overflow-auto border-t border-line p-4 text-xs leading-relaxed">
              {template.liquid}
            </pre>
          </details>
        </section>
      ))}
    </Container>
  );
}
