export type AccountType = 'ADMIN' | 'CUSTOMER';

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  stock: number;
  ratingAvg: number;
  ratingCount: number;
  categoryName: string | null;
  brandName: string | null;
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
  features?: string;
  type?: string;
  unitName?: string;
  code?: string;
  itemCode?: string;
}
