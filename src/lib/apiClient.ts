import type { DatabaseInterface } from './db/db-interface';

// Central client-side RPC proxy
const getAuthUserId = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    const userRaw = localStorage.getItem('user');
    if (userRaw) {
      const user = JSON.parse(userRaw);
      return user?.id || '';
    }
  } catch {
    // Ignore parse error
  }
  return '';
};

export const apiClient = new Proxy({}, {
  get(target, prop) {
    return async (...args: any[]) => {
      const userId = getAuthUserId();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (userId) {
        headers['Authorization'] = `Bearer ${userId}`;
      }

      const res = await fetch('/api/rpc', {
        method: 'POST',
        headers,
        body: JSON.stringify({ method: prop, args }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = 'Database RPC request failed';
        try {
          const parsed = JSON.parse(errorText);
          errorMessage = parsed.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return res.json();
    };
  }
}) as DatabaseInterface;

export default apiClient;
