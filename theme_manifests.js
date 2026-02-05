import { getThemeById, THEMES } from './themes.js';

const BASE_URL = 'https://storage.yandexcloud.net/y-a-vmerge-puzzles';
const MANIFEST_CACHE_KEY = 'jigmerge_theme_manifests';
const MANIFEST_CACHE_VERSION = 1;

const ThemeManifests = {
  cache: {},
  loadingPromises: {},

  async loadManifest(themeId) {
    if (this.cache[themeId]) {
      return this.cache[themeId];
    }

    if (this.loadingPromises[themeId]) {
      return this.loadingPromises[themeId];
    }

    const theme = getThemeById(themeId);
    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`);
    }

    const promise = this.fetchManifest(themeId, theme);
    this.loadingPromises[themeId] = promise;

    try {
      const manifest = await promise;
      this.cache[themeId] = manifest;
      this.saveToLocalStorage();
      return manifest;
    } finally {
      delete this.loadingPromises[themeId];
    }
  },

  async fetchManifest(themeId, theme) {
    const manifestUrl = `${BASE_URL}/${theme.folder}/index.json`;
    
    try {
      const response = await fetch(manifestUrl);
      if (!response.ok) {
        throw new Error(`Failed to load manifest: ${response.status}`);
      }
      
      const manifest = await response.json();
      
      let images = [];
      if (Array.isArray(manifest)) {
        images = manifest;
      } else if (manifest && Array.isArray(manifest.images)) {
        images = manifest.images;
      } else {
        console.error("Invalid manifest format", manifest);
        throw new Error('Manifest contains no images');
      }
      
      if (images.length === 0) {
        throw new Error('Manifest contains no images');
      }

      return {
        imageList: images,
        themeId,
        baseUrl: `${BASE_URL}/${theme.folder}`,
        folder: theme.folder
      };
    } catch (error) {
      console.error(`Failed to load manifest for theme "${themeId}":`, error);
      throw error;
    }
  },

  getManifest(themeId) {
    return this.cache[themeId] || null;
  },

  getTotalImages(themeId) {
    const manifest = this.getManifest(themeId);
    if (!manifest || !manifest.imageList) {
      return 0;
    }
    return manifest.imageList.length;
  },

  async loadAllManifests() {
    const promises = THEMES.map(theme => 
      this.loadManifest(theme.id).catch(error => {
        console.error(`Failed to load manifest for theme "${theme.id}":`, error);
        return null;
      })
    );
    
    await Promise.all(promises);
  },

  loadFromLocalStorage() {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) {
        return;
      }
      const stored = localStorage.getItem(MANIFEST_CACHE_KEY);
      if (!stored) {
        return;
      }

      const data = JSON.parse(stored);
      if (data.version !== MANIFEST_CACHE_VERSION) {
        return;
      }

      this.cache = data.cache || {};
    } catch (error) {
      if (error.name === 'SecurityError' || error.message.includes('not allowed')) {
        console.warn('Storage access not allowed in this context, skipping cache load');
      } else {
        console.warn('Failed to load manifest cache from localStorage:', error);
      }
    }
  },

  saveToLocalStorage() {
    try {
      const data = {
        version: MANIFEST_CACHE_VERSION,
        cache: this.cache
      };
      localStorage.setItem(MANIFEST_CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save manifest cache to localStorage:', error);
    }
  },

  clearCache() {
    this.cache = {};
    this.loadingPromises = {};
    try {
      localStorage.removeItem(MANIFEST_CACHE_KEY);
    } catch (error) {
      console.warn('Failed to clear manifest cache from localStorage:', error);
    }
  }
};

if (typeof window !== 'undefined') {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    ThemeManifests.loadFromLocalStorage();
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      ThemeManifests.loadFromLocalStorage();
    });
  }
}

export default ThemeManifests;


