import Image from "next/image";
import Link from "next/link";
import type { CollectionCardProps } from "./types";

export function DefaultCollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link href={collection.href} className="group flex flex-col gap-3">
      <div className="relative aspect-4/3 overflow-hidden rounded-base bg-surface">
        {collection.image && (
          <Image
            src={collection.image.src}
            alt={collection.image.alt}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 flex items-end bg-linear-to-t from-ink/50 to-transparent p-5">
          <h3 className="font-heading text-xl font-semibold text-bg">
            {collection.title}
          </h3>
        </div>
      </div>
      {collection.description && (
        <p className="text-sm text-muted">{collection.description}</p>
      )}
    </Link>
  );
}
