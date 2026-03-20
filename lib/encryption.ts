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
    // If the key is missing, we cannot encrypt. Return original text.
    // The initial check should prevent this in server-side, but good for client-side or unexpected scenarios.
    console.warn("Encryption key is missing. Message will not be encrypted.");
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
    // If the key is missing, we cannot decrypt. Return original ciphertext.
    console.warn("Encryption key is missing. Message will not be decrypted.");
    return ciphertext;
  }
  
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || ciphertext;
  } catch (error) {
    return ciphertext;
  }
}
