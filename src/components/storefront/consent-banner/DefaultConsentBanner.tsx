"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setConsentClient, type ConsentValue } from "@/lib/analytics/consent";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { ConsentBannerProps } from "./types";

/**
 * Banner de consentimiento de cookies. Solo se monta cuando el tenant tiene
 * un vendor de analítica configurado y el visitante aún no ha decidido
 * (lo comprueba el layout server-side). Al decidir, guarda la cookie y
 * refresca para que AnalyticsScripts cargue (o no) los vendors.
 */
export function DefaultConsentBanner({ shopName }: ConsentBannerProps) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  function decide(value: ConsentValue) {
    setConsentClient(value);
    setHidden(true);
    router.refresh();
  }

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface shadow-[0_-8px_30px_rgba(0,0,0,0.08)]"
    >
      <Container className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-muted">
          {shopName} usa cookies de analítica para entender cómo se usa la
          tienda. Solo se activan si las aceptas.
        </p>
        <div className="flex shrink-0 gap-3">
          <Button variant="secondary" onClick={() => decide("denied")}>
            Rechazar
          </Button>
          <Button onClick={() => decide("granted")}>Aceptar</Button>
        </div>
      </Container>
    </div>
  );
}
