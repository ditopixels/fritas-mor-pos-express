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
