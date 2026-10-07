const API_URL = (import.meta.env.VITE_LOYALTY_API_URL || 'https://loyalty-wallets.productibot1.com/api').replace(/\/$/, '');
const TOKEN_KEY = 'loyalty_access_token';

export interface SessionUser {
  id: string;
  full_name?: string;
  phone?: string;
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getLoyaltyApiUrl() {
  return API_URL;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) clearAccessToken();
    throw new Error(body.error || 'No fue posible completar la operación.');
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function authenticate(path: '/auth/login' | '/auth/signup', body: Record<string, unknown>) {
  const response = await apiRequest<{ token: string; user: SessionUser }>(path, { method: 'POST', body: JSON.stringify(body) });
  setAccessToken(response.token);
  return response.user;
}