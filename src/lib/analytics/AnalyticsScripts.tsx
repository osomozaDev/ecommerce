import Script from "next/script";
import type { TenantConfig } from "@/lib/tenant/types";
import { getConsent } from "./consent-server";

/**
 * Carga los vendors de analítica configurados en el tenant (JSON público).
 * Sin configuración no se carga nada externo: los eventos de track() quedan
 * en dataLayer, listos para GTM o para conectar un vendor después.
 *
 * RGPD: los vendors solo se inyectan con consentimiento CONCEDIDO (cookie
 * de consent.ts, la pone el ConsentBanner). Sin decisión o con rechazo,
 * cero scripts de terceros.
 */
export async function AnalyticsScripts({ tenant }: { tenant: TenantConfig }) {
  const analytics = tenant.analytics;
  if (!analytics) return null;
  if ((await getConsent()) !== "granted") return null;
  const { ga4MeasurementId, plausibleDomain } = analytics;

  return (
    <>
      {ga4MeasurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${ga4MeasurementId}');`}
          </Script>
        </>
      )}
      {plausibleDomain && (
        <Script
          src="https://plausible.io/js/script.js"
          data-domain={plausibleDomain}
          strategy="afterInteractive"
        />
      )}
    </>
  );
}
