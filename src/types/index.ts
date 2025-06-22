export interface CartItem {
  id: string;
  productName: string;
  variantName: string;
  sku: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image?: string;
  variantId?: string;
  categoryId?: string;
  appliedPromotions?: AppliedPromotion[];
  selectedSauces?: string[][];
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  totalDiscount: number;
  paymentMethod: string;
  customerName: string;
  cashReceived?: number;
  photoEvidence?: string;
  createdAt: Date;
  status: 'completed' | 'cancelled' | 'pending';
  appliedPromotions?: AppliedPromotion[];
  isDelivery?: boolean;
  cancellationReason?: string;
}

export interface User {
  id: string;
  username: string;
  role: 'cashier' | 'admin';
  name: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
}

export interface ProductOption {
  id: string;
  name: string;
  values: { value: string; additionalPrice?: number }[];
  isRequired: boolean;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  image?: string;
  base_price?: number;
  options: ProductOption[];
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
  stock?: number;
}

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  applicability: 'all' | 'category' | 'product';
  targetIds?: string[];
  conditions: {
    daysOfWeek?: number[];
    startDate?: Date;
    endDate?: Date;
    paymentMethods?: string[];
    minimumPurchase?: number;
    minimumQuantity?: number;
  };
  isActive: boolean;
  createdAt: Date;
}

export interface AppliedPromotion {
  promotionId: string;
  promotionName: string;
  type: 'percentage' | 'fixed';
  value: number;
  discountAmount: number;
}

export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  revenueByCategory: Array<{
    categoryName: string;
    revenue: number;
    percentage: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  hourlyRevenue?: Array<{
    hour: number;
    revenue: number;
    orders: number;
  }>;
}
