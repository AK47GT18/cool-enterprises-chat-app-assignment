import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.MESSAGE_ENCRYPTION_KEY;

if (typeof window === 'undefined' && !ENCRYPTION_KEY) {
  throw new Error('MESSAGE_ENCRYPTION_KEY environment variable is missing.');
}

/**
 * Encrypts a message body using AES.
 */
export function encryptMessage(text: string): string {
  if (!text) return text;
  if (!ENCRYPTION_KEY) {
    if (typeof window === 'undefined') {
      console.warn("Encryption key is missing. Message will not be encrypted.");
    }
    return text;
  }
  try {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error("Encryption error:", error);
    return text;
  }
}

/**
 * Decrypts a message body using AES.
 */
export function decryptMessage(ciphertext: string): string {
  if (!ciphertext) return ciphertext;
  
  if (!ENCRYPTION_KEY) {
    return ciphertext;
  }
  
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (decrypted) return decrypted;
  } catch (error) {
    // Ignore first pass failure
  }

  // Fallback to legacy key to support older messages
  try {
    const LEGACY_KEY = 'default-chat-key-321-secure';
    const legacyBytes = CryptoJS.AES.decrypt(ciphertext, LEGACY_KEY);
    const legacyDecrypted = legacyBytes.toString(CryptoJS.enc.Utf8);
    if (legacyDecrypted) return legacyDecrypted;
  } catch (fallbackError) {
    // Ignore legacy pass failure
  }

  return ciphertext;
}
