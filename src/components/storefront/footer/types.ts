export interface FooterProps {
  shopName: string;
  tagline?: string;
  nav: { label: string; href: string }[];
  /** Enlaces a las páginas legales (/legal/*), ya resueltos. */
  legalNav?: { label: string; href: string }[];
}
