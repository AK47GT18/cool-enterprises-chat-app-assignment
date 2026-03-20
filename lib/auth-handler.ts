/**
 * Authentication handler utility for redirecting on 401 errors
 */

/**
 * Force redirect to login page on 401.
 * Uses window.location.replace so it replaces the history entry (no back-button loop).
 */
export function handleAuthRedirect(response: Response): boolean {
    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            // Prevent the current page from making more requests
            window.location.replace('/auth/login');
        }
        return true;
    }
    return false;
}
