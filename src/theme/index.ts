import { getTenant } from "@/lib/tenant/resolve";
import type { ComponentVariantMap, ThemeConfig } from "./types";

export async function getTheme(): Promise<ThemeConfig> {
  return (await getTenant()).theme;
}

/**
 * Variante activa de un componente según el theme del tenant de la request.
 * Solo para Server Components (los dispatchers del design system).
 * Los Client Components reciben la variante ya resuelta vía props.
 */
export async function variantOf(component: keyof ComponentVariantMap): Promise<string> {
  return (await getTheme()).components[component];
}
