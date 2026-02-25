/**
 * Thin wrapper around localStorage / Capacitor Preferences.
 *
 * Falls back to in-memory storage when neither is available (SSR).
 */

const memoryStore = new Map<string, string>();

function isClient() {
  return typeof window !== "undefined";
}

export const storage = {
  async get(key: string): Promise<string | null> {
    if (!isClient()) return memoryStore.get(key) ?? null;
    try {
      // Try Capacitor Preferences first (native)
      const { Preferences } = await import("@capacitor/preferences").catch(
        () => ({ Preferences: null })
      );
      if (Preferences) {
        const { value } = await Preferences.get({ key });
        return value;
      }
    } catch {
      // fall through to localStorage
    }
    return localStorage.getItem(key);
  },

  async set(key: string, value: string): Promise<void> {
    if (!isClient()) {
      memoryStore.set(key, value);
      return;
    }
    try {
      const { Preferences } = await import("@capacitor/preferences").catch(
        () => ({ Preferences: null })
      );
      if (Preferences) {
        await Preferences.set({ key, value });
        return;
      }
    } catch {
      // fall through to localStorage
    }
    localStorage.setItem(key, value);
  },

  async remove(key: string): Promise<void> {
    if (!isClient()) {
      memoryStore.delete(key);
      return;
    }
    try {
      const { Preferences } = await import("@capacitor/preferences").catch(
        () => ({ Preferences: null })
      );
      if (Preferences) {
        await Preferences.remove({ key });
        return;
      }
    } catch {
      // fall through to localStorage
    }
    localStorage.removeItem(key);
  },
};
