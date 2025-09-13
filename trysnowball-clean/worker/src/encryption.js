/**
 * CP-3 Encryption Layer for Debt Data
 * AES-256-GCM encryption for sensitive fields stored in D1
 * All debt amounts, APRs, and payment data encrypted at rest
 */

// Use Web Crypto API for Cloudflare Workers
export class DebtEncryption {
  constructor(encryptionKey) {
    this.encryptionKey = encryptionKey;
  }

  /**
   * Derive a cryptographic key from the secret string
   */
  async deriveKey(secret) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('trysnowball-salt-v1'), // Fixed salt for deterministic key
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt a single field value
   */
  async encryptField(value) {
    if (value === null || value === undefined) return null;
    
    const key = await this.deriveKey(this.encryptionKey);
    const encoder = new TextEncoder();
    const data = encoder.encode(String(value));
    
    // Generate random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Return base64 encoded
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypt a single field value
   */
  async decryptField(encrypted) {
    if (!encrypted) return null;
    
    try {
      const key = await this.deriveKey(this.encryptionKey);
      
      // Decode from base64
      const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
      
      // Extract IV and ciphertext
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt all sensitive debt fields before storage
   */
  async encryptDebtForStorage(debt) {
    const encrypted = { ...debt };
    
    // Encrypt sensitive fields
    if (debt.name !== undefined) {
      encrypted.name = await this.encryptField(debt.name);
    }
    if (debt.amount !== undefined) {
      encrypted.amount = await this.encryptField(debt.amount);
    }
    if (debt.apr !== undefined) {
      encrypted.apr = await this.encryptField(debt.apr);
    }
    if (debt.min_payment !== undefined) {
      encrypted.min_payment = await this.encryptField(debt.min_payment);
    }
    if (debt.limit !== undefined) {
      encrypted.limit = await this.encryptField(debt.limit);
    }
    if (debt.original_amount !== undefined) {
      encrypted.original_amount = await this.encryptField(debt.original_amount);
    }
    
    return encrypted;
  }

  /**
   * Decrypt all sensitive debt fields after retrieval
   */
  async decryptDebtFromStorage(encryptedDebt) {
    const decrypted = { ...encryptedDebt };
    
    // Decrypt sensitive fields and convert to proper types
    if (encryptedDebt.name) {
      decrypted.name = await this.decryptField(encryptedDebt.name);
    }
    if (encryptedDebt.amount) {
      const decryptedAmount = await this.decryptField(encryptedDebt.amount);
      decrypted.amount = parseFloat(decryptedAmount);
    }
    if (encryptedDebt.apr) {
      const decryptedApr = await this.decryptField(encryptedDebt.apr);
      decrypted.apr = parseFloat(decryptedApr);
    }
    if (encryptedDebt.min_payment) {
      const decryptedMinPayment = await this.decryptField(encryptedDebt.min_payment);
      decrypted.min_payment = parseFloat(decryptedMinPayment);
    }
    if (encryptedDebt.limit_amount) {
      const decryptedLimit = await this.decryptField(encryptedDebt.limit_amount);
      decrypted.limit = decryptedLimit ? parseFloat(decryptedLimit) : null;
      delete decrypted.limit_amount; // Convert to API field name
    }
    if (encryptedDebt.original_amount) {
      const decryptedOriginal = await this.decryptField(encryptedDebt.original_amount);
      decrypted.original_amount = decryptedOriginal ? parseFloat(decryptedOriginal) : null;
    }
    
    return decrypted;
  }
}

export default DebtEncryption;