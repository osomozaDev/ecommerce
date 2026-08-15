import Link from "next/link";
import type { FilterBarProps } from "./types";
import { PRICE_RANGES, SORT_OPTIONS, filterHref } from "./params";

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-button border px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
        active
          ? "border-ink bg-ink text-bg"
          : "border-line text-muted hover:border-ink hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export function DefaultFilterBar({ basePath, params }: FilterBarProps) {
  const orden = params.orden ?? "";
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <nav aria-label="Ordenar" className="flex flex-wrap gap-2">
        {SORT_OPTIONS.map((option) => (
          <Chip
            key={option.key}
            href={filterHref(basePath, params, { orden: option.key || undefined })}
            active={option.key === orden}
          >
            {option.label}
          </Chip>
        ))}
      </nav>

      <nav aria-label="Filtrar" className="flex flex-wrap gap-2">
        <Chip
          href={filterHref(basePath, params, {
            stock: params.stock === "1" ? undefined : "1",
          })}
          active={params.stock === "1"}
        >
          En stock
        </Chip>
        {PRICE_RANGES.map((range) => (
          <Chip
            key={range.key}
            href={filterHref(basePath, params, {
              precio: params.precio === range.key ? undefined : range.key,
            })}
            active={params.precio === range.key}
          >
            {range.label}
          </Chip>
        ))}
      </nav>
    </div>
  );
}
