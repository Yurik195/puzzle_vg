import { getBridge, isSDKInitialized } from './playgama_sdk.js';
import { muteAudio, unmuteAudio, isMutedState } from './audio.js';
import { getSoundEnabled } from './settings.js';

const INTERSTITIAL_COOLDOWN = 60000;
const LAST_INTERSTITIAL_KEY = 'jigmerge_last_interstitial';

let lastInterstitialTime = 0;
let skipFirstCall = true; // не показываем на первом вызове (старт игры)

function loadLastInterstitialTime() {
  try {
    if (typeof localStorage === 'undefined' || !localStorage) {
      return 0;
    }
    const stored = localStorage.getItem(LAST_INTERSTITIAL_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch (e) {
    return 0;
  }
}

function saveLastInterstitialTime() {
  try {
    if (typeof localStorage === 'undefined' || !localStorage) {
      return;
    }
    localStorage.setItem(LAST_INTERSTITIAL_KEY, Date.now().toString());
  } catch (e) {
  }
}

function canShowInterstitial() {
  const now = Date.now();
  const lastTime = loadLastInterstitialTime();
  return now - lastTime >= INTERSTITIAL_COOLDOWN;
}

export async function showInterstitialAd(reason = 'default') {
  if (skipFirstCall) {
    skipFirstCall = false;
    return;
  }
  
  if (!canShowInterstitial()) {
    return;
  }

  const bridge = getBridge();
  if (!bridge || !isSDKInitialized() || !bridge.advertisement) {
    return;
  }

  const wasMuted = isMutedState();
  const soundEnabled = getSoundEnabled();
  
  if (soundEnabled && !wasMuted) {
    muteAudio();
  }

  return new Promise((resolve) => {
    if (!bridge.advertisement || typeof bridge.advertisement.showInterstitial !== 'function') {
      if (soundEnabled && !wasMuted) {
        unmuteAudio();
      }
      return resolve();
    }

    let result;
    try {
      result = bridge.advertisement.showInterstitial();
    } catch (err) {
      console.error('[PlayGamaSDK] Interstitial error', err);
      if (soundEnabled && !wasMuted) {
        unmuteAudio();
      }
      return resolve();
    }

    // Если метод не вернул Promise — считаем, что реклама мгновенно завершена
    if (!result || typeof result.then !== 'function') {
      if (soundEnabled && !wasMuted) {
        unmuteAudio();
      }
      saveLastInterstitialTime();
      return resolve();
    }

    result
      .then(() => {
        if (soundEnabled && !wasMuted) {
          unmuteAudio();
        }
        saveLastInterstitialTime();
        resolve();
      })
      .catch((err) => {
        console.error('[PlayGamaSDK] Interstitial error', err);
        if (soundEnabled && !wasMuted) {
          unmuteAudio();
        }
        resolve();
      });
  });
}


