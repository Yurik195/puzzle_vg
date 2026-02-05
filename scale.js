import { DESIGN_LANDSCAPE, DESIGN_PORTRAIT } from './config.js';

let currentScale = 1;
let offsetX = 0;
let offsetY = 0;
let currentDesignWidth = DESIGN_LANDSCAPE.width;
let currentDesignHeight = DESIGN_LANDSCAPE.height;
let isPortraitMode = false;

export function updateScale() {
  const root = document.getElementById('game-root');
  const wrapper = document.getElementById('game-wrapper');
  if (!root || !wrapper) return;

  const wrapperRect = wrapper.getBoundingClientRect();
  const vw = wrapperRect.width;
  const vh = wrapperRect.height;
  const isPortrait = vh > vw;

  const design = isPortrait ? DESIGN_PORTRAIT : DESIGN_LANDSCAPE;
  
  let scale = Math.min(vw / design.width, vh / design.height);
  if (scale > 1) scale = 1;

  const scaledWidth = design.width * scale;
  const scaledHeight = design.height * scale;
  const offsetXCalc = (vw - scaledWidth) / 2;
  const offsetYCalc = (vh - scaledHeight) / 2;

  currentScale = scale;
  currentDesignWidth = design.width;
  currentDesignHeight = design.height;
  isPortraitMode = isPortrait;
  offsetX = offsetXCalc;
  offsetY = offsetYCalc;

  root.style.width = `${design.width}px`;
  root.style.height = `${design.height}px`;
  root.style.left = `${offsetXCalc}px`;
  root.style.top = `${offsetYCalc}px`;
  root.style.transform = `scale(${scale})`;

  root.classList.toggle('portrait', isPortrait);
  root.classList.toggle('landscape', !isPortrait);
  wrapper.classList.toggle('portrait-mode', isPortrait);
}

export function screenToGameCoords(screenX, screenY) {
  const wrapper = document.getElementById('game-wrapper');
  if (!wrapper) return { x: 0, y: 0 };

  const wrapperRect = wrapper.getBoundingClientRect();
  const localX = screenX - wrapperRect.left;
  const localY = screenY - wrapperRect.top;

  const xInRoot = (localX - offsetX) / currentScale;
  const yInRoot = (localY - offsetY) / currentScale;

  return { x: xInRoot, y: yInRoot };
}

export function getCurrentDesignWidth() {
  return currentDesignWidth;
}

export function getCurrentDesignHeight() {
  return currentDesignHeight;
}

export function getIsPortraitMode() {
  return isPortraitMode;
}

window.addEventListener('load', updateScale);
window.addEventListener('resize', updateScale);
window.addEventListener('orientationchange', updateScale);

