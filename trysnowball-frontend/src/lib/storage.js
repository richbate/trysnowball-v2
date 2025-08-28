/**
 * Storage utility for localStorage operations
 * Provides a clean interface for storing and retrieving data
 */

export class Storage {
  constructor(defaultKey = 'app-storage') {
    // Legacy keys removed - use localDebtStore for debt persistence
    this.defaultKey = defaultKey;
    this.currentKey = defaultKey;
  }

  /**
   * Set the storage key (for user-specific storage)
   */
  setKey(key) {
    this.currentKey = key || this.defaultKey;
  }

  /**
   * Get the current storage key
   */
  getKey() {
    return this.currentKey;
  }

  /**
   * Store data in localStorage
   */
  save(data) {
    try {
      localStorage.setItem(this.currentKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('[Storage] Error saving data:', error);
      return false;
    }
  }

  /**
   * Load data from localStorage
   */
  load() {
    try {
      const stored = localStorage.getItem(this.currentKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('[Storage] Error loading data:', error);
      return null;
    }
  }

  /**
   * Remove data from localStorage
   */
  remove() {
    try {
      localStorage.removeItem(this.currentKey);
      return true;
    } catch (error) {
      console.error('[Storage] Error removing data:', error);
      return false;
    }
  }

  /**
   * Check if data exists in localStorage
   */
  exists() {
    return localStorage.getItem(this.currentKey) !== null;
  }

  /**
   * Get the size of stored data in bytes (approximate)
   */
  getSize() {
    try {
      const data = localStorage.getItem(this.currentKey);
      return data ? new Blob([data]).size : 0;
    } catch (error) {
      console.error('[Storage] Error calculating size:', error);
      return 0;
    }
  }

  /**
   * Create a backup of current data
   */
  backup() {
    const data = this.load();
    if (data) {
      const backupKey = `${this.currentKey}-backup-${Date.now()}`;
      try {
        localStorage.setItem(backupKey, JSON.stringify({
          ...data,
          backupCreatedAt: new Date().toISOString(),
          originalKey: this.currentKey
        }));
        return backupKey;
      } catch (error) {
        console.error('[Storage] Error creating backup:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Restore data from a backup
   */
  restore(backupKey) {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        const parsed = JSON.parse(backupData);
        // Remove backup metadata before restoring
        const { backupCreatedAt, originalKey, ...data } = parsed;
        this.save(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Storage] Error restoring backup:', error);
      return false;
    }
  }
}

// Create default storage instance
export const storage = new Storage();
export default storage;