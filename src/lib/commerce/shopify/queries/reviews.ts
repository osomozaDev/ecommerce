/**
 * Las reseñas se modelan como METAOBJETOS de tipo "review" (Shopify no tiene
 * reseñas nativas en la Storefront API). Definición esperada en el admin
 * (Settings → Custom data → Metaobjects), con acceso Storefront activado:
 *   product (texto: handle del producto) · author · rating (entero 1–5)
 *   title (opcional) · body · date (fecha ISO, opcional)
 * Si la tienda no define el metaobjeto, el provider degrada a "sin reseñas".
 */
export const GET_REVIEWS_QUERY = /* GraphQL */ `
  query GetReviews($first: Int!) {
    metaobjects(type: "review", first: $first) {
      nodes {
        id
        fields {
          key
          value
        }
      }
    }
  }
`;
