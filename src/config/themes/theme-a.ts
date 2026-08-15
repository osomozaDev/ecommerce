import type { ThemeConfig } from "@/theme/types";

/** Theme de la tienda por defecto: cálido, editorial suave. */
export const themeA: ThemeConfig = {
  name: "theme-a",
  tokens: {
    fontBody: 'system-ui, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    fontHeading: 'Georgia, "Times New Roman", serif',
    fontScale: 1,
    radius: "0.75rem",
    buttonRadius: "9999px",
    containerWidth: "72rem",
    sectionSpacing: "5rem",
    colors: {
      brand: "#8A5A3B",
      brandContrast: "#FFFFFF",
      bg: "#FAF7F2",
      surface: "#FFFFFF",
      ink: "#2B2420",
      muted: "#8A7E74",
      line: "#E7DFD5",
    },
  },
  components: {
    header: "default",
    hero: "editorial",
    productCard: "default",
    collectionCard: "default",
    productGrid: "default",
    filterBar: "default",
    productDetail: "default",
    cart: "default",
    banner: "default",
    footer: "default",
  },
};
