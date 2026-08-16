import { COLLECTION_FRAGMENT, IMAGE_FRAGMENT, PRODUCT_FRAGMENT } from "./fragments";

export const GET_COLLECTIONS_QUERY = /* GraphQL */ `
  query GetCollections($first: Int!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    collections(first: $first) {
      nodes {
        ...CollectionFields
      }
    }
  }
  ${COLLECTION_FRAGMENT}
  ${IMAGE_FRAGMENT}
`;

export const GET_COLLECTION_BY_HANDLE_QUERY = /* GraphQL */ `
  query GetCollectionByHandle(
    $handle: String!
    $first: Int!
    $after: String
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      ...CollectionFields
      products(
        first: $first
        after: $after
        filters: $filters
        sortKey: $sortKey
        reverse: $reverse
      ) {
        nodes {
          ...ProductFields
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
  ${COLLECTION_FRAGMENT}
  ${PRODUCT_FRAGMENT}
`;
