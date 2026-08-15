import { getTenant } from "@/lib/tenant/resolve";
import type { ComponentVariantMap, ThemeConfig } from "./types";

export function getTheme(): ThemeConfig {
  return getTenant().theme;
}

/**
 * Variante activa de un componente según el theme del tenant.
 * Solo para Server Components (los dispatchers del design system).
 * Los Client Components reciben la variante ya resuelta vía props.
 */
export function variantOf(component: keyof ComponentVariantMap): string {
  return getTheme().components[component];
}
