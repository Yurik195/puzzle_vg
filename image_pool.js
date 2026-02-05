import ThemeManifests from './theme_manifests.js';

const STORAGE_PREFIX = 'jigmerge_image_index_';

const ImagePool = {
  themes: {},
  initialized: false,
  preloadImages: {},

  async initialize(themeId = 'animals') {
    if (this.themes[themeId]) {
      return;
    }

    let manifest = ThemeManifests.getManifest(themeId);
    if (!manifest) {
      manifest = await ThemeManifests.loadManifest(themeId);
    }

    if (!manifest) {
      throw new Error(`Failed to load manifest for theme: ${themeId}`);
    }

    const storageKey = `${STORAGE_PREFIX}${themeId}`;
    let currentIndex = 0;
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        currentIndex = parseInt(localStorage.getItem(storageKey) || '0', 10);
      }
    } catch (e) {
      if (e.name === 'SecurityError' || e.message.includes('not allowed')) {
        console.warn('Storage access not allowed, using default index');
      } else {
        console.warn('Failed to get current index from storage:', e);
      }
      currentIndex = 0;
    }
    
    if (currentIndex < 0 || currentIndex >= manifest.imageList.length) {
      currentIndex = 0;
    }

    this.themes[themeId] = {
      imageList: manifest.imageList,
      currentIndex,
      baseUrl: manifest.baseUrl,
      storageKey,
      themeId
    };

    if (!this.initialized) {
      this.initialized = true;
    }

    await this.preloadCurrent(themeId);
    this.preloadNext(themeId);
    
    console.log(`ImagePool initialized for theme "${themeId}" with ${manifest.imageList.length} images`);
  },

  getCurrentImageUrl(themeId = 'animals') {
    const theme = this.themes[themeId];
    if (!theme || !theme.imageList || theme.imageList.length === 0) {
      return null;
    }

    const fileName = theme.imageList[theme.currentIndex];
    return `${theme.baseUrl}/${fileName}`;
  },

  getNextImageUrl(themeId = 'animals') {
    const theme = this.themes[themeId];
    if (!theme || !theme.imageList || theme.imageList.length === 0) {
      return null;
    }

    const nextIndex = (theme.currentIndex + 1) % theme.imageList.length;
    const fileName = theme.imageList[nextIndex];
    return `${theme.baseUrl}/${fileName}`;
  },

  moveToNext(themeId = 'animals') {
    const theme = this.themes[themeId];
    if (!theme || !theme.imageList || theme.imageList.length === 0) {
      return;
    }

    theme.currentIndex = (theme.currentIndex + 1) % theme.imageList.length;
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem(theme.storageKey, theme.currentIndex.toString());
      }
    } catch (e) {
      if (e.name === 'SecurityError' || e.message.includes('not allowed')) {
        console.warn('Storage access not allowed, cannot save index');
      } else {
        console.warn('Failed to save current index to storage:', e);
      }
    }
    
    this.preloadNext(themeId);
    
    console.log(`Moved to next image for theme "${themeId}", index: ${theme.currentIndex}`);
  },

  async preloadCurrent(themeId = 'animals') {
    const currentUrl = this.getCurrentImageUrl(themeId);
    if (!currentUrl) {
      return;
    }

    if (this.preloadImages[currentUrl]) {
      return;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.preloadImages[currentUrl] = img;
        console.log(`Preloaded current image: ${currentUrl}`);
        resolve();
      };
      img.onerror = (error) => {
        console.warn(`Failed to preload current image: ${currentUrl}`, error);
        resolve();
      };
      img.src = currentUrl;
    });
  },

  preloadNext(themeId = 'animals') {
    const nextUrl = this.getNextImageUrl(themeId);
    if (!nextUrl) {
      return;
    }

    if (this.preloadImages[nextUrl]) {
      return;
    }

    const img = new Image();
    img.onload = () => {
      this.preloadImages[nextUrl] = img;
      console.log(`Preloaded next image: ${nextUrl}`);
    };
    img.onerror = (error) => {
      console.warn(`Failed to preload next image: ${nextUrl}`, error);
    };
    img.src = nextUrl;
  },

  getPreloadedImage(url) {
    return this.preloadImages[url] || null;
  },

  getTotalImages(themeId = 'animals') {
    const theme = this.themes[themeId];
    if (!theme || !theme.imageList) {
      return 0;
    }
    return theme.imageList.length;
  },

  clearPreloadCache() {
    this.preloadImages = {};
  }
};

export default ImagePool;






