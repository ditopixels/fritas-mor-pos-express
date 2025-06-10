
export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  image: string;
  base_price: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: number;
  optionValues: Record<string, string>;
  isActive: boolean;
  stock: number;
}

export interface AppliedPromotion {
  promotionId: string;
  promotionName: string;
  discountAmount: number;
  type?: string;
  value?: number;
}

export interface CartItem {
  id: string;
  productName: string;
  variantName: string;
  sku: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  variantId?: string;
  categoryId?: string;
  appliedPromotions?: AppliedPromotion[];
  selectedOptions?: Record<string, string | string[]>;
}

export interface ProductOption {
  id: string;
  name: string;
  values: (string | { value: string; additionalPrice?: number })[];
  isRequired: boolean;
  selection_type?: 'single' | 'multiple';
}

// Interfaces adicionales que faltan
export interface User {
  id: string;
  username: string;
  role: string;
  name: string;
}

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: string;
  applicability: string;
  target_id?: string;
  value: number;
  conditions: any;
  is_active: boolean;
  created_at: string;
  minimum_quantity?: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  payment_method: string;
  created_at: string;
  status: string;
  subtotal: number;
  total_discount: number;
  cash_received?: number;
  photo_evidence?: string;
  applied_promotions?: any;
  order_items?: {
    id: string;
    product_name: string;
    variant_name: string;
    sku: string;
    price: number;
    original_price?: number;
    quantity: number;
    applied_promotions?: any;
    variant_options?: any;
  }[];
}
