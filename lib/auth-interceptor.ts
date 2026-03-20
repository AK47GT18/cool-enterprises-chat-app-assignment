// lib/auth-interceptor.ts

export function setupAuthInterceptor() {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const response = await originalFetch(...args);

    if (response.status === 401) {
      // Don't redirect if already on the login page
      if (!window.location.pathname.startsWith('/auth')) {
        console.log('[Auth] 401 detected — redirecting to login');
        window.location.replace('/auth/login');
      }
    }

    return response;
  };
}
