import type { ComponentType } from "react";
import type { HeaderProps } from "./types";
import { DefaultHeader } from "./DefaultHeader";

/** Añadir una variante de header = crear el archivo + registrarla aquí. */
export const headerVariants: Record<string, ComponentType<HeaderProps>> = {
  default: DefaultHeader,
};
