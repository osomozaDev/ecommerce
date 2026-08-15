import { getTheme } from "@/theme";

/**
 * Inyecta los tokens del theme como CSS custom properties en :root.
 * globals.css los mapea a utilidades Tailwind (bg-brand, rounded-base, …),
 * de modo que cambiar de theme cambia toda la tienda sin tocar CSS.
 */
export function ThemeStyle() {
  const { tokens } = getTheme();
  const css = `:root{
--brand:${tokens.colors.brand};
--brand-contrast:${tokens.colors.brandContrast};
--bg:${tokens.colors.bg};
--surface:${tokens.colors.surface};
--ink:${tokens.colors.ink};
--muted:${tokens.colors.muted};
--line:${tokens.colors.line};
--radius:${tokens.radius};
--button-radius:${tokens.buttonRadius};
--container:${tokens.containerWidth};
--section-gap:${tokens.sectionSpacing};
--font-body-stack:${tokens.fontBody};
--font-heading-stack:${tokens.fontHeading};
--font-scale:${tokens.fontScale};
}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
