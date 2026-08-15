import type { ReactNode } from "react";

/** Ancho de contenido controlado por el token containerWidth del theme. */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[var(--container)] px-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}
