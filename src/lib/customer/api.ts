import "server-only";
import type { Money } from "@/lib/commerce/types";
import { money } from "@/lib/commerce/money";
import type { TenantConfig } from "@/lib/tenant/types";
import type { CustomerSession } from "./session";

/**
 * Cliente GraphQL de la Customer Account API. Datos POR USUARIO: nunca se
 * cachean. Devuelve ViewModels (fecha y precio ya formateados), como el
 * resto del dominio commerce.
 */

const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2025-10";

export interface CustomerOrder {
  id: string;
  /** Número visible del pedido, ej. "#1001". */
  name: string;
  /** Fecha ya formateada con el locale del tenant. */
  date: string;
  /** Estado de pago humanizado (es). */
  status?: string;
  total: Money;
}

export interface CustomerOverview {
  firstName?: string;
  email?: string;
  orders: CustomerOrder[];
}

const OVERVIEW_QUERY = /* GraphQL */ `
  query CustomerOverview {
    customer {
      firstName
      emailAddress {
        emailAddress
      }
      orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          id
          name
          processedAt
          financialStatus
          totalPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

const FINANCIAL_STATUS_ES: Record<string, string> = {
  PAID: "Pagado",
  PENDING: "Pago pendiente",
  AUTHORIZED: "Autorizado",
  REFUNDED: "Reembolsado",
  PARTIALLY_REFUNDED: "Reembolso parcial",
  PARTIALLY_PAID: "Pago parcial",
  VOIDED: "Anulado",
};

interface RawOverview {
  customer: {
    firstName: string | null;
    emailAddress: { emailAddress: string | null } | null;
    orders: {
      nodes: {
        id: string;
        name: string;
        processedAt: string;
        financialStatus: string | null;
        totalPrice: { amount: string; currencyCode: string };
      }[];
    };
  } | null;
}

export async function getCustomerOverview(
  tenant: TenantConfig,
  session: CustomerSession,
): Promise<CustomerOverview> {
  const config = tenant.customerAccount;
  if (!config) throw new Error(`El tenant "${tenant.id}" no tiene customerAccount`);

  const res = await fetch(
    `https://shopify.com/${config.shopId}/account/customer/api/${API_VERSION}/graphql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // La Customer Account API espera el access token tal cual (sin "Bearer").
        Authorization: session.accessToken,
      },
      body: JSON.stringify({ query: OVERVIEW_QUERY }),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`Customer Account API respondió ${res.status}`);
  }
  const json = (await res.json()) as { data?: RawOverview; errors?: { message: string }[] };
  if (json.errors?.length || !json.data?.customer) {
    throw new Error(
      `Customer Account API: ${json.errors?.map((e) => e.message).join(" | ") ?? "sin customer"}`,
    );
  }

  const c = json.data.customer;
  const dateFormat = new Intl.DateTimeFormat(tenant.locale, { dateStyle: "medium" });
  return {
    firstName: c.firstName ?? undefined,
    email: c.emailAddress?.emailAddress ?? undefined,
    orders: c.orders.nodes.map((o) => ({
      id: o.id,
      name: o.name,
      date: dateFormat.format(new Date(o.processedAt)),
      status: o.financialStatus
        ? (FINANCIAL_STATUS_ES[o.financialStatus] ?? o.financialStatus)
        : undefined,
      total: money(parseFloat(o.totalPrice.amount), o.totalPrice.currencyCode, tenant.locale),
    })),
  };
}
