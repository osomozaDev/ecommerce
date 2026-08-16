import type { TenantConfig } from "@/lib/tenant/types";
import { hasAnalyticsVendor } from "@/lib/analytics/consent";

/**
 * Plantillas de páginas legales: viven UNA vez en el engine y se rellenan
 * con los datos del tenant (bloque `legal` + dominio, analítica, login…).
 * Funciones puras → testeables. El texto es una base razonable para
 * ecommerce es-ES; la revisión final de cada tienda es cosa de su abogado.
 */

export const LEGAL_SLUGS = [
  "aviso-legal",
  "privacidad",
  "cookies",
  "devoluciones",
] as const;

export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalPage {
  slug: LegalSlug;
  title: string;
  description: string;
  /** true si faltan datos registrales del tenant (se avisa en la página). */
  incomplete: boolean;
  sections: LegalSection[];
}

const PENDIENTE = "[pendiente de configurar]";

function hostname(tenant: TenantConfig): string {
  return new URL(tenant.domain).hostname;
}

interface LegalData {
  company: string;
  taxId: string;
  address: string;
  email: string;
  returnDays: number;
  incomplete: boolean;
}

function legalData(tenant: TenantConfig): LegalData {
  const legal = tenant.legal;
  return {
    company: legal?.companyName ?? tenant.branding.name,
    taxId: legal?.taxId ?? PENDIENTE,
    address: legal?.address ?? PENDIENTE,
    email: legal?.email ?? PENDIENTE,
    returnDays: legal?.returnDays ?? 14,
    incomplete: !legal?.companyName || !legal.taxId || !legal.address || !legal.email,
  };
}

function avisoLegal(tenant: TenantConfig, d: LegalData): LegalSection[] {
  return [
    {
      heading: "Identificación del titular",
      paragraphs: [
        `En cumplimiento de la Ley 34/2002 de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se informa de que el sitio ${hostname(tenant)} es titularidad de ${d.company}, con NIF ${d.taxId} y domicilio en ${d.address}.`,
        `Contacto: ${d.email}.`,
      ],
    },
    {
      heading: "Objeto",
      paragraphs: [
        `${tenant.branding.name} es una tienda online de venta de productos. El acceso y uso del sitio atribuye la condición de usuario e implica la aceptación de este aviso legal.`,
      ],
    },
    {
      heading: "Propiedad intelectual",
      paragraphs: [
        `Los contenidos del sitio (textos, imágenes, diseño y código) son titularidad de ${d.company} o de sus licenciantes. No se permite su reproducción o distribución sin autorización.`,
      ],
    },
    {
      heading: "Responsabilidad",
      paragraphs: [
        `${d.company} no responde de los daños derivados de un uso incorrecto del sitio ni de interrupciones ajenas a su control, sin perjuicio de los derechos que la ley reconoce a las personas consumidoras.`,
      ],
    },
    {
      heading: "Ley aplicable",
      paragraphs: [
        "Este aviso se rige por la legislación española. Para cualquier controversia serán competentes los juzgados que correspondan conforme a la normativa de consumidores.",
      ],
    },
  ];
}

function privacidad(tenant: TenantConfig, d: LegalData): LegalSection[] {
  const tratamientos = [
    "Pedidos y pagos: los datos necesarios para tramitar tu compra (identificación, dirección de envío y facturación, pago) se tratan a través de Shopify, que actúa como encargado del tratamiento y procesa el pago de forma segura. No almacenamos datos de tarjetas.",
  ];
  if (tenant.customerAccount) {
    tratamientos.push(
      "Cuenta de cliente: si te registras, el inicio de sesión se realiza en Shopify (nunca almacenamos tu contraseña) y usamos tu perfil para mostrarte tus pedidos.",
    );
  }
  if (hasAnalyticsVendor(tenant.analytics)) {
    tratamientos.push(
      "Analítica: solo si aceptas las cookies de analítica, se tratan datos de uso de la tienda de forma agregada para mejorar el servicio (ver política de cookies).",
    );
  }
  return [
    {
      heading: "Responsable del tratamiento",
      paragraphs: [
        `${d.company}, NIF ${d.taxId}, ${d.address}. Contacto para protección de datos: ${d.email}.`,
      ],
    },
    { heading: "Qué datos tratamos y para qué", paragraphs: tratamientos },
    {
      heading: "Base legal",
      paragraphs: [
        "La ejecución del contrato de compraventa (pedidos y envíos), el consentimiento (analítica y comunicaciones opcionales) y el cumplimiento de obligaciones legales (facturación y fiscalidad).",
      ],
    },
    {
      heading: "Destinatarios",
      paragraphs: [
        "Shopify International Ltd. como plataforma de comercio y pagos, y los transportistas necesarios para la entrega. No se venden datos a terceros.",
      ],
    },
    {
      heading: "Conservación y derechos",
      paragraphs: [
        "Los datos se conservan mientras exista relación contractual y los plazos legales de facturación.",
        `Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad (RGPD) escribiendo a ${d.email}. También puedes reclamar ante la AEPD (aepd.es).`,
      ],
    },
  ];
}

function cookies(tenant: TenantConfig, d: LegalData): LegalSection[] {
  const tecnicas = [
    "cartId: mantiene tu carrito entre visitas (30 días).",
    "cookie_consent: recuerda tu decisión sobre las cookies de analítica (180 días).",
  ];
  if (tenant.customerAccount) {
    tecnicas.push("customer_session: mantiene tu sesión de cliente iniciada (30 días).");
  }

  const sections: LegalSection[] = [
    {
      heading: "Cookies técnicas (no requieren consentimiento)",
      paragraphs: [
        "Imprescindibles para que la tienda funcione:",
        ...tecnicas,
      ],
    },
  ];

  if (hasAnalyticsVendor(tenant.analytics)) {
    const vendors: string[] = [];
    if (tenant.analytics?.ga4MeasurementId) {
      vendors.push(
        "Google Analytics 4 (Google Ireland Ltd.): estadísticas de uso agregadas.",
      );
    }
    if (tenant.analytics?.plausibleDomain) {
      vendors.push("Plausible Analytics: estadísticas de uso sin identificadores personales.");
    }
    sections.push({
      heading: "Cookies de analítica (solo con tu consentimiento)",
      paragraphs: [
        "Se activan únicamente si pulsas “Aceptar” en el aviso de cookies:",
        ...vendors,
        "Puedes cambiar de opinión en cualquier momento borrando las cookies de este sitio en tu navegador: el aviso volverá a aparecer.",
      ],
    });
  } else {
    sections.push({
      heading: "Cookies de terceros",
      paragraphs: [
        "Esta tienda no utiliza cookies de analítica ni de publicidad de terceros.",
      ],
    });
  }

  sections.push({
    heading: "Responsable",
    paragraphs: [`${d.company} — ${d.email}.`],
  });
  return sections;
}

function devoluciones(tenant: TenantConfig, d: LegalData): LegalSection[] {
  return [
    {
      heading: "Derecho de desistimiento",
      paragraphs: [
        `Dispones de ${d.returnDays} días naturales desde la recepción del pedido para desistir de la compra sin necesidad de justificación.`,
        `Para ejercerlo, escribe a ${d.email} indicando tu número de pedido. Te responderemos con las instrucciones de devolución.`,
      ],
    },
    {
      heading: "Condiciones",
      paragraphs: [
        "Los productos deben devolverse en su estado original. Quedan excluidos los productos precintados que hayan sido desprecintados por razones de higiene y los personalizados.",
      ],
    },
    {
      heading: "Reembolso",
      paragraphs: [
        "El reembolso se realiza por el mismo medio de pago de la compra, gestionado por Shopify, en un máximo de 14 días desde que recibamos el producto o la prueba de su envío.",
      ],
    },
    {
      heading: "Producto defectuoso",
      paragraphs: [
        `Si el producto llega dañado o no conforme, contacta con ${d.email}: los gastos de la devolución corren de nuestra cuenta y se aplica la garantía legal de conformidad (3 años).`,
      ],
    },
  ];
}

const TEMPLATES: Record<
  LegalSlug,
  { title: string; description: string; build: (t: TenantConfig, d: LegalData) => LegalSection[] }
> = {
  "aviso-legal": {
    title: "Aviso legal",
    description: "Identificación del titular y condiciones de uso del sitio.",
    build: avisoLegal,
  },
  privacidad: {
    title: "Política de privacidad",
    description: "Qué datos tratamos, con qué base legal y cómo ejercer tus derechos.",
    build: privacidad,
  },
  cookies: {
    title: "Política de cookies",
    description: "Qué cookies usa esta tienda y cómo gestionar tu consentimiento.",
    build: cookies,
  },
  devoluciones: {
    title: "Envíos y devoluciones",
    description: "Derecho de desistimiento, condiciones y reembolsos.",
    build: devoluciones,
  },
};

export function legalPage(slug: string, tenant: TenantConfig): LegalPage | null {
  const template = TEMPLATES[slug as LegalSlug];
  if (!template) return null;
  const d = legalData(tenant);
  return {
    slug: slug as LegalSlug,
    title: template.title,
    description: template.description,
    incomplete: d.incomplete,
    sections: template.build(tenant, d),
  };
}

/** Enlaces del pie: las cuatro páginas legales, ya resueltos. */
export function legalNav(): { label: string; href: string }[] {
  return LEGAL_SLUGS.map((slug) => ({
    label: TEMPLATES[slug].title,
    href: `/legal/${slug}`,
  }));
}
