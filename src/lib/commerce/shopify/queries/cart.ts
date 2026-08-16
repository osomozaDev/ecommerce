import { CART_FRAGMENT } from "./fragments";

export const GET_CART_QUERY = /* GraphQL */ `
  query GetCart($cartId: ID!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    cart(id: $cartId) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;
