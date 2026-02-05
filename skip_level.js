import { getTotalCoins, spendCoins } from './coins.js';
import { getGameArea } from './ui_layout.js';
import { Game, setCurrentLevel } from './game_logic.js';
import { playSound } from './audio.js';
import { showRewardedAd } from './ads_yandex.js';
import { t } from './localization.js';
import ImagePool from './image_pool.js';
import { updateProgressOnLevelComplete } from './progress.js';

const SKIP_LEVEL_COOLDOWN_STORAGE_KEY = 'jigmerge_skip_level_cooldown';
const SKIP_LEVEL_COOLDOWN_LEVELS = 2;

let skipOverlay = null;

function getLastSkippedLevel(theme) {
  try {
    if (typeof localStorage === 'undefined' || !localStorage) {
      return 0;
    }
    const key = `${SKIP_LEVEL_COOLDOWN_STORAGE_KEY}_${theme}`;
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : 0;
  } catch (e) {
    if (e.name === 'SecurityError' || e.message.includes('not allowed')) {
      console.warn('Storage access not allowed, using default skipped level');
    } else {
      console.warn('Failed to get last skipped level from storage:', e);
    }
    return 0;
  }
}

function setLastSkippedLevel(theme, level) {
  try {
    if (typeof localStorage === 'undefined' || !localStorage) {
      return;
    }
    const key = `${SKIP_LEVEL_COOLDOWN_STORAGE_KEY}_${theme}`;
    localStorage.setItem(key, level.toString());
  } catch (e) {
    if (e.name === 'SecurityError' || e.message.includes('not allowed')) {
      console.warn('Storage access not allowed, cannot save skipped level');
    } else {
      console.warn('Failed to save last skipped level to storage:', e);
    }
  }
}

export function canSkipWithAd(theme, currentLevel) {
  const lastSkipped = getLastSkippedLevel(theme);
  if (lastSkipped === 0) {
    return true;
  }
  return currentLevel - lastSkipped > SKIP_LEVEL_COOLDOWN_LEVELS;
}

export function showSkipLevelWindow() {
  if (skipOverlay) {
    return;
  }

  if (!Game || !Game.isRunning || !Game.currentTheme) {
    return;
  }

  if (Game) {
    Game.inputBlocked = true;
  }

  const gameRoot = document.getElementById('game-root');
  if (!gameRoot) return;

  const currentLevel = Game.currentLevel;
  const canUseAd = canSkipWithAd(Game.currentTheme, currentLevel);

  skipOverlay = document.createElement('div');
  skipOverlay.id = 'skip-level-overlay';
  skipOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 4000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;

  const skipCard = document.createElement('div');
  skipCard.style.cssText = `
    background: linear-gradient(135deg, rgba(100, 149, 237, 0.98) 0%, rgba(65, 105, 225, 0.98) 100%);
    border-radius: 25px;
    padding: 40px;
    min-width: 320px;
    max-width: 400px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6),
                0 0 100px rgba(100, 149, 237, 0.4);
    text-align: center;
    border: 3px solid rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
    position: relative;
  `;

  const closeButton = document.createElement('button');
  closeButton.innerHTML = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    width: 35px;
    height: 35px;
    border: none;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    color: white;
    font-size: 30.4px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transition: all 0.3s ease;
    font-family: 'Patsy', sans-serif;
    padding: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  `;

  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.background = 'rgba(255, 255, 255, 0.5)';
    closeButton.style.transform = 'scale(1.1) rotate(90deg)';
  });

  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.background = 'rgba(255, 255, 255, 0.3)';
    closeButton.style.transform = 'scale(1) rotate(0deg)';
  });

  closeButton.addEventListener('click', () => {
    try {
      playSound('klik');
    } catch (e) {
    }
    hideSkipLevelWindow();
  });

  skipCard.appendChild(closeButton);

  const skipInfo = document.createElement('div');
  skipInfo.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 30px;
    font-size: 30.4px;
    font-weight: bold;
    color: white;
    font-family: 'Patsy', sans-serif;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  `;

  const skipIcon = document.createElement('span');
  skipIcon.textContent = '⏭️';
  skipIcon.style.cssText = 'font-size: 40px;';

  const skipText = document.createElement('span');
  skipText.textContent = t('SKIP_LEVEL');

  skipInfo.appendChild(skipIcon);
  skipInfo.appendChild(skipText);

  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 100%;
  `;

  const buyButton = document.createElement('button');
  buyButton.style.cssText = `
    padding: 18px 35px;
    font-size: 19px;
    font-weight: bold;
    color: white;
    background: rgba(255, 255, 255, 0.25);
    border: 2px solid rgba(255, 255, 255, 0.8);
    border-radius: 15px;
    cursor: pointer;
    font-family: 'Patsy', sans-serif;
    transition: all 0.3s ease;
    width: 100%;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  `;

  const coinIcon = document.createElement('img');
  coinIcon.src = './monet.png';
  coinIcon.style.cssText = 'width: 24px; height: 24px;';
  buyButton.appendChild(coinIcon);
  buyButton.appendChild(document.createTextNode('800'));

  buyButton.addEventListener('mouseenter', () => {
    buyButton.style.background = 'rgba(255, 255, 255, 0.4)';
    buyButton.style.transform = 'scale(1.05) translateY(-2px)';
    buyButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
  });

  buyButton.addEventListener('mouseleave', () => {
    buyButton.style.background = 'rgba(255, 255, 255, 0.25)';
    buyButton.style.transform = 'scale(1) translateY(0)';
    buyButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
  });

  buyButton.addEventListener('click', async () => {
    try {
      playSound('klik');
    } catch (e) {
    }
    const price = 800;
    if (getTotalCoins() >= price) {
      await spendCoins(price);
      skipLevel();
      hideSkipLevelWindow();
    } else {
      buyButton.style.animation = 'shake 0.5s';
      setTimeout(() => {
        buyButton.style.animation = '';
      }, 500);
    }
  });

  const adButton = document.createElement('button');
  adButton.style.cssText = `
    padding: 18px 35px;
    font-size: 17.1px;
    font-weight: bold;
    color: white;
    background: rgba(255, 255, 255, 0.25);
    border: 2px solid rgba(255, 255, 255, 0.8);
    border-radius: 15px;
    cursor: ${canUseAd ? 'pointer' : 'not-allowed'};
    font-family: 'Patsy', sans-serif;
    transition: all 0.3s ease;
    width: 100%;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    opacity: ${canUseAd ? '1' : '0.5'};
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  `;

  const adIcon = document.createElement('span');
  adIcon.textContent = '🎁';
  adIcon.style.cssText = 'font-size: 24px;';
  adButton.appendChild(adIcon);
  
  if (canUseAd) {
    adButton.appendChild(document.createTextNode(t('SKIP_FOR_AD')));
  } else {
    const lastSkipped = getLastSkippedLevel(Game.currentTheme);
    const levelsRemaining = SKIP_LEVEL_COOLDOWN_LEVELS - (currentLevel - lastSkipped) + 1;
    adButton.appendChild(document.createTextNode(`${t('COOLDOWN')}: ${levelsRemaining} ${t('LEVELS')}`));
  }

  if (canUseAd) {
    adButton.addEventListener('mouseenter', () => {
      adButton.style.background = 'rgba(255, 255, 255, 0.4)';
      adButton.style.transform = 'scale(1.05) translateY(-2px)';
      adButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
    });

    adButton.addEventListener('mouseleave', () => {
      adButton.style.background = 'rgba(255, 255, 255, 0.25)';
      adButton.style.transform = 'scale(1) translateY(0)';
      adButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    });

    adButton.addEventListener('click', async () => {
      try {
        playSound('klik');
      } catch (e) {
      }
      const result = await showRewardedAd('skip_level');
      if (result.rewarded) {
        skipLevelWithAd();
        hideSkipLevelWindow();
      }
    });
  }

  skipCard.appendChild(skipInfo);
  buttonsContainer.appendChild(buyButton);
  buttonsContainer.appendChild(adButton);
  skipCard.appendChild(buttonsContainer);

  skipOverlay.appendChild(skipCard);
  gameRoot.appendChild(skipOverlay);

  skipOverlay.addEventListener('click', (e) => {
    if (e.target === skipOverlay) {
      hideSkipLevelWindow();
    }
  });

  const style = document.createElement('style');
  if (!document.getElementById('skip-level-styles')) {
    style.id = 'skip-level-styles';
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
      }
    `;
    document.head.appendChild(style);
  }

  requestAnimationFrame(() => {
    skipOverlay.style.opacity = '1';
    skipCard.style.animation = 'skipAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
  });

  const appearStyle = document.createElement('style');
  if (!document.getElementById('skip-appear-styles')) {
    appearStyle.id = 'skip-appear-styles';
    appearStyle.textContent = `
      @keyframes skipAppear {
        0% {
          transform: scale(0.3) rotate(-10deg);
          opacity: 0;
        }
        60% {
          transform: scale(1.1) rotate(2deg);
        }
        100% {
          transform: scale(1) rotate(0deg);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(appearStyle);
  }
}

async function skipLevel() {
  if (!Game || !Game.isRunning || !Game.currentTheme) {
    return;
  }

  const nextLevel = Game.currentLevel + 1;
  const theme = Game.currentTheme;
  const total = ImagePool.getTotalImages(theme);
  
  if (nextLevel <= total) {
    setCurrentLevel(theme, nextLevel);
    await updateProgressOnLevelComplete(theme, Game.currentLevel - 1, total);
  }
  
  if (Game.nextLevel) {
    await Game.nextLevel();
  }
}

export async function skipLevelWithAd() {
  if (!Game || !Game.isRunning || !Game.currentTheme) {
    return;
  }

  setLastSkippedLevel(Game.currentTheme, Game.currentLevel);
  
  const nextLevel = Game.currentLevel + 1;
  const theme = Game.currentTheme;
  const total = ImagePool.getTotalImages(theme);
  if (nextLevel <= total) {
    setCurrentLevel(theme, nextLevel);
    await updateProgressOnLevelComplete(theme, Game.currentLevel - 1, total);
  }
  
  if (Game.nextLevel) {
    await Game.nextLevel();
  }
}

export function hideSkipLevelWindow() {
  if (skipOverlay) {
    skipOverlay.style.opacity = '0';
    skipOverlay.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      if (skipOverlay) {
        skipOverlay.remove();
        skipOverlay = null;
      }
      if (Game) {
        Game.inputBlocked = false;
      }
    }, 300);
  } else {
    if (Game) {
      Game.inputBlocked = false;
    }
  }
}

if (typeof window !== 'undefined') {
  window.showSkipLevelWindow = showSkipLevelWindow;
}

