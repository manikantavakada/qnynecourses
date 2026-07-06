const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type ApiInit = RequestInit & { next?: { revalidate?: number; tags?: string[] } };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function api<T>(path: string, init?: ApiInit & { _isRetry?: boolean }): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: isFormData ? init?.headers : {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: init?.cache ?? (init?.next ? undefined : 'no-store'),
  });
  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login' && path !== '/auth/refresh' && !init?._isRetry) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
        if (refreshRes.ok) {
          return api<T>(path, { ...init, _isRetry: true });
        }
      } catch {
        // Ignore and throw original error
      }
    }
    const body = await res.text();
    let message = body || `Request failed with status ${res.status}`;
    try {
      const parsed = JSON.parse(body) as { message?: string | string[]; error?: string };
      const parsedMessage = Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message;
      message = parsedMessage || parsed.error || message;
    } catch {
      // Keep the raw response text for non-JSON errors.
    }
    throw new ApiError(res.status, message, body);
  }
  return res.json() as Promise<T>;
}

export function paise(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value / 100);
}
