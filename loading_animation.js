import { getGameArea } from './ui_layout.js';

let loadingOverlay = null;
let loadingStartTime = null;
const FAST_LOAD_THRESHOLD = 150;

export function showLoadingAnimation() {
  if (loadingOverlay) {
    return;
  }

  loadingStartTime = Date.now();

  const gameArea = getGameArea();
  if (!gameArea) return;

  loadingOverlay = document.createElement('div');
  loadingOverlay.id = 'loading-overlay';
  loadingOverlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(102, 126, 234, 1) 0%, rgba(118, 75, 162, 1) 100%);
    z-index: 2000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  `;

  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 30px;
  `;

  const tilesContainer = document.createElement('div');
  tilesContainer.style.cssText = `
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
  `;

  for (let i = 0; i < 4; i++) {
    const tile = document.createElement('div');
    tile.style.cssText = `
      width: 40px;
      height: 40px;
      background: white;
      border-radius: 6px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      animation: tileBounce 1.2s ease-in-out infinite;
      animation-delay: ${i * 0.15}s;
    `;
    tilesContainer.appendChild(tile);
  }

  const text = document.createElement('div');
  text.textContent = 'Загружаем картинку...';
  text.style.cssText = `
    color: white;
    font-size: 22px;
    font-weight: bold;
    font-family: 'Patsy', sans-serif;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
    animation: textFade 2s ease-in-out infinite;
  `;

  container.appendChild(tilesContainer);
  container.appendChild(text);
  loadingOverlay.appendChild(container);

  const style = document.createElement('style');
  if (!document.getElementById('loading-animation-styles')) {
    style.id = 'loading-animation-styles';
    style.textContent = `
      @keyframes tileBounce {
        0%, 100% {
          transform: translateY(0) scale(1);
        }
        50% {
          transform: translateY(-20px) scale(1.1);
        }
      }
      
      @keyframes textFade {
        0%, 100% {
          opacity: 0.7;
        }
        50% {
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  loadingOverlay.style.opacity = '1';
  gameArea.appendChild(loadingOverlay);
  
  requestAnimationFrame(() => {
    loadingOverlay.style.transition = 'opacity 0.2s ease';
  });
}

export function hideLoadingAnimation() {
  if (!loadingOverlay) {
    return;
  }

  const elapsed = Date.now() - (loadingStartTime || 0);
  
  if (elapsed < FAST_LOAD_THRESHOLD) {
    if (loadingOverlay && loadingOverlay.parentElement) {
      loadingOverlay.remove();
    }
    loadingOverlay = null;
    loadingStartTime = null;
    return;
  }

  if (loadingOverlay) {
    loadingOverlay.style.opacity = '0';
    loadingOverlay.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      if (loadingOverlay && loadingOverlay.parentElement) {
        loadingOverlay.remove();
      }
      loadingOverlay = null;
      loadingStartTime = null;
    }, 300);
  }
}

