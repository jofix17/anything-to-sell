import { QueryFilters } from "../types/query";

/**
 * Helper function to filter out insignificant or transient parameters
 * This helps create more stable cache keys for queries
 */
export const filterSignificantParams = (
  params: Record<string, unknown>,
  significantKeys: string[] = []
): Record<string, unknown> => {
  if (!params || typeof params !== "object") return {};

  // If no significant keys specified, keep all keys except those starting with '_'
  if (significantKeys.length === 0) {
    return Object.fromEntries(
      Object.entries(params).filter(([key]) => !key.startsWith("_"))
    );
  }

  // Filter to only include specified significant keys that exist in the params
  return Object.fromEntries(
    Object.entries(params).filter(([key]) => significantKeys.includes(key))
  );
};

/**
 * Hash a query parameter object to a stable string representation
 * This helps with comparing objects for cache invalidation
 */
export const hashQueryParams = (params: Record<string, unknown>): string => {
  return JSON.stringify(params, (_, val) => {
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      // Sort object keys for stability
      return Object.keys(val)
        .sort()
        .reduce((result: Record<string, unknown>, key) => {
          result[key] = (val as Record<string, unknown>)[key];
          return result;
        }, {});
    }
    return val;
  });
};

/**
 * Default significant parameter keys for common query types
 */
export const SIGNIFICANT_PARAM_KEYS = {
  users: ["role", "status", "isActive", "query", "page", "perPage"],
  products: [
    "categoryId",
    "vendorId",
    "status",
    "minPrice",
    "maxPrice",
    "onSale",
    "inStock",
    "query",
    "sortBy",
    "page",
    "perPage",
  ],
  orders: ["status", "startDate", "endDate", "query", "page", "perPage"],
  generic: ["page", "perPage", "query", "sortBy", "status"],
};

/**
 * Centralized query key definitions for React Query
 * Enables consistent cache management across the application
 */
export const QueryKeys = {
  auth: {
    currentUser: ["auth", "currentUser"],
    sessions: ["auth", "sessions"],
    profile: (userId?: string) => ["auth", "profile", userId], // Added for better specificity
  },
  user: {
    profile: ["user", "profile"],
    addresses: ["user", "addresses"],
    wishlist: ["user", "wishlist"],
  },
  cart: {
    current: ["cart"],
    items: ["cart", "items"],
    guestCheck: ["cart", "guestCheck"],
    checkExisting: ["cart", "checkExisting"],
    // Add more specific keys for better cache control
    item: (itemId: string) => ["cart", "item", itemId],
    transferStatus: (sourceId: string, targetId: string) => [
      "cart",
      "transfer",
      `${sourceId}->${targetId}`,
    ],
    // Create a function that returns all cart-related keys for batch invalidation
    getAllKeys: () => [
      ["cart"],
      ["cart", "items"],
      ["cart", "guestCheck"],
      ["cart", "checkExisting"],
    ],
  },
  products: {
    all: ["products"],
    list: (params: Record<string, unknown> = {}) => [
      "products",
      "list",
      filterSignificantParams(params, SIGNIFICANT_PARAM_KEYS.products),
    ],
    detail: (id: string) => ["products", "detail", id],
    reviews: (productId: string) => ["products", "reviews", productId],
    featured: ["products", "featured"],
    newArrivals: ["products", "newArrivals"],
    related: (productId: string) => ["products", "related", productId],
  },
  categories: {
    all: ["categories"],
    detail: (id: string) => ["categories", "detail", id],
  },
  orders: {
    all: ["orders"],
    list: (params: Record<string, unknown> = {}) => [
      "orders",
      "list",
      filterSignificantParams(params, SIGNIFICANT_PARAM_KEYS.orders),
    ],
    detail: (id: string) => ["orders", "detail", id],
  },
  vendor: {
    store: ["vendor", "store"],
    products: (filters: QueryFilters = {}) => [
      "vendor",
      "products",
      filterSignificantParams(filters, SIGNIFICANT_PARAM_KEYS.products),
    ],
    orders: (filters: QueryFilters = {}) => [
      "vendor",
      "orders",
      filterSignificantParams(filters, SIGNIFICANT_PARAM_KEYS.orders),
    ],
    dashboard: ["vendor", "dashboard"],
    salesReport: (params: QueryFilters = {}) => [
      "vendor",
      "salesReport",
      filterSignificantParams(params),
    ],
  },
  admin: {
    dashboard: ["admin", "dashboard"],
    users: (params: Record<string, unknown> = {}) => [
      "admin",
      "users",
      filterSignificantParams(params, SIGNIFICANT_PARAM_KEYS.users),
    ],
    products: (params: QueryFilters = {}) => [
      "admin",
      "products",
      filterSignificantParams(params, SIGNIFICANT_PARAM_KEYS.products),
    ],
    orders: (params: QueryFilters = {}) => [
      "admin",
      "orders",
      filterSignificantParams(params, SIGNIFICANT_PARAM_KEYS.orders),
    ],
    vendors: (params: QueryFilters = {}) => [
      "admin",
      "vendors",
      filterSignificantParams(params, SIGNIFICANT_PARAM_KEYS.users),
    ],
    discounts: ["admin", "discounts"],
  },
  support: {
    conversations: (status?: string) => ["support", "conversations", status],
    messages: (conversationId: string) => [
      "support",
      "messages",
      conversationId,
    ],
  },

  // Utils for working with query keys
  utils: {
    /**
     * Create a function that returns all keys related to a specific entity
     * Useful for invalidating all related queries after a mutation
     */
    getAllRelatedKeys: (
      entityType: "user" | "cart" | "product" | "order",
      entityId?: string
    ) => {
      switch (entityType) {
        case "user":
          return [
            QueryKeys.auth.currentUser,
            QueryKeys.user.profile,
            entityId ? QueryKeys.auth.profile(entityId) : null,
          ].filter(Boolean);
        case "cart":
          return [
            QueryKeys.cart.current,
            QueryKeys.cart.items,
            QueryKeys.cart.guestCheck,
            QueryKeys.cart.checkExisting,
          ];
        case "product":
          return [
            QueryKeys.products.all,
            entityId ? QueryKeys.products.detail(entityId) : null,
          ].filter(Boolean);
        case "order":
          return [
            QueryKeys.orders.all,
            entityId ? QueryKeys.orders.detail(entityId) : null,
          ].filter(Boolean);
        default:
          return [];
      }
    },

    /**
     * Check if a query key is related to an entity type
     * Useful for determining if a query should be invalidated
     */
    isRelatedToEntity: (queryKey: unknown[], entityType: string): boolean => {
      if (!queryKey.length) return false;
      return queryKey[0] === entityType;
    },
  },
};
