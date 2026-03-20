/**
 * Optimized validation utilities with secure regex patterns
 */

// Optimized email regex - RFC 5322 compliant but practical
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Username: 3-20 chars, alphanumeric + underscores, no consecutive underscores, must start with letter
export const USERNAME_REGEX = /^(?=[a-zA-Z][a-zA-Z0-9_]{2,19}$)[a-zA-Z0-9]+(?:[_-]?[a-zA-Z0-9]+)*$/;

// Password: Min 8 chars, at least 1 letter, 1 number, optional special chars
// More flexible than before - accepts common special chars
export const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*#?&_-]{8,72}$/;

// Privacy code: UUID-like format
export const PRIVACY_CODE_REGEX = /^[a-z0-9]{20,25}$/i;

// Validation functions with detailed error messages
export const ValidationRules = {
    email: {
        regex: EMAIL_REGEX,
        minLength: 5,
        maxLength: 254,
        message: 'Please enter a valid email address (e.g., user@example.com)',
    },
    username: {
        regex: USERNAME_REGEX,
        minLength: 3,
        maxLength: 20,
        message: 'Username must be 3-20 characters, start with a letter, and contain only letters, numbers, and underscores',
    },
    password: {
        regex: PASSWORD_REGEX,
        minLength: 8,
        maxLength: 72, // bcrypt max
        message: 'Password must be at least 8 characters with 1 letter and 1 number',
    },
    privacyCode: {
        regex: PRIVACY_CODE_REGEX,
        minLength: 20,
        maxLength: 25,
        message: 'Invalid privacy code format',
    },
};

// Validate email
export function validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Email is required' };
    }

    const trimmed = email.trim().toLowerCase();

    if (trimmed.length < ValidationRules.email.minLength) {
        return { valid: false, error: 'Email is too short' };
    }

    if (trimmed.length > ValidationRules.email.maxLength) {
        return { valid: false, error: 'Email is too long' };
    }

    if (!ValidationRules.email.regex.test(trimmed)) {
        return { valid: false, error: ValidationRules.email.message };
    }

    return { valid: true };
}

// Validate username
export function validateUsername(username: string): { valid: boolean; error?: string } {
    if (!username || typeof username !== 'string') {
        return { valid: false, error: 'Username is required' };
    }

    const trimmed = username.trim().toLowerCase();

    if (trimmed.length < ValidationRules.username.minLength) {
        return { valid: false, error: `Username must be at least ${ValidationRules.username.minLength} characters` };
    }

    if (trimmed.length > ValidationRules.username.maxLength) {
        return { valid: false, error: `Username must be ${ValidationRules.username.maxLength} characters or less` };
    }

    if (!ValidationRules.username.regex.test(trimmed)) {
        return { valid: false, error: ValidationRules.username.message };
    }

    return { valid: true };
}

// Password strength type
export type PasswordStrength = {
    score: number;
    label: string;
    color: string;
    suggestions: string[];
};

// Validate password with strength scoring
export function validatePassword(password: string): {
    valid: boolean;
    error?: string;
    strength?: PasswordStrength;
} {
    if (!password || typeof password !== 'string') {
        return { valid: false, error: 'Password is required' };
    }

    const trimmed = password;

    if (trimmed.length < ValidationRules.password.minLength) {
        return {
            valid: false,
            error: `Password must be at least ${ValidationRules.password.minLength} characters`,
            strength: getPasswordStrength(trimmed),
        };
    }

    if (trimmed.length > ValidationRules.password.maxLength) {
        return { valid: false, error: `Password is too long (max ${ValidationRules.password.maxLength} characters)` };
    }

    if (!ValidationRules.password.regex.test(trimmed)) {
        return {
            valid: false,
            error: ValidationRules.password.message,
            strength: getPasswordStrength(trimmed),
        };
    }

    return {
        valid: true,
        strength: getPasswordStrength(trimmed),
    };
}

// Calculate password strength (0-4)
export function getPasswordStrength(password: string): PasswordStrength {
    let score = 0;
    const suggestions: string[] = [];

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;

    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*#?&_-]/.test(password)) score++;

    // Check for common patterns (reduce score)
    if (/^[a-zA-Z]+$/.test(password)) suggestions.push('Add numbers');
    if (/^\d+$/.test(password)) suggestions.push('Add letters');
    if (/(.)\1{2,}/.test(password)) suggestions.push('Avoid repeated characters');
    if (/^(password|123456|qwerty)/i.test(password)) suggestions.push('Avoid common passwords');

    // Cap score at 4
    score = Math.min(score, 4);

    // Determine label and color
    let label: string;
    let color: string;

    if (score <= 1) {
        label = 'Weak';
        color = 'red';
    } else if (score === 2) {
        label = 'Fair';
        color = 'orange';
    } else if (score === 3) {
        label = 'Good';
        color = 'yellow';
    } else {
        label = 'Strong';
        color = 'green';
    }

    return { score, label, color, suggestions };
}

// Rate limiting helper
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
}

const rateLimitStore = new Map<string, { count: number; resetAt: Date }>();

export function checkRateLimit(
    identifier: string,
    maxAttempts: number = 5,
    windowMinutes: number = 15
): RateLimitResult {
    const now = new Date();
    const key = identifier;
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
        const resetAt = new Date(now.getTime() + windowMinutes * 60 * 1000);
        rateLimitStore.set(key, { count: 1, resetAt });
        return { allowed: true, remaining: maxAttempts - 1, resetAt };
    }

    if (record.count >= maxAttempts) {
        return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    record.count++;
    return { allowed: true, remaining: maxAttempts - record.count, resetAt: record.resetAt };
}

// Clear expired rate limit entries periodically
setInterval(() => {
    const now = new Date();
    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetAt) {
            rateLimitStore.delete(key);
        }
    }
}, 60 * 60 * 1000); // Clean up every hour
