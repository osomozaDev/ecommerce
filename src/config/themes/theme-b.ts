import type { ThemeConfig } from "@/theme/types";

/** Theme de la segunda tienda (test arquitectónico): frío, geométrico, minimal. */
export const themeB: ThemeConfig = {
  name: "theme-b",
  tokens: {
    fontBody: 'system-ui, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    fontHeading: 'system-ui, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    fontScale: 0.95,
    radius: "0",
    buttonRadius: "0",
    containerWidth: "80rem",
    sectionSpacing: "3.5rem",
    colors: {
      brand: "#1D3557",
      brandContrast: "#FFFFFF",
      bg: "#FFFFFF",
      surface: "#F4F6F8",
      ink: "#101418",
      muted: "#5E6B78",
      line: "#DDE3E9",
    },
  },
  components: {
    header: "default",
    hero: "default",
    productCard: "minimal",
    productGrid: "default",
    productDetail: "default",
    cart: "default",
    banner: "default",
    footer: "default",
  },
};
