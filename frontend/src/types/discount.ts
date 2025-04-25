export interface DiscountEvent {
  id: string;
  name: string;
  description: string;
  discountPercentage: number; // matches Rails discount_percentage
  startDate: string; // matches Rails start_date
  endDate: string; // matches Rails end_date
  isActive: boolean; // matches Rails is_active
  appliesTo: "all" | "category" | "products";
  categoryIds?: number[]; // matches Rails category_ids
  productIds?: number[]; // matches Rails product_ids
  createdAt: string; // matches Rails created_at
  updatedAt: string; // matches Rails updated_at
}

export interface DiscountEventData {
  name: string;
  description: string;
  discountPercentage: number; // matches Rails discount_percentage
  startDate: string; // matches Rails start_date
  endDate: string; // matches Rails end_date
  isActive: boolean; // matches Rails is_active
  appliesTo: "all" | "category" | "products";
  categoryIds?: string[]; // matches Rails category_ids
  productIds?: string[]; // matches Rails product_ids
}