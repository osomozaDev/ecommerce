#!/usr/bin/env node
/**
 * Generación de tienda por IA: a partir de un brief en lenguaje natural,
 * Claude diseña la identidad completa del tenant — branding, paleta,
 * tipografías, variantes de componentes y bloques de homepage — y este
 * script la registra como una tienda más. La salida es el MISMO formato
 * JSON que crea nueva-tienda.mjs a mano: la IA produce configuración,
 * nunca código.
 *
 * Uso:
 *   node scripts/genera-tienda.mjs \
 *     --brief="Tienda de velas artesanales de lujo llamada Lumen, estética minimalista cálida" \
 *     --store=lumen.myshopify.com \
 *     --dominio=https://lumen.example.com \
 *     [--id=lumen] [--colecciones=novedades,esenciales]
 *
 * Requiere credenciales de la API de Anthropic (ANTHROPIC_API_KEY o
 * `ant auth login`). La tienda nace en modo fixtures.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import Anthropic from "@anthropic-ai/sdk";

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

const brief = args.brief;
const store = args.store;
const dominio = args.dominio;
if (!brief) fail('--brief requerido (descripción de la tienda en lenguaje natural)');
if (!store?.endsWith(".myshopify.com")) fail("--store debe ser xxx.myshopify.com");
if (!dominio?.startsWith("http")) fail("--dominio debe ser una URL con protocolo");

const colecciones = args.colecciones
  ? args.colecciones.split(",").map((c) => c.trim()).filter(Boolean)
  : [];

// ── Schema de la parte generada por IA (structured outputs la garantiza) ──
const heroBlock = {
  type: "object",
  additionalProperties: false,
  required: ["type", "variant", "title", "subtitle", "ctaLabel", "ctaHref"],
  properties: {
    type: { const: "hero" },
    variant: { type: "string", enum: ["default", "editorial"] },
    title: { type: "string" },
    subtitle: { type: "string" },
    ctaLabel: { type: "string" },
    ctaHref: { const: "/productos" },
  },
};
const bannerBlock = {
  type: "object",
  additionalProperties: false,
  required: ["type", "text"],
  properties: {
    type: { const: "banner" },
    text: { type: "string" },
  },
};
const featuredBlock = {
  type: "object",
  additionalProperties: false,
  required: ["type", "collection", "title", "first"],
  properties: {
    type: { const: "featuredCollection" },
    collection: { type: "string", enum: colecciones.length ? colecciones : ["novedades"] },
    title: { type: "string" },
    first: { type: "integer" },
  },
};

const colorProps = Object.fromEntries(
  ["brand", "brandContrast", "bg", "surface", "ink", "muted", "line"].map((k) => [
    k,
    { type: "string", description: `Color ${k} en hex (#RRGGBB)` },
  ]),
);

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["id", "slug", "branding", "theme", "themeOverrides", "pages"],
  properties: {
    id: { type: "string", description: "kebab-case, corto, derivado del nombre" },
    slug: { type: "string" },
    branding: {
      type: "object",
      additionalProperties: false,
      required: ["name", "tagline"],
      properties: {
        name: { type: "string" },
        tagline: { type: "string", description: "Tagline corto en español" },
      },
    },
    theme: {
      type: "string",
      enum: ["theme-a", "theme-b"],
      description: "Theme base: theme-a cálido/editorial-serif, theme-b frío/geométrico",
    },
    themeOverrides: {
      type: "object",
      additionalProperties: false,
      required: ["tokens", "components"],
      properties: {
        tokens: {
          type: "object",
          additionalProperties: false,
          required: ["fontHeading", "fontBody", "radius", "buttonRadius", "sectionSpacing", "colors"],
          properties: {
            fontHeading: { type: "string", description: "Stack CSS de fuentes del sistema (sin webfonts)" },
            fontBody: { type: "string" },
            radius: { type: "string", description: "border-radius de superficies, ej. 0.75rem" },
            buttonRadius: { type: "string" },
            sectionSpacing: { type: "string" },
            colors: {
              type: "object",
              additionalProperties: false,
              required: ["brand", "brandContrast", "bg", "surface", "ink", "muted", "line"],
              properties: colorProps,
            },
          },
        },
        components: {
          type: "object",
          additionalProperties: false,
          required: ["hero", "productCard"],
          properties: {
            hero: { type: "string", enum: ["default", "editorial"] },
            productCard: { type: "string", enum: ["default", "minimal"] },
          },
        },
      },
    },
    pages: {
      type: "object",
      additionalProperties: false,
      required: ["homepage"],
      properties: {
        homepage: {
          type: "array",
          description: "3 a 5 bloques: empieza con hero; incluye al menos un banner",
          items: { anyOf: [heroBlock, bannerBlock, featuredBlock] },
        },
      },
    },
  },
};

const SYSTEM = `Eres el director de diseño de una fábrica de ecommerce premium. A partir de un brief, diseñas la identidad completa de una tienda online: naming, copy y sistema visual.

Reglas:
- Todo el copy en español (es-ES), tono acorde al brief, sin clichés de marketing.
- La paleta debe ser coherente y accesible: ink sobre bg y brandContrast sobre brand deben tener contraste alto (WCAG AA). bg y surface son fondos claros u oscuros coherentes entre sí; muted legible sobre bg; line sutil.
- Colores en hex de 6 dígitos. Nada de degradados imposibles: son tokens planos.
- Fuentes: SOLO stacks de fuentes del sistema (Georgia, Palatino, Avenir Next, Helvetica Neue, system-ui, Menlo…), sin webfonts.
- La estética debe derivar del brief (lujo ≠ deportivo ≠ infantil): radios, espaciado y variantes deben reflejarlo (p. ej. lujo: radios pequeños, espaciado amplio, hero editorial).
- id: kebab-case corto y pronunciable.
${colecciones.length ? `- Colecciones disponibles para bloques featuredCollection: ${colecciones.join(", ")}.` : "- No hay colecciones confirmadas: usa solo bloques hero y banner."}`;

// ── Llamada a Claude ──
const client = new Anthropic();
console.log("Generando identidad de tienda con Claude…");

let response;
try {
  response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 8192,
    system: SYSTEM,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content: `Brief de la tienda:\n${brief}` }],
  });
} catch (error) {
  if (error instanceof Anthropic.AuthenticationError) {
    fail("Credenciales de Anthropic no válidas. Define ANTHROPIC_API_KEY o ejecuta `ant auth login`.");
  }
  throw error;
}

if (response.stop_reason === "refusal") {
  fail("La generación fue rechazada por los clasificadores de seguridad. Reformula el brief.");
}

const generado = JSON.parse(response.content.find((b) => b.type === "text").text);
const id = args.id ?? generado.id;
if (!/^[a-z0-9-]+$/.test(id)) fail(`id generado inválido: ${id}`);

// ── Ensamblado del tenant completo ──
const tenant = {
  id,
  slug: generado.slug,
  domain: dominio,
  domains: [`${id}.localhost`],
  locale: "es-ES",
  dataSource: "fixtures",
  branding: generado.branding,
  theme: generado.theme,
  themeOverrides: generado.themeOverrides,
  pages: generado.pages,
  shopify: { storeDomain: store },
};

const tenantsDir = resolve(process.cwd(), "src/config/tenants");
const jsonPath = resolve(tenantsDir, `${id}.json`);
if (existsSync(jsonPath)) fail(`Ya existe ${jsonPath}`);
writeFileSync(jsonPath, JSON.stringify(tenant, null, 2) + "\n");
console.log(`✓ Creado src/config/tenants/${id}.json`);

// Registro en el índice (mismo mecanismo que nueva-tienda.mjs)
const indexPath = resolve(tenantsDir, "index.ts");
const varName = id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
let index = readFileSync(indexPath, "utf8");
if (!index.includes(`"./${id}.json"`)) {
  index = index.replace(/(\nexport const tenantData)/, `import ${varName} from "./${id}.json";\n$1`);
  index = index.replace(/\];\s*$/, `, ${varName}];\n`);
  writeFileSync(indexPath, index);
  console.log("✓ Registrado en src/config/tenants/index.ts");
}

console.log(`
Identidad generada: ${generado.branding.name} — ${generado.branding.tagline}
Theme base ${generado.theme} · brand ${generado.themeOverrides.tokens.colors.brand}

Pasos restantes:
  1. Prueba local: pnpm dev y abre http://${id}.localhost:3000
  2. Cuando la tienda Shopify exista: token en env (SHOPIFY_STOREFRONT_TOKEN__${id.toUpperCase().replace(/-/g, "_")}) y cambia "dataSource" a "shopify".
  3. Ajusta lo que quieras en el JSON (es solo configuración) y haz commit.
`);
