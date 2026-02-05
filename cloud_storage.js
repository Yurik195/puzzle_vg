import { getBridge, isSDKInitialized } from './playgama_sdk.js';
import { isVKAvailable, saveToVKCloud, loadFromVKCloud } from './vk_integration.js';

let storageAvailable = false;
let isInitialized = false;
let initPromise = null;

async function initStorage() {
  if (isInitialized) {
    return storageAvailable;
  }
  if (initPromise) {
    return initPromise;
  }
  
  initPromise = (async () => {
    const bridge = getBridge();
    if (!bridge || !isSDKInitialized()) {
      console.warn('[CloudStorage] SDK not available, using localStorage fallback');
      isInitialized = true;
      storageAvailable = false;
      return false;
    }
    
    try {
      if (bridge.storage && typeof bridge.storage.get === 'function') {
        storageAvailable = true;
        console.log('[CloudStorage] PlayGama storage initialized');
      } else {
        console.warn('[CloudStorage] PlayGama storage not available');
        storageAvailable = false;
      }
      isInitialized = true;
      return storageAvailable;
    } catch (e) {
      console.error('[CloudStorage] Failed to initialize storage', e);
      isInitialized = true;
      storageAvailable = false;
      return false;
    }
  })();
  
  return initPromise;
}

export async function saveToCloud(key, data) {
  try {
    // Приоритет 1: VK Bridge для VK платформы
    if (isVKAvailable()) {
      const jsonData = JSON.stringify(data);
      const saved = await saveToVKCloud(key, jsonData);
      if (saved) {
        // Дублируем в localStorage для надежности
        try {
          localStorage.setItem(key, jsonData);
        } catch (e) {}
        return;
      }
    }
    
    // Приоритет 2: PlayGama storage
    const hasStorage = await initStorage();
    if (hasStorage) {
      const bridge = getBridge();
      try {
        await bridge.storage.set(key, data);
        console.log(`[CloudStorage] Saved ${key}`);
        // Дублируем в localStorage
        try {
          localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {}
        return;
      } catch (e) {
        console.error(`[CloudStorage] Failed to save ${key} to PlayGama storage`, e);
      }
    }
    
    // Fallback: localStorage
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (storageError) {
      console.warn(`[CloudStorage] localStorage not available for ${key}:`, storageError);
    }
  } catch (e) {
    console.error(`[CloudStorage] Failed to save ${key}`, e);
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (storageError) {
      console.warn(`[CloudStorage] localStorage not available for ${key}:`, storageError);
    }
  }
}

export async function loadFromCloud(key, defaultValue = null) {
  try {
    // Приоритет 1: VK Bridge для VK платформы
    if (isVKAvailable()) {
      const vkData = await loadFromVKCloud([key]);
      if (vkData && vkData.length > 0) {
        const item = vkData.find(item => item.key === key);
        if (item && item.value) {
          try {
            const parsed = JSON.parse(item.value);
            // Синхронизируем с localStorage
            try {
              localStorage.setItem(key, item.value);
            } catch (e) {}
            return parsed;
          } catch (e) {
            console.error(`[CloudStorage] Failed to parse VK data for ${key}`, e);
          }
        }
      }
      
      // Если в VK облаке нет данных, проверяем localStorage и мигрируем
      try {
        const localStored = localStorage.getItem(key);
        if (localStored !== null) {
          const parsed = JSON.parse(localStored);
          // Мигрируем в VK облако
          await saveToVKCloud(key, localStored);
          console.log(`📤 Мигрировали ${key} в VK облако`);
          return parsed;
        }
      } catch (e) {}
      
      return defaultValue;
    }
    
    // Приоритет 2: PlayGama storage
    const hasStorage = await initStorage();
    if (hasStorage) {
      const bridge = getBridge();
      try {
        const value = await bridge.storage.get(key);
        if (value !== null && value !== undefined) {
          return value;
        }
        
        // Миграция из localStorage
        try {
          const localStored = localStorage.getItem(key);
          if (localStored !== null) {
            try {
              const parsed = JSON.parse(localStored);
              await saveToCloud(key, parsed);
              return parsed;
            } catch (e) {
              return defaultValue;
            }
          }
        } catch (storageError) {
          console.warn(`[CloudStorage] localStorage not available for ${key}:`, storageError);
        }
        
        return defaultValue;
      } catch (e) {
        console.error(`[CloudStorage] Failed to load ${key} from PlayGama storage`, e);
      }
    }
    
    // Fallback: localStorage
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) {
        return defaultValue;
      }
      try {
        return JSON.parse(stored);
      } catch (e) {
        return defaultValue;
      }
    } catch (storageError) {
      console.warn(`[CloudStorage] localStorage not available for ${key}:`, storageError);
      return defaultValue;
    }
  } catch (e) {
    console.error(`[CloudStorage] Failed to load ${key}`, e);
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) {
        return defaultValue;
      }
      try {
        return JSON.parse(stored);
      } catch (e) {
        return defaultValue;
      }
    } catch (storageError) {
      console.warn(`[CloudStorage] localStorage not available for ${key}:`, storageError);
      return defaultValue;
    }
  }
}

export async function initializeCloudStorage() {
  await initStorage();
}

