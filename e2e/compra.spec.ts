import { expect, test } from "@playwright/test";

/**
 * El flujo que define el Definition of Done, de punta a punta:
 * catálogo → producto → variante → carrito → cantidades → checkout.
 * Corre contra fixtures: mismo flujo y mismos componentes que producción,
 * cambiando solo el provider de datos.
 */

test("flujo de compra completo", async ({ page }) => {
  // Home → catálogo por la navegación
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Productos" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Productos" })).toBeVisible();

  // Ficha de producto con variantes
  await page.getByRole("main").getByRole("link", { name: /Vela aromática Ámbar/ }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Vela aromática Ámbar" }),
  ).toBeVisible();

  // Cambiar variante actualiza el precio (250 g → 480 g)
  await page.getByRole("button", { name: "480 g" }).click();
  await expect(page.getByText("39,00").first()).toBeVisible();

  // Añadir al carrito → el contador del header refleja 1 al instante
  await page.getByRole("button", { name: "Añadir al carrito" }).click();
  await expect(page.getByRole("banner").getByRole("button", { name: /Carrito/ })).toContainText("1");

  // Drawer: se abre desde el header y muestra la línea
  await page.getByRole("banner").getByRole("button", { name: /Carrito/ }).click();
  const drawer = page.getByRole("dialog", { name: "Carrito" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText("Vela aromática Ámbar")).toBeVisible();

  // Página de carrito completa desde el drawer
  await drawer.getByRole("link", { name: "Ver carrito completo" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Carrito" })).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("link", { name: "Vela aromática Ámbar" }).first(),
  ).toBeVisible();
  await expect(page.getByText("480 g")).toBeVisible();

  // Aumentar cantidad → total de línea 78,00 €
  await page.getByRole("button", { name: "Aumentar cantidad" }).click();
  await expect(page.getByText("78,00").first()).toBeVisible();
  await expect(page.getByRole("banner").getByRole("button", { name: /Carrito/ })).toContainText("2");

  // El checkout apunta a la URL del carrito (Shopify Checkout en producción)
  const checkout = page.getByRole("link", { name: "Finalizar compra" });
  await expect(checkout).toHaveAttribute("href", /checkout/);

  // Eliminar → carrito vacío
  await page.getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText("Tu carrito está vacío.")).toBeVisible();
});

test("catálogo y colecciones renderizan desde el provider", async ({ page }) => {
  await page.goto("/colecciones");
  await expect(page.getByRole("heading", { level: 1, name: "Colecciones" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: /Novedades/ })).toBeVisible();

  await page.getByRole("main").getByRole("link", { name: /Iluminación/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Iluminación" })).toBeVisible();
  // La colección iluminacion tiene 3 productos en fixtures
  await expect(page.getByRole("main").getByRole("link", { name: /Lámpara Arco/ })).toBeVisible();
});

test("los filtros de catálogo acotan los resultados", async ({ page }) => {
  await page.goto("/productos");
  // 8 productos en fixtures; el difusor está agotado
  await expect(page.getByRole("main").getByRole("link", { name: /Difusor de cedro/ })).toBeVisible();

  await page.getByRole("main").getByRole("link", { name: "En stock" }).click();
  await expect(
    page.getByRole("main").getByRole("link", { name: /Difusor de cedro/ }),
  ).toHaveCount(0);

  await page.getByRole("main").getByRole("link", { name: "Más de 100" }).click();
  // Solo lámpara (149) y espejo Ø60 no cuentan (precio mínimo 79): queda la lámpara
  await expect(page.getByRole("main").getByRole("link", { name: /Lámpara Arco/ })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: /Vela aromática/ })).toHaveCount(0);
});

test("los eventos de analítica llegan al dataLayer", async ({ page }) => {
  await page.goto("/productos/vela-ambar");
  await page.getByRole("button", { name: "Añadir al carrito" }).click();
  await expect(page.getByRole("banner").getByRole("button", { name: /Carrito/ })).toContainText("1");

  const eventos = await page.evaluate(
    () => ((window as unknown as { dataLayer?: { event?: string }[] }).dataLayer ?? []).map((e) => e.event),
  );
  expect(eventos).toContain("view_item");
  expect(eventos).toContain("add_to_cart");

  const addEvent = await page.evaluate(() =>
    ((window as unknown as { dataLayer?: Record<string, unknown>[] }).dataLayer ?? []).find(
      (e) => e.event === "add_to_cart",
    ),
  );
  expect(addEvent).toMatchObject({
    currency: "EUR",
    value: 24,
    items: [{ item_name: "Vela aromática Ámbar", quantity: 1, price: 24 }],
  });
});

test("las reseñas se muestran en la ficha de producto", async ({ page }) => {
  await page.goto("/productos/vela-ambar");
  const reviews = page.getByRole("region", { name: "Reseñas" });
  await expect(reviews.getByRole("heading", { name: "Reseñas" })).toBeVisible();
  // 5 + 4 + 5 en fixtures → media 4.7 con 3 reseñas
  await expect(reviews.getByText("4.7 · 3 reseñas")).toBeVisible();
  await expect(reviews.getByText("Huele a hogar")).toBeVisible();
  await expect(reviews.getByText("Marta G.", { exact: false })).toBeVisible();

  // Un producto sin reseñas no muestra la sección
  await page.goto("/productos/espejo-orbita");
  await expect(page.getByRole("region", { name: "Reseñas" })).toHaveCount(0);
});

test("el banner de consentimiento solo aparece con vendor configurado", async ({ page }) => {
  // Stellazon (default) no tiene vendor de analítica: sin banner
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Aviso de cookies" })).toHaveCount(0);

  // Norte Atelier tiene GA4 configurado: banner visible y cero scripts hasta decidir
  await page.goto("http://tienda-b.localhost:3100/");
  const banner = page.getByRole("region", { name: "Aviso de cookies" });
  await expect(banner).toBeVisible();
  await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);

  // Rechazar: desaparece, la decisión persiste y sigue sin cargarse ningún vendor
  await banner.getByRole("button", { name: "Rechazar" }).click();
  await expect(banner).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("region", { name: "Aviso de cookies" })).toHaveCount(0);
  await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);
});

test("la cuenta de cliente informa cuando la tienda no tiene login activado", async ({ page }) => {
  // El tenant default no define customerAccount: sin enlace en el header
  await page.goto("/");
  await expect(page.getByRole("banner").getByRole("link", { name: "Cuenta" })).toHaveCount(0);

  // La página existe igualmente y explica el estado (sin romper)
  await page.goto("/cuenta");
  await expect(page.getByRole("heading", { level: 1, name: "Mi cuenta" })).toBeVisible();
  await expect(
    page.getByText("Esta tienda aún no tiene activado el acceso de clientes."),
  ).toBeVisible();
});

test("el laboratorio de diseño funciona con fixtures", async ({ page }) => {
  await page.goto("/dev/design-system");
  await expect(page.getByRole("heading", { level: 1, name: "Design System" })).toBeVisible();
  await expect(page.getByText("Tu carrito está vacío.")).toBeVisible(); // muestra vacía
  await expect(page.getByRole("heading", { name: "Resumen" })).toBeVisible(); // muestra con líneas
});
