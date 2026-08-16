/**
 * Fixtures de reseñas por handle de producto. Respetan el ViewModel Review
 * (fecha ya formateada). Javi puede ampliarlas para probar el componente.
 */
import type { Review } from "@/lib/commerce/types";

export const fixtureReviews: Record<string, Review[]> = {
  "vela-ambar": [
    {
      id: "fx-rev-vela-1",
      author: "Marta G.",
      rating: 5,
      title: "Huele a hogar",
      body: "El aroma es cálido sin ser empalagoso y dura muchísimo. El vaso lo reutilizo como portalápices.",
      date: "3 de junio de 2026",
    },
    {
      id: "fx-rev-vela-2",
      author: "Jorge L.",
      rating: 4,
      body: "Muy buena cera, arde limpia. Me habría gustado una mecha de repuesto.",
      date: "21 de mayo de 2026",
    },
    {
      id: "fx-rev-vela-3",
      author: "Ana P.",
      rating: 5,
      title: "Repetiré",
      body: "La compré de regalo y acabé pidiendo otra para casa. El formato grande sale muy a cuenta.",
      date: "9 de abril de 2026",
    },
  ],
  "lampara-arco": [
    {
      id: "fx-rev-lampara-1",
      author: "Isa R.",
      rating: 5,
      title: "Preciosa luz",
      body: "La pantalla de lino da una luz muy cálida. La base pesa lo justo y se ve sólida.",
      date: "14 de mayo de 2026",
    },
    {
      id: "fx-rev-lampara-2",
      author: "Carlos M.",
      rating: 4,
      body: "Bonita y bien acabada. El regulador va suave, aunque el cable podría ser más largo.",
      date: "2 de marzo de 2026",
    },
  ],
  "manta-lino": [
    {
      id: "fx-rev-manta-1",
      author: "Lucía T.",
      rating: 5,
      title: "Suave de verdad",
      body: "Nada que ver con otros linos que rascan. Tras dos lavados está aún mejor.",
      date: "28 de febrero de 2026",
    },
  ],
};
