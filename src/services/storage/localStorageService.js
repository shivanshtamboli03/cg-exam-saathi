
const STORAGE_PREFIX = "cg-exam-saathi:v1:";

export const localStorageService = {
  get(key, fallback = null) {
    try {
      const value = localStorage.getItem(
        STORAGE_PREFIX + key
      );

      return value === null
        ? fallback
        : JSON.parse(value);
    } catch (error) {
      console.error("Storage read error:", error);
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(
        STORAGE_PREFIX + key,
        JSON.stringify(value)
      );

      return true;
    } catch (error) {
      console.error("Storage write error:", error);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(
        STORAGE_PREFIX + key
      );

      return true;
    } catch (error) {
      console.error("Storage remove error:", error);
      return false;
    }
  },

  clearAll() {
    try {
      const keys = Object.keys(localStorage);

      keys.forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });

      return true;
    } catch (error) {
      console.error("Storage clear error:", error);
      return false;
    }
  }
};
