import { get, set, del, keys } from 'idb-keyval';

export const storageService = {
  async saveItem<T>(key: string, value: T): Promise<void> {
    try {
      await set(key, value);
    } catch (err) {
      console.error('Error saving to IndexedDB:', err);
    }
  },

  async loadItem<T>(key: string): Promise<T | null> {
    try {
      const val = await get<T>(key);
      return val ?? null;
    } catch (err) {
      console.error('Error loading from IndexedDB:', err);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await del(key);
    } catch (err) {
      console.error('Error removing from IndexedDB:', err);
    }
  },

  // Specialized methods for local image storage
  async saveImage(id: string, base64Data: string): Promise<string> {
    const key = `local-img-${id}`;
    await this.saveItem(key, base64Data);
    return key;
  },

  async loadImage(key: string): Promise<string | null> {
    return (await this.loadItem(key)) as string | null;
  },

  async removeImage(key: string): Promise<void> {
    await this.removeItem(key);
  }
};
