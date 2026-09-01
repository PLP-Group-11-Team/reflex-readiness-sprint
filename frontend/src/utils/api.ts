const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  'https://reflex-readiness-sprint-p76o.onrender.com'
).replace(/\/+$/, '');

const ACCESS_TOKEN_KEY =
  'reflex_access_token';

const REFRESH_TOKEN_KEY =
  'reflex_refresh_token';

export const getAccessToken = (): string | null => {
  return localStorage.getItem(
    ACCESS_TOKEN_KEY
  );
};

const getRefreshToken = (): string | null => {
  return localStorage.getItem(
    REFRESH_TOKEN_KEY
  );
};

export const saveTokens = (
  access: string,
  refresh: string
): void => {
  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    access
  );

  localStorage.setItem(
    REFRESH_TOKEN_KEY,
    refresh
  );
};

export const clearTokens = (): void => {
  localStorage.removeItem(
    ACCESS_TOKEN_KEY
  );

  localStorage.removeItem(
    REFRESH_TOKEN_KEY
  );
};

const buildUrl = (
  path: string
): string => {
  if (
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }

  return `${API_BASE_URL}${
    path.startsWith('/')
      ? path
      : `/${path}`
  }`;
};

const refreshAccessToken =
  async (): Promise<string | null> => {
    const refresh =
      getRefreshToken();

    if (!refresh) {
      return null;
    }

    try {
      const response =
        await fetch(
          buildUrl(
            '/api/auth/token/refresh/'
          ),
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              refresh,
            }),
          }
        );

      if (!response.ok) {
        clearTokens();
        return null;
      }

      const data =
        await response.json();

      if (!data.access) {
        clearTokens();
        return null;
      }

      localStorage.setItem(
        ACCESS_TOKEN_KEY,
        data.access
      );

      return data.access;
    } catch {
      clearTokens();
      return null;
    }
  };

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const url =
    buildUrl(path);

  const headers = new Headers(
    options.headers
  );

  headers.set(
    'Content-Type',
    'application/json'
  );

  const token =
    getAccessToken();

  if (token) {
    headers.set(
      'Authorization',
      `Bearer ${token}`
    );
  }

  const response =
    await fetch(url, {
      ...options,
      headers,
    });

  /*
   * Access token expired.
   * Refresh it once and retry.
   */
  if (
    response.status === 401 &&
    retry &&
    !path.includes(
      '/api/auth/login/'
    ) &&
    !path.includes(
      '/api/auth/token/refresh/'
    )
  ) {
    const newToken =
      await refreshAccessToken();

    if (newToken) {
      return apiFetch<T>(
        path,
        options,
        false
      );
    }

    clearTokens();
  }

  const contentType =
    response.headers.get(
      'content-type'
    ) || '';

  let data: any = null;

  if (
    contentType.includes(
      'application/json'
    )
  ) {
    data =
      await response.json();
  } else {
    const text =
      await response.text();

    data = text
      ? { message: text }
      : null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.detail ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data as T;
}
