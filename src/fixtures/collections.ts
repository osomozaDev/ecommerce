import type { Collection } from "@/lib/commerce/types";

export const fixtureCollections: Collection[] = [
  {
    id: "fx-col-novedades",
    handle: "novedades",
    title: "Novedades",
    description: "Lo último en llegar al estudio: piezas nuevas cada temporada.",
    href: "/colecciones/novedades",
    image: { src: "/fixtures/producto-4.svg", alt: "Novedades", width: 800, height: 1000 },
    seo: { title: "Novedades", description: "Lo último en llegar al estudio." },
  },
  {
    id: "fx-col-iluminacion",
    handle: "iluminacion",
    title: "Iluminación",
    description: "Velas, difusores y lámparas para una luz cálida en casa.",
    href: "/colecciones/iluminacion",
    image: { src: "/fixtures/producto-1.svg", alt: "Iluminación", width: 800, height: 1000 },
    seo: { title: "Iluminación", description: "Luz cálida para casa." },
  },
  {
    id: "fx-col-textil",
    handle: "textil",
    title: "Textil",
    description: "Lino lavado, bouclé y fibras naturales para vestir la casa.",
    href: "/colecciones/textil",
    image: { src: "/fixtures/producto-3.svg", alt: "Textil", width: 800, height: 1000 },
    seo: { title: "Textil", description: "Fibras naturales para casa." },
  },
];

/** Qué productos (por handle) pertenecen a cada colección de fixtures. */
export const fixtureCollectionProducts: Record<string, string[]> = {
  novedades: ["lampara-arco", "espejo-orbita", "cojin-boucle", "vela-ambar"],
  iluminacion: ["lampara-arco", "vela-ambar", "difusor-cedro"],
  textil: ["manta-lino", "cojin-boucle"],
};
