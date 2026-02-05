import { muteAudio, unmuteAudio, isMutedState } from './audio.js';
import { getSoundEnabled } from './settings.js';

export async function showInterstitialAd(reason = 'default') {
  console.log(`[ADS] Showing interstitial ad. Reason: ${reason}`);
  
  const wasMuted = isMutedState();
  const soundEnabled = getSoundEnabled();
  
  if (soundEnabled && !wasMuted) {
    muteAudio();
  }
  
  await fakeDelay(1000);
  
  if (soundEnabled && !wasMuted) {
    unmuteAudio();
  }
  
  console.log('[ADS] Interstitial ad closed');
}

export async function showRewardedAd(reason = 'default') {
  console.log(`[ADS] Showing rewarded ad. Reason: ${reason}`);
  
  const wasMuted = isMutedState();
  const soundEnabled = getSoundEnabled();
  
  if (soundEnabled && !wasMuted) {
    muteAudio();
  }
  
  await fakeDelay(1500);
  
  if (soundEnabled && !wasMuted) {
    unmuteAudio();
  }
  
  console.log('[ADS] Rewarded ad closed');
  
  return { rewarded: true };
}

export async function showBannerAd() {
  console.log('[ADS] Showing banner ad');
  return Promise.resolve();
}

export async function hideBannerAd() {
  console.log('[ADS] Hiding banner ad');
  return Promise.resolve();
}

function fakeDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

