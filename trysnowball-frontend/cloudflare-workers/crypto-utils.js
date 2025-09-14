/**
 * Encryption/Decryption utilities for D1 data at rest
 * Uses AES-256-GCM with Web Crypto API for secure debt data storage
 */

// Convert string to Uint8Array
function stringToUint8Array(str) {
  return new TextEncoder().encode(str);
}

// Convert Uint8Array to string
function uint8ArrayToString(arr) {
  return new TextDecoder().decode(arr);
}

// Convert Uint8Array to base64
function uint8ArrayToBase64(arr) {
  return btoa(String.fromCharCode(...arr));
}

// Convert base64 to Uint8Array
function base64ToUint8Array(base64) {
  return new Uint8Array(atob(base64).split('').map(char => char.charCodeAt(0)));
}

// Worker memory cache for derived keys (performance optimization)
const keyCache = new Map();
const MAX_CACHED_KEYS = 100;
const CACHE_TTL_MS = 3600000; // 1 hour

/**
 * Derive encryption key from master key and user ID
 * Uses PBKDF2 with user-specific salt for key derivation
 */
async function deriveUserKey(masterKey, userId, keyVersion = 1) {
  const salt = stringToUint8Array(`${userId}-salt-v${keyVersion}`);
  
  // Import master key
  const importedKey = await crypto.subtle.importKey(
    'raw',
    stringToUint8Array(masterKey),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Derive user-specific encryption key
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Get cached user key or derive new one (performance optimization)
 * Caches derived keys in Worker memory to avoid repeated PBKDF2 operations
 */
async function getCachedUserKey(masterKey, userId, keyVersion = 1) {
  const cacheKey = `${userId}-v${keyVersion}`;
  
  // Check cache first
  const cached = keyCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.key;
  }
  
  // Derive new key
  const derivedKey = await deriveUserKey(masterKey, userId, keyVersion);
  
  // Cache if under limit
  if (keyCache.size < MAX_CACHED_KEYS) {
    keyCache.set(cacheKey, {
      key: derivedKey,
      expiry: Date.now() + CACHE_TTL_MS
    });
    
    // Clean expired entries periodically
    if (keyCache.size % 10 === 0) {
      const now = Date.now();
      for (const [key, value] of keyCache.entries()) {
        if (value.expiry <= now) {
          keyCache.delete(key);
        }
      }
    }
  }
  
  return derivedKey;
}

/**
 * Encrypt sensitive debt data using AES-256-GCM
 * Returns { iv, ciphertext } both as base64 strings
 */
export async function encryptDebtData(data, masterKey, userId, keyVersion = 1) {
  try {
    // Get cached user-specific key (performance optimized)
    const key = await getCachedUserKey(masterKey, userId, keyVersion);
    
    // Generate random IV (12 bytes for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const plaintext = stringToUint8Array(JSON.stringify(data));
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      plaintext
    );
    
    return {
      iv: uint8ArrayToBase64(iv),
      ciphertext: uint8ArrayToBase64(new Uint8Array(ciphertext)),
      version: keyVersion
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Failed to encrypt data: ${error.message}`);
  }
}

/**
 * Decrypt sensitive debt data
 * Takes { iv, ciphertext } as base64 strings
 */
export async function decryptDebtData(encryptedData, masterKey, userId, keyVersion = 1) {
  try {
    const { iv, ciphertext, version } = encryptedData;
    
    // Use the version from the encrypted data, fallback to provided version
    const actualVersion = version || keyVersion;
    
    // Get cached user-specific key (performance optimized)
    const key = await getCachedUserKey(masterKey, userId, actualVersion);
    
    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: base64ToUint8Array(iv)
      },
      key,
      base64ToUint8Array(ciphertext)
    );
    
    const decryptedText = uint8ArrayToString(new Uint8Array(decryptedBuffer));
    return JSON.parse(decryptedText);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Failed to decrypt data: ${error.message}`);
  }
}

/**
 * Prepare debt for encryption - extract sensitive fields
 */
export function prepareSensitiveData(debt) {
  return {
    name: debt.name,
    balance: debt.balance,
    interestRate: debt.interestRate || debt.rate,
    minPayment: debt.minPayment || debt.min_payment,
    limit: debt.limit || debt.credit_limit,
    notes: debt.notes || null
  };
}

/**
 * Prepare non-sensitive data for storage
 */
export function prepareNonSensitiveData(debt) {
  return {
    id: debt.id,
    debt_type: debt.type || 'other',
    order_index: debt.order || debt.order_index || 0,
    created_at: debt.createdAt || debt.created_at,
    updated_at: debt.updatedAt || debt.updated_at
  };
}

/**
 * Calculate amount band and issuer hash for analytics
 */
export async function prepareAnalyticsData(debt) {
  // Inline amount banding logic (avoid TS import in worker)
  const toPennies = (pounds) => Math.round(pounds * 100);
  
  const bandAmount = (minorUnits) => {
    const absAmount = Math.abs(minorUnits);
    const bands = [
      [0, "0-0"],
      [50000, "0-500"],      // £500
      [100000, "500-1k"],    // £1,000
      [200000, "1-2k"],      // £2,000
      [500000, "2-5k"],      // £5,000
      [1000000, "5-10k"],    // £10,000
      [2000000, "10-20k"],   // £20,000
      [5000000, "20-50k"],   // £50,000
      [Infinity, "50k+"]
    ];
    
    for (const [threshold, band] of bands) {
      if (absAmount < threshold) {
        return band;
      }
    }
    return "50k+";
  };
  
  // Amount banding
  const amountBand = bandAmount(toPennies(debt.balance));
  
  // Issuer hashing (browser-compatible)
  let issuerHash = 'unknown';
  if (debt.name) {
    const normalized = debt.name.toLowerCase().trim();
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    issuerHash = hashHex.substring(0, 8);
  }
  
  return {
    amount_band: amountBand,
    issuer_hash: issuerHash
  };
}

/**
 * Encrypt and prepare debt for secure D1 storage
 */
export async function encryptDebtForStorage(debt, masterKey, userId) {
  // Extract sensitive data
  const sensitiveData = prepareSensitiveData(debt);
  
  // Encrypt sensitive data
  const encrypted = await encryptDebtData(sensitiveData, masterKey, userId);
  
  // Prepare analytics data
  const analytics = await prepareAnalyticsData(debt);
  
  // Combine with non-sensitive data
  const nonSensitive = prepareNonSensitiveData(debt);
  
  return {
    ...nonSensitive,
    ...analytics,
    dek_version: encrypted.version,
    iv: encrypted.iv,
    ciphertext: encrypted.ciphertext,
    encrypted_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Decrypt debt from D1 storage
 */
export async function decryptDebtFromStorage(encryptedDebt, masterKey, userId) {
  try {
    // Check if debt is encrypted
    if (!encryptedDebt.ciphertext || !encryptedDebt.iv) {
      // Legacy unencrypted debt - return as is with warning
      console.warn('Found unencrypted debt:', encryptedDebt.id);
      return {
        id: encryptedDebt.id,
        name: encryptedDebt.name || 'Legacy Debt',
        balance: encryptedDebt.balance || 0,
        interestRate: encryptedDebt.rate || encryptedDebt.interestRate || 0,
        minPayment: encryptedDebt.min_payment || encryptedDebt.minPayment || 0,
        limit: encryptedDebt.credit_limit || encryptedDebt.limit || null,
        type: encryptedDebt.debt_type || 'other',
        order: encryptedDebt.order_index || 0,
        createdAt: encryptedDebt.created_at,
        updatedAt: encryptedDebt.updated_at
      };
    }
    
    // Decrypt sensitive data
    const sensitiveData = await decryptDebtData(
      {
        iv: encryptedDebt.iv,
        ciphertext: encryptedDebt.ciphertext,
        version: encryptedDebt.dek_version
      },
      masterKey,
      userId,
      encryptedDebt.dek_version
    );
    
    // Record decryption time
    const decryptTime = Math.floor(Date.now() / 1000);
    
    // Combine with non-sensitive data
    return {
      id: encryptedDebt.id,
      ...sensitiveData,
      type: encryptedDebt.debt_type,
      order: encryptedDebt.order_index,
      createdAt: encryptedDebt.created_at,
      updatedAt: encryptedDebt.updated_at,
      _decryptedAt: decryptTime
    };
  } catch (error) {
    console.error('Failed to decrypt debt:', encryptedDebt.id, error);
    // Return minimal safe debt object on decryption failure
    return {
      id: encryptedDebt.id,
      name: '[Encrypted - Decryption Failed]',
      balance: 0,
      interestRate: 0,
      minPayment: 0,
      limit: null,
      type: encryptedDebt.debt_type || 'other',
      order: encryptedDebt.order_index || 0,
      createdAt: encryptedDebt.created_at,
      updatedAt: encryptedDebt.updated_at,
      _error: 'decryption_failed'
    };
  }
}

/**
 * Test encryption/decryption roundtrip
 */
export async function testEncryption(masterKey, userId) {
  const testDebt = {
    id: 'test-debt-123',
    name: 'Test Credit Card',
    balance: 1234.56,
    interestRate: 23.99,
    minPayment: 50.00,
    limit: 5000.00,
    type: 'credit_card'
  };
  
  console.log('Original:', testDebt);
  
  // Test encryption
  const encrypted = await encryptDebtForStorage(testDebt, masterKey, userId);
  console.log('Encrypted:', encrypted);
  
  // Test decryption
  const decrypted = await decryptDebtFromStorage(encrypted, masterKey, userId);
  console.log('Decrypted:', decrypted);
  
  // Verify roundtrip
  const matches = (
    testDebt.name === decrypted.name &&
    testDebt.balance === decrypted.balance &&
    testDebt.interestRate === decrypted.interestRate &&
    testDebt.minPayment === decrypted.minPayment &&
    testDebt.limit === decrypted.limit
  );
  
  console.log('Roundtrip successful:', matches);
  return matches;
}