import { PRODUCT_FRAGMENT } from "./fragments";

/** Cross-sell: recomendaciones nativas de Shopify (intent RELATED). */
export const GET_PRODUCT_RECOMMENDATIONS_QUERY = /* GraphQL */ `
  query GetProductRecommendations($productId: ID!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productRecommendations(productId: $productId, intent: RELATED) {
      ...ProductFields
    }
  }
  ${PRODUCT_FRAGMENT}
`;
