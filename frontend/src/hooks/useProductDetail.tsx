import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import { useAuthContext } from "../context/AuthContext";
import { useCartContext } from "../context/CartContext";
import { useProductDetail as useProductDetailApi } from "../hooks/api/useProductApi";
import {
  useToggleWishlist,
  useIsProductInWishlist,
} from "../services/wishlistService";
import { ApiResponse } from "../types";
import { WishlistItem } from "../types/wishlist";
import { Product, ProductTabType } from "../types/product";
import { useWishlist } from "../context/WishlistContext";

/**
 * Enhanced custom hook to manage product detail page state and logic
 */
export const useProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const { addToCart } = useCartContext();
  const { showNotification } = useNotification();

  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<ProductTabType>("description");
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const { isInWishlist } = useWishlist();
  // Fetch product data using React Query
  const {
    data: productResponse,
    isLoading,
    error: productError,
    refetch: refetchProduct,
  } = useProductDetailApi(id || "", {
    enabled: !!id,
  });

  // Handle product fetch errors
  useEffect(() => {
    if (productError) {
      const errorMessage =
        productError instanceof Error
          ? productError.message
          : "Failed to load product details";
      setError(errorMessage);
      showNotification(errorMessage, { type: "error" });
    }
  }, [productError, showNotification]);

  // Check if product is in wishlist
  const {
    data: wishlistResponse,
    error: wishlistError,
    refetch: refetchWishlist,
  } = useIsProductInWishlist(id || "", {
    enabled: !!id && isAuthenticated,
  });

  // Handle wishlist check errors
  useEffect(() => {
    if (wishlistError && isAuthenticated) {
      const errorMessage =
        wishlistError instanceof Error
          ? wishlistError.message
          : "Failed to check wishlist status";
      showNotification(errorMessage, { type: "error" });
    }
  }, [wishlistError, isAuthenticated, showNotification]);

  // Refetch wishlist status when authentication state changes
  useEffect(() => {
    if (isAuthenticated && id) {
      refetchWishlist();
    }
  }, [isAuthenticated, id, refetchWishlist]);

  const inWishlist = wishlistResponse?.exists || false;

  // Setup wishlist toggle mutation
  const toggleWishlistMutation = useToggleWishlist({
    onSuccess: (
      response: ApiResponse<{ added: boolean; item?: WishlistItem }>
    ) => {
      const added = response.data.added;
      showNotification(
        added ? "Added to your wishlist" : "Removed from your wishlist",
        { type: "success" }
      );
      // Refetch wishlist status after toggle
      refetchWishlist();
    },
    onError: (error: Error) => {
      const errorMessage = error ? error.message : "Failed to update wishlist";
      showNotification(errorMessage, { type: "error" });
    },
  });

  const product = productResponse;

  // Handle switching product images
  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    if (product) {
      try {
        addToCart(product.id, quantity);
        showNotification(`Added ${quantity} ${product.name} to cart!`, {
          type: "success",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to add item to cart";
        showNotification(errorMessage, { type: "error" });
      }
    }
  };

  const handleBuyNow = () => {
    try {
      handleAddToCart();
      navigate("/checkout");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to proceed to checkout";
      showNotification(errorMessage, { type: "error" });
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      showNotification("Please log in to add items to your wishlist", {
        type: "info",
      });
      navigate("/login", { state: { from: { pathname: `/products/${id}` } } });
      return;
    }

    if (product) {
      toggleWishlistMutation.mutate(product.id);
    }
  };

  const handleShareProduct = () => {
    if (navigator.share) {
      navigator
        .share({
          title: product?.name,
          text: `Check out this product: ${product?.name}`,
          url: window.location.href,
        })
        .then(() =>
          showNotification("Shared successfully!", { type: "success" })
        )
        .catch((error) => console.error("Error sharing:", error));
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          showNotification("Link copied to clipboard!", { type: "success" });
        })
        .catch(() => {
          showNotification("Failed to copy link", { type: "error" });
        });
    }
  };

  // Process product data for better display
  const processProductData = (product: Product | undefined) => {
    if (!product) return null;

    const isInStock = product.inventory > 0;
    const discount = product.salePrice
      ? Math.round(
          ((Number(product.price) - Number(product.salePrice)) /
            Number(product.price)) *
            100
        )
      : 0;

    // Extract product images for the gallery
    const productImages = product.images.map((img) => img.imageUrl);

    // Get rating and review count
    const rating = product.reviewSummary?.rating || 0;
    const reviewCount = product.reviewSummary?.reviewCount || 0;

    // Create breadcrumb items
    const breadcrumbItems = [
      { name: "Home", path: "/" },
      { name: "Products", path: "/products" },
      {
        name: product.category.name,
        path: `/products?category=${product.category.id}`,
      },
      { name: product.name, path: `/products/${product.id}`, isLast: true },
    ];

    return {
      product,
      isInStock,
      discount,
      productImages,
      rating,
      reviewCount,
      breadcrumbItems,
    };
  };

  return {
    id,
    quantity,
    activeTab,
    error,
    isLoading,
    inWishlist,
    toggleWishlistMutation,
    selectedImageIndex,
    processedData: processProductData(product),
    handleQuantityChange,
    handleAddToCart,
    handleBuyNow,
    handleToggleWishlist,
    handleImageSelect,
    handleShareProduct,
    setActiveTab,
    refetchProduct,
    isInWishlist,
  };
};
