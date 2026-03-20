/**
 * Authentication handler utility for redirecting on 401 errors
 */

/**
 * Check if a response is unauthorized (401) and redirect to login if so
 * Returns true if unauthorized (redirected), false otherwise
 */
let isRedirecting = false;

export async function handleAuthRedirect(response: Response): Promise<boolean> {
    if (response.status === 401) {
        if (typeof window !== 'undefined' && !isRedirecting) {
            isRedirecting = true;
            localStorage.removeItem('session');
            window.location.href = '/auth/login?reason=unauthorized';
        }
        return true;
    }
    return false;
}

/**
 * Wrapper for fetch that automatically handles 401 redirects
 */
export async function authFetch(url: string, options?: RequestInit): Promise<Response> {
    const response = await fetch(url, options);

    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('session');
            window.location.href = '/auth/login?reason=unauthorized';
        }
    }

    return response;
}

/**
 * Check current auth status by validating session
 */
export async function checkAuthStatus(): Promise<{ authenticated: boolean; user?: any }> {
    try {
        const response = await fetch('/api/auth/validate-session', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const user = await response.json();
            return { authenticated: true, user };
        }

        return { authenticated: false };
    } catch {
        return { authenticated: false };
    }
}
