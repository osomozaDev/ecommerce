import Link from "next/link";
import type { BannerProps } from "./types";

export function DefaultBanner({ text, href }: BannerProps) {
  const content = (
    <p className="py-4 text-center text-sm font-medium tracking-wide text-brand-contrast">
      {text}
    </p>
  );
  return (
    <section className="bg-brand">
      {href ? (
        <Link href={href} className="block transition-opacity hover:opacity-90">
          {content}
        </Link>
      ) : (
        content
      )}
    </section>
  );
}
