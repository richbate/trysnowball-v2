/**
 * End-to-end encryption utilities for sensitive payment data
 * Uses AES-GCM for authenticated encryption
 */

// Generate a random encryption key
export async function generateEncryptionKey(): Promise<CryptoKey> {
 return await crypto.subtle.generateKey(
  {
   name: 'AES-GCM',
   length: 256
  },
  true,
  ['encrypt', 'decrypt']
 );
}

// Export key to raw bytes for storage
export async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
 return await crypto.subtle.exportKey('raw', key);
}

// Import key from raw bytes
export async function importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
 return await crypto.subtle.importKey(
  'raw',
  keyData,
  {
   name: 'AES-GCM',
   length: 256
  },
  true,
  ['encrypt', 'decrypt']
 );
}

// Encrypt JSON data
export async function encryptJSON(data: any, key: CryptoKey): Promise<string> {
 // Convert data to JSON string
 const jsonString = JSON.stringify(data);
 const encoder = new TextEncoder();
 const dataBuffer = encoder.encode(jsonString);
 
 // Generate random IV
 const iv = crypto.getRandomValues(new Uint8Array(12));
 
 // Encrypt the data
 const encryptedBuffer = await crypto.subtle.encrypt(
  {
   name: 'AES-GCM',
   iv: iv
  },
  key,
  dataBuffer
 );
 
 // Combine IV and encrypted data
 const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
 combined.set(iv, 0);
 combined.set(new Uint8Array(encryptedBuffer), iv.length);
 
 // Convert to base64
 return btoa(String.fromCharCode(...combined));
}

// Decrypt JSON data
export async function decryptJSON(encryptedData: string, key: CryptoKey): Promise<any> {
 try {
  // Convert from base64
  const combined = new Uint8Array(
   atob(encryptedData)
    .split('')
    .map(char => char.charCodeAt(0))
  );
  
  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  // Decrypt the data
  const decryptedBuffer = await crypto.subtle.decrypt(
   {
    name: 'AES-GCM',
    iv: iv
   },
   key,
   encrypted
  );
  
  // Convert back to JSON
  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decryptedBuffer);
  return JSON.parse(jsonString);
 } catch (error) {
  console.error('Decryption failed:', error);
  throw new Error('Failed to decrypt data');
 }
}

// Key management for client-side storage
const ENCRYPTION_KEY_STORAGE_KEY = 'sb_encryption_key';

// Get or generate user's encryption key
export async function getOrCreateUserKey(): Promise<CryptoKey> {
 try {
  // Try to load existing key from localStorage
  const storedKeyData = localStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY);
  
  if (storedKeyData) {
   // Import existing key
   const keyBytes = new Uint8Array(
    atob(storedKeyData)
     .split('')
     .map(char => char.charCodeAt(0))
   );
   return await importKey(keyBytes.buffer);
  } else {
   // Generate new key
   const newKey = await generateEncryptionKey();
   
   // Store key for future use
   const keyBytes = await exportKey(newKey);
   const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(keyBytes)));
   localStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, keyBase64);
   
   return newKey;
  }
 } catch (error) {
  console.error('Key management error:', error);
  throw new Error('Failed to manage encryption key');
 }
}

// Clear stored encryption key (for logout/reset)
export function clearUserKey(): void {
 localStorage.removeItem(ENCRYPTION_KEY_STORAGE_KEY);
}

// Utility to check if crypto is available
export function isCryptoAvailable(): boolean {
 return typeof crypto !== 'undefined' && 
     typeof crypto.subtle !== 'undefined' &&
     typeof crypto.subtle.encrypt === 'function';
}