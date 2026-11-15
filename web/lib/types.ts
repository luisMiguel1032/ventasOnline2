export type AccountType = 'ADMIN' | 'CUSTOMER';

export type DealType = 'DAILY' | 'LIGHTNING' | 'FEATURED';

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  videoUrl: string | null;
  price: number;
  stock: number;
  ratingAvg: number;
  ratingCount: number;
  categoryName: string | null;
  brandName: string | null;
  dealId: string | null;
  dealPrice: number | null;
  dealDiscountPercent: number | null;
  dealType: DealType | null;
  dealTitle: string | null;
  dealEndsAt: string | null;
  dealStockRemaining: number | null;
  dealStockPercent: number | null;
  dealStockLimit: number | null;
}

export interface DealSummary {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  image: string | null;
  categoryName: string | null;
  brandName: string | null;
  originalPrice: number;
  dealPrice: number;
  discountPercent: number;
  dealType: DealType;
  title: string | null;
  startsAt: string;
  endsAt: string;
  stockLimit: number;
  stockSold: number;
  stockRemaining: number;
  stockPercent: number;
  productStock: number;
  ratingAvg: number;
  ratingCount: number;
  status: number;
  active: boolean;
}

export interface DealInput {
  productId: string;
  title?: string;
  dealType: DealType;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  stockLimit?: number;
  stockSold?: number;
  status?: number;
}

export interface ProductDetail extends ProductSummary {
  code: string;
  itemCode: string;
  description: string | null;
  features: string | null;
  type: string;
  categoryId: string | null;
  brandId: string | null;
  unitName: string;
  images: string[];
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartResponse {
  items: CartItem[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderResponse {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

export interface CheckoutInput {
  items: { productId: string; quantity: number }[];
}

export interface Category {
  id: string;
  name: string;
  image: string | null;
  sortOrder: number;
}

export interface Brand {
  id: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  subjectId: string;
  tenantId: string;
  accountType: AccountType;
  login: string;
  name: string;
}

export interface Session extends AuthResponse {
  /** Momento exacto en que vence el token (milisegundos). */
  expiresAt: number;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AdminLoginInput {
  login: string;
  password: string;
  tenantId?: string;
}

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  categoryId?: string;
  brandId?: string;
  image?: string;
  videoUrl?: string;
  features?: string;
  type?: string;
  unitName?: string;
  code?: string;
  itemCode?: string;
}
