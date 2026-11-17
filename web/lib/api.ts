import type {
  AdminLoginInput,
  AuthResponse,
  Brand,
  CartResponse,
  Category,
  CheckoutInput,
  OrderResponse,
  DealInput,
  DealSummary,
  DealType,
  PageResponse,
  ProductDetail,
  ProductInput,
  ProductSummary,
  RegisterInput,
} from './types';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api'
).replace(/\/$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly path?: string;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown,
    path?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.path = path;
  }
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

const CLIENT_CACHE = new Map<string, { data: unknown; expires: number }>();
const CLIENT_CACHE_TTL = 30_000;

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...init } = options;
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  headers.set('Accept', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const cacheKey = method === 'GET' && !token ? path : null;
  if (cacheKey) {
    const cached = CLIENT_CACHE.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data as T;
    }
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. Verifica que el gateway esté arriba.',
      0,
      'SERVICIO_NO_DISPONIBLE',
    );
  }

  const text = await response.text();
  const body = text ? safeJson(text) : null;

  if (!response.ok) {
    const message =
      (body && typeof body.message === 'string' && body.message) ||
      (body && typeof body.error === 'string' && body.error) ||
      `Error ${response.status}`;

    throw new ApiError(
      message,
      response.status,
      body && typeof body.code === 'string' ? body.code : undefined,
      body && 'details' in body ? body.details : undefined,
      body && typeof body.path === 'string' ? body.path : undefined,
    );
  }

  if (cacheKey) {
    CLIENT_CACHE.set(cacheKey, {
      data: body,
      expires: Date.now() + CLIENT_CACHE_TTL,
    });
  }

  if (method !== 'GET') {
    CLIENT_CACHE.clear();
  }

  return body as T;
}

function safeJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export interface ProductQuery {
  q?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  size?: number;
}

export function getProducts(
  query: ProductQuery = {},
): Promise<PageResponse<ProductSummary>> {
  const params = new URLSearchParams();

  if (query.q) params.set('q', query.q);
  if (query.categoryId) params.set('categoryId', query.categoryId);
  if (query.brandId) params.set('brandId', query.brandId);
  if (query.minPrice !== undefined) params.set('minPrice', String(query.minPrice));
  if (query.maxPrice !== undefined) params.set('maxPrice', String(query.maxPrice));
  if (query.sort) params.set('sort', query.sort);
  params.set('page', String(query.page ?? 0));
  params.set('size', String(query.size ?? 12));

  const qs = params.toString();

  return request<PageResponse<ProductSummary>>(`/products${qs ? `?${qs}` : ''}`);
}

export function getProduct(id: string): Promise<ProductDetail> {
  return request<ProductDetail>(`/products/${encodeURIComponent(id)}`);
}

export function getCategories(): Promise<Category[]> {
  return request<Category[]>('/catalog/categories');
}

export function getBrands(): Promise<Brand[]> {
  return request<Brand[]>('/catalog/brands');
}

export function loginCustomer(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/customer/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function registerCustomer(input: RegisterInput): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/customer/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getMe(token: string): Promise<Omit<AuthResponse, 'accessToken' | 'tokenType' | 'expiresIn'>> {
  return request('/auth/me', { token });
}

export function loginAdmin(input: AdminLoginInput): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createProduct(
  token: string,
  input: ProductInput,
): Promise<ProductDetail> {
  return request<ProductDetail>('/products', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export function updateProduct(
  token: string,
  id: string,
  input: ProductInput,
): Promise<ProductDetail> {
  return request<ProductDetail>(`/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(input),
  });
}

export function deleteProduct(token: string, id: string): Promise<void> {
  return request<void>(`/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  });
}

export interface DealQuery {
  type?: DealType | '';
  categoryId?: string;
  brandId?: string;
  minDiscount?: number;
  sort?: string;
  page?: number;
  size?: number;
}

export function getDeals(
  query: DealQuery = {},
): Promise<PageResponse<DealSummary>> {
  const params = new URLSearchParams();

  if (query.type) params.set('type', query.type);
  if (query.categoryId) params.set('categoryId', query.categoryId);
  if (query.brandId) params.set('brandId', query.brandId);
  if (query.minDiscount !== undefined) {
    params.set('minDiscount', String(query.minDiscount));
  }
  if (query.sort) params.set('sort', query.sort);
  params.set('page', String(query.page ?? 0));
  params.set('size', String(query.size ?? 12));

  const qs = params.toString();

  return request<PageResponse<DealSummary>>(`/deals${qs ? `?${qs}` : ''}`);
}

export function getDeal(id: string): Promise<DealSummary> {
  return request<DealSummary>(`/deals/${encodeURIComponent(id)}`);
}

export function getAdminDeals(
  token: string,
  page = 0,
  size = 50,
): Promise<PageResponse<DealSummary>> {
  return request<PageResponse<DealSummary>>(
    `/deals/admin?page=${page}&size=${size}`,
    { token },
  );
}

export function createDeal(
  token: string,
  input: DealInput,
): Promise<DealSummary> {
  return request<DealSummary>('/deals', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export function updateDeal(
  token: string,
  id: string,
  input: DealInput,
): Promise<DealSummary> {
  return request<DealSummary>(`/deals/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(input),
  });
}

export function deleteDeal(token: string, id: string): Promise<void> {
  return request<void>(`/deals/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  });
}

export function getCart(token: string): Promise<CartResponse> {
  return request<CartResponse>('/cart', { token });
}

export function addCartItem(
  token: string,
  productId: string,
  quantity: number,
): Promise<CartResponse> {
  return request<CartResponse>('/cart/items', {
    method: 'POST',
    token,
    body: JSON.stringify({ productId, quantity }),
  });
}

export function updateCartItem(
  token: string,
  productId: string,
  quantity: number,
): Promise<CartResponse> {
  return request<CartResponse>(`/cart/items/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ productId, quantity }),
  });
}

export function removeCartItem(token: string, productId: string): Promise<CartResponse> {
  return request<CartResponse>(`/cart/items/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    token,
  });
}

export function clearCart(token: string): Promise<void> {
  return request<void>('/cart', { method: 'DELETE', token });
}

export function checkout(
  token: string,
  input: CheckoutInput,
): Promise<OrderResponse> {
  return request<OrderResponse>('/orders', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export function getOrders(token: string): Promise<OrderResponse[]> {
  return request<OrderResponse[]>('/orders', { token });
}

export function getOrder(token: string, id: string): Promise<OrderResponse> {
  return request<OrderResponse>(`/orders/${encodeURIComponent(id)}`, { token });
}

export { API_URL };
