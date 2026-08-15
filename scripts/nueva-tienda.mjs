#!/usr/bin/env node
/**
 * Provisioning de tienda nueva: crea el JSON del tenant, lo registra en el
 * índice y (opcional) da de alta los webhooks en Shopify vía Admin API.
 *
 * Uso:
 *   node scripts/nueva-tienda.mjs \
 *     --id=cliente-x \
 *     --nombre="Cliente X" \
 *     --store=cliente-x.myshopify.com \
 *     --dominio=https://cliente-x.com \
 *     [--tagline="..."] [--theme=theme-a] [--locale=es-ES] \
 *     [--webhooks-endpoint=https://mi-deploy.vercel.app] [--admin-token=shpat_...]
 *
 * El admin-token (scope write_webhooks) SOLO se usa en esta ejecución para
 * registrar webhooks; no se guarda en ningún sitio.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? "true"] : [a, "true"];
  }),
);

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

const id = args.id;
const nombre = args.nombre;
const store = args.store;
const dominio = args.dominio;

if (!id || !/^[a-z0-9-]+$/.test(id)) fail("--id requerido (minúsculas, números y guiones)");
if (!nombre) fail("--nombre requerido");
if (!store?.endsWith(".myshopify.com")) fail("--store debe ser xxx.myshopify.com");
if (!dominio?.startsWith("http")) fail("--dominio debe ser una URL con protocolo");

const theme = args.theme ?? "theme-a";
const locale = args.locale ?? "es-ES";
const tenantsDir = resolve(process.cwd(), "src/config/tenants");
const jsonPath = resolve(tenantsDir, `${id}.json`);
const indexPath = resolve(tenantsDir, "index.ts");

if (existsSync(jsonPath)) fail(`Ya existe ${jsonPath}`);

// 1. JSON del tenant con una homepage inicial editable
const tenant = {
  id,
  slug: id,
  domain: dominio,
  domains: [`${id}.localhost`],
  locale,
  // La tienda nace en fixtures: cámbialo a "shopify" (o elimínalo) cuando
  // el token Storefront esté configurado.
  dataSource: "fixtures",
  branding: { name: nombre, ...(args.tagline ? { tagline: args.tagline } : {}) },
  theme,
  pages: {
    homepage: [
      {
        type: "hero",
        title: nombre,
        subtitle: args.tagline ?? "",
        ctaLabel: "Ver productos",
        ctaHref: "/productos",
      },
      { type: "banner", text: "Envío gratuito a partir de 60 €" },
    ],
  },
  shopify: { storeDomain: store },
};
writeFileSync(jsonPath, JSON.stringify(tenant, null, 2) + "\n");
console.log(`✓ Creado src/config/tenants/${id}.json`);

// 2. Registro en el índice
const varName = id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
let index = readFileSync(indexPath, "utf8");
if (index.includes(`"./${id}.json"`)) {
  console.log("• Ya estaba en el índice");
} else {
  index = index.replace(
    /(\nexport const tenantData)/,
    `import ${varName} from "./${id}.json";\n$1`,
  );
  index = index.replace(/\];\s*$/, `, ${varName}];\n`);
  writeFileSync(indexPath, index);
  console.log("✓ Registrado en src/config/tenants/index.ts");
}

// 3. Webhooks vía Admin API (opcional)
const TOPICS = [
  "products/create",
  "products/update",
  "products/delete",
  "collections/create",
  "collections/update",
  "collections/delete",
];

if (args["admin-token"]) {
  const endpointBase = args["webhooks-endpoint"] ?? dominio;
  const address = `${endpointBase.replace(/\/$/, "")}/api/webhooks/shopify`;
  const apiVersion = args["api-version"] ?? "2025-10";
  console.log(`\nRegistrando webhooks → ${address}`);
  for (const topic of TOPICS) {
    const res = await fetch(`https://${store}/admin/api/${apiVersion}/webhooks.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": args["admin-token"],
      },
      body: JSON.stringify({ webhook: { topic, address, format: "json" } }),
    });
    if (res.ok) {
      console.log(`  ✓ ${topic}`);
    } else {
      const body = await res.text();
      console.log(`  ✗ ${topic} → ${res.status} ${body.slice(0, 120)}`);
    }
  }
} else {
  console.log(
    "\n• Webhooks: pasa --admin-token=shpat_… (scope write_webhooks) para registrarlos automáticamente,",
  );
  console.log("  o créalos a mano en el admin: Settings → Notifications → Webhooks.");
}

// 4. Instrucciones finales
const envSuffix = id.toUpperCase().replace(/-/g, "_");
console.log(`
Pasos restantes:
  1. Variables de entorno (local .env.local y Vercel Production):
       SHOPIFY_STOREFRONT_TOKEN__${envSuffix}=<token Storefront de ${store}>
       SHOPIFY_WEBHOOK_SECRET__${envSuffix}=<secreto de firma de webhooks>
  2. Dominio: añade ${dominio.replace(/^https?:\/\//, "")} al proyecto en Vercel (Settings → Domains).
  3. Prueba local: pnpm dev y abre http://${id}.localhost:3000
     (la tienda nace en modo fixtures; cuando el token esté configurado,
      cambia "dataSource" a "shopify" en su JSON)
  4. Commit + push: el deploy sale solo.
`);
