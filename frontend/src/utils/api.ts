const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000';

export type ApiError = {
  error?: string;
  message?: string;
};

export function getAccessToken(): string | null {
  return localStorage.getItem('reflex_access_token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('reflex_refresh_token');
}

export function saveTokens(access: string, refresh: string) {
  localStorage.setItem('reflex_access_token', access);
  localStorage.setItem('reflex_refresh_token', refresh);
}

export function clearTokens() {
  localStorage.removeItem('reflex_access_token');
  localStorage.removeItem('reflex_refresh_token');
}

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();

  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    const error = data as ApiError | null;

    throw new Error(
      error?.message ||
      error?.error ||
      `Request failed with status ${response.status}`
    );
  }

  return data as T;
}

export { API_URL };
