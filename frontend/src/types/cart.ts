import { Product } from "./product";

export type CartTransferAction = "merge" | "replace" | "copy";
// Objects
export interface Cart {
  id: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: string; // Changed to string to match backend response
  guestToken: string | null; // Added null to match backend response
  userId: string | null; // Added to match backend response
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

// Context
export interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  isInitialized: boolean;
  showTransferModal: boolean;
  setShowTransferModal: (show: boolean) => void;
  sourceCart: string | null;
  targetCart: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number) => Promise<boolean>;
  updateCartItem: (itemId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  hasGuestCart: boolean;
  hasUserCart: boolean;
  guestCartItemCount: number;
  userCartItemCount: number;
  transferCart: (action: CartTransferAction) => Promise<boolean>;
  isCartDataStale: () => boolean;
  checkCartConflicts: (force?: boolean) => Promise<void>;
}

// API RESPONSES
export interface GuestCartCheck {
  hasGuestCart: boolean;
  itemCount: number;
  total?: number; // Changed to string to match backend response
  cartId?: string;
}

export interface ExistingCartCheck {
  hasExistingCart: boolean;
  itemCount: number;
  total?: number; // Changed to string to match backend response
  cartId?: string;
}

export interface TransferCartResponse {
  sourceCartId: string;
  targetUserId: string;
  targetCartId: string;
  itemCount: number;
  total: number;
}

// API PARAMS
export interface AddToCartParams {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemParams {
  itemId: string;
  quantity: number;
}

export interface TransferCartParams {
  sourceCartId: string;
  targetUserId: string;
  actionType: string;
}
