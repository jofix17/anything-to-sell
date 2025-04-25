import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ApiResponse } from "../types";
import {
  useWishlist as useWishlistQuery,
  useAddToWishlist,
  useRemoveFromWishlist,
  useToggleWishlist,
} from "../services/wishlistService";
import { useInvalidateQueries } from "../hooks/useQueryHooks";
import { QueryKeys } from "../utils/queryKeys";
import { useNotification } from "./NotificationContext";
import { WishlistItem } from "../types/wishlist";
import { useAuthContext } from "./AuthContext";

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (wishlistItemId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<boolean>; // Returns true if added, false if removed
  isInWishlist: (productId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [wishlistState, setWishlistState] = useState<{
    wishlistItems: WishlistItem[];
    isLoading: boolean;
    error: string | null;
  }>({
    wishlistItems: [],
    isLoading: false,
    error: null,
  });

  const { isAuthenticated } = useAuthContext();
  const { showNotification } = useNotification();
  const invalidateQueries = useInvalidateQueries();

  // Use React Query hook to fetch wishlist data
  const { isLoading: isWishlistLoading, refetch } = useWishlistQuery({
    enabled: isAuthenticated, // Only fetch wishlist if user is authenticated
    onSuccess: (response: ApiResponse<WishlistItem[]>) => {
      setWishlistState((prevState) => ({
        ...prevState,
        wishlistItems: response.data || [],
        isLoading: false,
        error: null,
      }));
    },
    onError: (error: unknown) => {
      setWishlistState((prevState) => ({
        ...prevState,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to load wishlist",
      }));
    },
  });

  // Set up mutation hooks
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();
  const toggleWishlistMutation = useToggleWishlist();

  // Update wishlist loading state
  useEffect(() => {
    setWishlistState((prevState) => ({
      ...prevState,
      isLoading: isWishlistLoading,
    }));
  }, [isWishlistLoading]);

  // Clear wishlist when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setWishlistState({
        wishlistItems: [],
        isLoading: false,
        error: null,
      });
    }
  }, [isAuthenticated]);

  // Refresh wishlist data
  const refreshWishlist = async () => {
    if (!isAuthenticated) return;

    try {
      setWishlistState((prevState) => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      await refetch();
    } catch (error) {
      setWishlistState((prevState) => ({
        ...prevState,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to refresh wishlist",
      }));
    }
  };

  // Add item to wishlist
  const addToWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      showNotification("Please log in to add items to your wishlist", {
        type: "info",
      });
      return;
    }

    try {
      setWishlistState((prevState) => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      const result = await addToWishlistMutation.mutateAsync(productId);

      // If we have the item data in the response, add it to the state
      if (result.data) {
        setWishlistState((prevState) => ({
          ...prevState,
          wishlistItems: [...prevState.wishlistItems, result.data],
          isLoading: false,
        }));
      }

      showNotification("Item added to wishlist", { type: "success" });

      // Invalidate wishlist query to ensure consistency
      invalidateQueries(QueryKeys.user.wishlist);
    } catch (error) {
      setWishlistState((prevState) => ({
        ...prevState,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to add item to wishlist",
      }));
      showNotification("Failed to add item to wishlist", { type: "error" });
      throw error;
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (wishlistItemId: string) => {
    try {
      setWishlistState((prevState) => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      await removeFromWishlistMutation.mutateAsync(wishlistItemId);

      // Remove the item from state
      setWishlistState((prevState) => ({
        ...prevState,
        wishlistItems: prevState.wishlistItems.filter(
          (item) => item.id !== wishlistItemId
        ),
        isLoading: false,
      }));

      showNotification("Item removed from wishlist", { type: "info" });

      // Invalidate wishlist query to ensure consistency
      invalidateQueries(QueryKeys.user.wishlist);
    } catch (error) {
      setWishlistState((prevState) => ({
        ...prevState,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to remove item from wishlist",
      }));
      showNotification("Failed to remove item from wishlist", {
        type: "error",
      });
      throw error;
    }
  };

  // Toggle wishlist item (add if not in wishlist, remove if already in wishlist)
  const toggleWishlist = async (productId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      showNotification("Please log in to manage your wishlist", {
        type: "info",
      });
      return false;
    }

    try {
      setWishlistState((prevState) => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      const result = await toggleWishlistMutation.mutateAsync(productId);
      const { added, item } = result.data;
      console.log({ added });
      if (added && item) {
        // Item was added
        setWishlistState((prevState) => ({
          ...prevState,
          wishlistItems: [...prevState.wishlistItems, item],
          isLoading: false,
        }));
        showNotification("Item added to wishlist", { type: "success" });
      } else {
        // Item was removed
        setWishlistState((prevState) => ({
          ...prevState,
          wishlistItems: prevState.wishlistItems.filter(
            (wishlistItem) => wishlistItem.productId !== productId
          ),
          isLoading: false,
        }));
        showNotification("Item removed from wishlist", { type: "info" });
      }

      // Invalidate wishlist query to ensure consistency
      invalidateQueries(QueryKeys.user.wishlist);

      return added;
    } catch (error) {
      setWishlistState((prevState) => ({
        ...prevState,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to update wishlist",
      }));
      showNotification("Failed to update wishlist", { type: "error" });
      throw error;
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId: string): boolean => {
    return wishlistState.wishlistItems.some(
      (item) => item.productId === productId
    );
  };

  return (
    <WishlistContext.Provider
      value={{
        ...wishlistState,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

// Custom hook to use the wishlist context
export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
