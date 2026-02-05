import { AUDIO_ENABLED_BY_DEFAULT } from './config.js';

let audioContext = null;
let masterGain = null;
let isMuted = false;
let isSuspendedByPageHide = false;
let isInitialized = false;
let volumeBeforeMute = 1.0;

const soundBuffers = new Map();
const activeSources = new Map();

export function initAudio() {
  if (isInitialized) return;
  
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
    
    masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    
    if (AUDIO_ENABLED_BY_DEFAULT) {
      masterGain.gain.value = 1.0;
      volumeBeforeMute = 1.0;
    } else {
      masterGain.gain.value = 0.0;
      isMuted = true;
      volumeBeforeMute = 0.0;
    }
    
    isInitialized = true;
    
    setupPageVisibilityHandlers();
    
  } catch (e) {
    console.error('Failed to initialize audio:', e);
  }
}

function setupPageVisibilityHandlers() {
  document.addEventListener('visibilitychange', () => {
    if (!audioContext) return;
    
    if (document.hidden) {
      if (audioContext.state === 'running') {
        isSuspendedByPageHide = true;
        audioContext.suspend();
      }
    } else {
      if (isSuspendedByPageHide && audioContext.state === 'suspended') {
        isSuspendedByPageHide = false;
        audioContext.resume();
      }
    }
  });
  
  window.addEventListener('blur', () => {
    if (!audioContext) return;
    if (audioContext.state === 'running') {
      isSuspendedByPageHide = true;
      audioContext.suspend();
    }
  });
  
  window.addEventListener('focus', () => {
    if (!audioContext) return;
    if (isSuspendedByPageHide && audioContext.state === 'suspended') {
      isSuspendedByPageHide = false;
      audioContext.resume();
    }
  });
}

export async function loadSound(name, url) {
  if (!audioContext) {
    initAudio();
  }
  
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    soundBuffers.set(name, audioBuffer);
  } catch (e) {
    console.error(`Failed to load sound ${name}:`, e);
  }
}

export function playSound(name, loop = false) {
  if (!audioContext || !isInitialized) {
    initAudio();
  }
  
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  const buffer = soundBuffers.get(name);
  if (!buffer) {
    console.warn(`Sound ${name} not loaded`);
    return;
  }
  
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.loop = loop;
  source.connect(masterGain);
  source.start(0);
  
  activeSources.set(name, source);
  
  source.onended = () => {
    if (activeSources.get(name) === source) {
      activeSources.delete(name);
    }
  };
}

export function stopSound(name) {
  const source = activeSources.get(name);
  if (source) {
    try {
      source.stop();
    } catch (e) {
    }
    activeSources.delete(name);
  }
}

export function stopAllSounds() {
  activeSources.forEach((source, name) => {
    try {
      source.stop();
    } catch (e) {
    }
  });
  activeSources.clear();
}

export function setMasterVolume(value) {
  if (!masterGain) return;
  
  const clampedValue = Math.max(0, Math.min(1, value));
  masterGain.gain.value = clampedValue;
  volumeBeforeMute = clampedValue;
  isMuted = clampedValue === 0;
}

export function muteAudio() {
  if (!masterGain) return;
  
  if (!isMuted) {
    volumeBeforeMute = masterGain.gain.value;
  }
  masterGain.gain.value = 0;
  isMuted = true;
}

export function unmuteAudio() {
  if (!masterGain) return;
  
  masterGain.gain.value = volumeBeforeMute;
  isMuted = false;
}

export function toggleMute() {
  if (isMuted) {
    unmuteAudio();
  } else {
    muteAudio();
  }
}

export function getMasterVolume() {
  return masterGain ? masterGain.gain.value : 0;
}

export function isMutedState() {
  return isMuted;
}

