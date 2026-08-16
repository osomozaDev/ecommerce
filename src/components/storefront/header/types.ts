export interface HeaderProps {
  shopName: string;
  nav: { label: string; href: string }[];
  /** Enlace a /cuenta; solo llega si la tienda tiene login de clientes. */
  accountHref?: string;
}
