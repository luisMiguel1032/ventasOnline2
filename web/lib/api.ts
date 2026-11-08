import type {
  AdminLoginInput,
  AuthResponse,
  Brand,
  Category,
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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...init } = options;
  const headers = new Headers(init.headers);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  headers.set('Accept', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
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

export { API_URL };
