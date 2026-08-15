"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trackSearch } from "@/lib/analytics/track";

/** Buscador del header: navega a /buscar?q=… (server-rendered). */
export function SearchBox() {
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        if (q) {
          trackSearch(q);
          router.push(`/buscar?q=${encodeURIComponent(q)}`);
        }
      }}
    >
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar…"
        aria-label="Buscar productos"
        className="w-28 rounded-button border border-line bg-surface px-3 py-1.5 text-sm transition-[width] outline-none focus:w-44 focus:border-ink sm:w-36"
      />
    </form>
  );
}
