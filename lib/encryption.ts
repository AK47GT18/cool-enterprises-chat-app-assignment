import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_MESSAGE_ENCRYPTION_KEY!;

if (!ENCRYPTION_KEY) {
  throw new Error('NEXT_PUBLIC_MESSAGE_ENCRYPTION_KEY environment variable is required for secure encryption');
}

/**
 * Encrypts a message body using AES.
 */
export function encryptMessage(text: string): string {
  if (!text) return text;
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
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    // If decryption fails (e.g. wrong key/not encrypted), it might return empty string
    return decrypted || ciphertext;
  } catch (error) {
    // Return original if decryption fails (might not be encrypted)
    return ciphertext;
  }
}
