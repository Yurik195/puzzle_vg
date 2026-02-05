import { setLang } from './localization.js';

let bridge = null;
let isInitialized = false;

async function waitForBridge(maxWait = 10000) {
  if (typeof window.bridge !== 'undefined' && window.bridge) {
    return true;
  }
  
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (typeof window.bridge !== 'undefined' && window.bridge) {
      return true;
    }
  }
  return false;
}

export async function initPlayGamaSDK() {
  const sdkAvailable = await waitForBridge();
  
  if (!sdkAvailable) {
    console.warn('[PlayGamaSDK] Bridge not found (local dev or SDK not loaded)');
    return null;
  }
  
  try {
    bridge = window.bridge;
    await bridge.initialize();
    isInitialized = true;
    console.log('[PlayGamaSDK] Initialized');
    return bridge;
  } catch (e) {
    console.error('[PlayGamaSDK] init failed', e);
    bridge = null;
    isInitialized = false;
    return null;
  }
}

export function getBridge() {
  return bridge;
}

export function isSDKInitialized() {
  return isInitialized;
}

let langApplied = false;

export function applyLanguageOnce() {
  if (langApplied) return;
  langApplied = true;
  
  let lang = 'ru';
  
  if (bridge && bridge.platform && bridge.platform.language) {
    const sdkLang = bridge.platform.language.toLowerCase();
    lang = sdkLang === 'ru' || sdkLang.startsWith('ru') ? 'ru' : 'en';
  } else {
    const navLang = (navigator.language || navigator.userLanguage || 'ru').toLowerCase().slice(0, 2);
    lang = navLang === 'ru' ? 'ru' : 'en';
  }
  
  console.log('[PlayGamaSDK] Language set to:', lang);
  setLang(lang);
}

let gameReadySent = false;

export async function sendGameReadyOnce() {
  if (gameReadySent) return;
  
  if (!bridge) {
    console.warn('[PlayGamaSDK] Cannot send game ready - bridge not initialized');
    return;
  }
  
  try {
    // Согласно документации PlayGama: bridge.platform.sendMessage("game_ready")
    if (bridge.platform && typeof bridge.platform.sendMessage === 'function') {
      await bridge.platform.sendMessage('game_ready');
      console.log('[PlayGamaSDK] ✅ Game Ready sent via bridge.platform.sendMessage("game_ready")');
      gameReadySent = true;
      return;
    }
    console.warn('[PlayGamaSDK] ❌ bridge.platform.sendMessage not available');
  } catch (e) {
    console.error('[PlayGamaSDK] Game ready failed', e);
  }
}

