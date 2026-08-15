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

test("el laboratorio de diseño funciona con fixtures", async ({ page }) => {
  await page.goto("/dev/design-system");
  await expect(page.getByRole("heading", { level: 1, name: "Design System" })).toBeVisible();
  await expect(page.getByText("Tu carrito está vacío.")).toBeVisible(); // muestra vacía
  await expect(page.getByRole("heading", { name: "Resumen" })).toBeVisible(); // muestra con líneas
});
