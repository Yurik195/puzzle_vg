import { saveToCloud, loadFromCloud } from './cloud_storage.js';
import { muteAudio, unmuteAudio } from './audio.js';

const SOUND_ENABLED_KEY = 'jigmerge_sound_enabled';

let soundEnabled = true;

async function loadSettings() {
  try {
    const stored = await loadFromCloud(SOUND_ENABLED_KEY, true);
    soundEnabled = stored === true;
    if (!soundEnabled) {
      try {
        muteAudio();
      } catch (e) {
        console.warn('Failed to mute audio:', e);
      }
    }
  } catch (e) {
    console.warn('Failed to load settings:', e);
    soundEnabled = true;
  }
}

async function saveSettings() {
  try {
    await saveToCloud(SOUND_ENABLED_KEY, soundEnabled);
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

export async function initializeSettings() {
  await loadSettings();
}

export function getSoundEnabled() {
  return soundEnabled;
}

export async function setSoundEnabled(enabled) {
  soundEnabled = enabled;
  try {
    await saveSettings();
  } catch (e) {
    console.warn('Failed to save sound setting:', e);
  }
  try {
    if (!enabled) {
      muteAudio();
    } else {
      unmuteAudio();
    }
  } catch (e) {
    console.warn('Failed to change audio state:', e);
  }
}

