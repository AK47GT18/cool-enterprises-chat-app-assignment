// lib/auth-interceptor.ts

let isRedirecting = false;

export function setupAuthInterceptor() {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const response = await originalFetch(...args);

    if (response.status === 401 && !isRedirecting) {
      // Don't redirect if already on the login page
      if (!window.location.pathname.startsWith('/auth')) {
        isRedirecting = true;
        console.log('[Auth] 401 detected — clearing session and redirecting to login');

        // Clear the httpOnly cookie via the logout API, then redirect
        try {
          await originalFetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
          // ignore errors — we're redirecting anyway
        }

        window.location.replace('/auth/login');
      }
    }

    return response;
  };
}
