import { getBridge, isSDKInitialized } from './playgama_sdk.js';
import { muteAudio, unmuteAudio, isMutedState } from './audio.js';
import { getSoundEnabled } from './settings.js';

export function showRewardedAd(reason) {
  return new Promise((resolve) => {
    const bridge = getBridge();
    if (!bridge || !isSDKInitialized() || !bridge.advertisement) {
      console.warn('[PlayGamaSDK] rewarded not available, fallback');
      resolve({ rewarded: true, reason });
      return;
    }
    
    const wasMuted = isMutedState();
    const soundEnabled = getSoundEnabled();
    
    if (soundEnabled && !wasMuted) {
      muteAudio();
    }
    
    if (!bridge.advertisement || typeof bridge.advertisement.showRewarded !== 'function') {
      if (soundEnabled && !wasMuted) {
        unmuteAudio();
      }
      resolve({ rewarded: true, reason });
      return;
    }

    let result;
    try {
      result = bridge.advertisement.showRewarded();
    } catch (err) {
      console.error('[PlayGamaSDK] Rewarded error', err);
      if (soundEnabled && !wasMuted) {
        unmuteAudio();
      }
      resolve({ rewarded: false, reason });
      return;
    }

    // Если не вернули Promise — считаем, что показ завершился успешно
    if (!result || typeof result.then !== 'function') {
      if (soundEnabled && !wasMuted) {
        unmuteAudio();
      }
      resolve({ rewarded: true, reason });
      return;
    }

    result
      .then(() => {
        console.log('[PlayGamaSDK] Rewarded ad completed');
        if (soundEnabled && !wasMuted) {
          unmuteAudio();
        }
        resolve({ rewarded: true, reason });
      })
      .catch((err) => {
        console.error('[PlayGamaSDK] Rewarded error', err);
        if (soundEnabled && !wasMuted) {
          unmuteAudio();
        }
        resolve({ rewarded: false, reason });
      });
  });
}

export function showInterstitialAd() {
  return new Promise((resolve) => {
    const bridge = getBridge();
    if (!bridge || !isSDKInitialized() || !bridge.advertisement) {
      console.warn('[PlayGamaSDK] interstitial not available, fallback');
      resolve({ shown: true });
      return;
    }
    
    const wasMuted = isMutedState();
    const soundEnabled = getSoundEnabled();
    
    if (soundEnabled && !wasMuted) {
      muteAudio();
    }
    
    if (!bridge.advertisement || typeof bridge.advertisement.showInterstitial !== 'function') {
      if (soundEnabled && !wasMuted) {
        unmuteAudio();
      }
      resolve({ shown: true });
      return;
    }

    let result;
    try {
      result = bridge.advertisement.showInterstitial();
    } catch (err) {
      console.error('[PlayGamaSDK] Interstitial error', err);
      if (soundEnabled && !wasMuted) {
        unmuteAudio();
      }
      resolve({ shown: false });
      return;
    }

    // Если не вернули Promise — считаем, что показ завершился успешно
    if (!result || typeof result.then !== 'function') {
      if (soundEnabled && !wasMuted) {
        unmuteAudio();
      }
      resolve({ shown: true });
      return;
    }

    result
      .then(() => {
        console.log('[PlayGamaSDK] Interstitial ad completed');
        if (soundEnabled && !wasMuted) {
          unmuteAudio();
        }
        resolve({ shown: true });
      })
      .catch((err) => {
        console.error('[PlayGamaSDK] Interstitial error', err);
        if (soundEnabled && !wasMuted) {
          unmuteAudio();
        }
        resolve({ shown: false });
      });
  });
}


