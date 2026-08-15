/**
 * Theme Engine: separa branding (tokens) de variantes de componentes.
 * Un theme nuevo = un archivo en config/themes/. Sin tocar CSS de componentes.
 */

export interface ThemeTokens {
  /** Stacks de fuentes CSS. */
  fontBody: string;
  fontHeading: string;
  /** Multiplicador del tamaño base (1 = 16px). */
  fontScale: number;
  /** Radio de superficies (tarjetas, imágenes). */
  radius: string;
  buttonRadius: string;
  /** Ancho máximo del contenido. */
  containerWidth: string;
  /** Separación vertical entre secciones. */
  sectionSpacing: string;
  colors: {
    brand: string;
    brandContrast: string;
    bg: string;
    surface: string;
    ink: string;
    muted: string;
    line: string;
  };
}

/** Variante activa por componente. Las claves son los componentes del design system. */
export interface ComponentVariantMap {
  header: string;
  hero: string;
  productCard: string;
  productGrid: string;
  productDetail: string;
  cart: string;
  banner: string;
  footer: string;
}

export interface ThemeConfig {
  name: string;
  tokens: ThemeTokens;
  components: ComponentVariantMap;
}
