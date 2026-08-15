import type { ThemeConfig } from "@/theme/types";
import { themeA } from "./theme-a";
import { themeB } from "./theme-b";

/**
 * Registro de themes. Los tenants (JSON) referencian un theme por nombre;
 * los themes viven en código porque son material de diseño (Javi).
 * Añadir un theme = crear el archivo + registrarlo aquí.
 */
export const themes: Record<string, ThemeConfig> = {
  "theme-a": themeA,
  "theme-b": themeB,
};
