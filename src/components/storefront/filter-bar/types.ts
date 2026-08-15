/** Parámetros de URL que maneja la barra de filtros. */
export interface FilterParams {
  orden?: string;
  stock?: string;
  precio?: string;
}

export interface FilterBarProps {
  /** Ruta base sobre la que se construyen los enlaces (p. ej. /productos). */
  basePath: string;
  /** Parámetros actuales de la URL. */
  params: FilterParams;
}
