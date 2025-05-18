import { CartItem } from "../types/cart";

interface CalculateCartTotalsProps {
  items: CartItem[];
  options?: {
    includeShipping: boolean;
    includeTax: boolean;
    shippingRate?: number;
    taxRate?: number;
    minFreeShipping?: number;
  };
}

export const calculateCartTotals = ({
  items = [],
  options = {
    includeShipping: false,
    includeTax: false,
    shippingRate: 10.0,
    taxRate: 0.07,
    minFreeShipping: 100.0,
  },
}: CalculateCartTotalsProps) => {
  const {
    includeShipping,
    includeTax,
    shippingRate,
    taxRate,
    minFreeShipping,
  } = options;

  // Calculate subtotal
  const subtotal = items.reduce((total, item) => {
    const itemPrice = item.price;
    return total + Number(itemPrice) * Number(item.quantity);
  }, 0);

  // Calculate shipping (free if subtotal > threshold)
  const shippingCost = includeShipping
    ? subtotal > (minFreeShipping ?? 100.0)
      ? 0
      : shippingRate
    : 0;

  // Calculate tax
  const taxAmount = includeTax ? subtotal * (taxRate ?? 0.07) : 0;

  // Calculate total
  const total = subtotal + (shippingCost ?? 0) + taxAmount;

  // Count items
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return {
    subtotal,
    shippingCost,
    taxAmount,
    total,
    itemCount,
  };
};
