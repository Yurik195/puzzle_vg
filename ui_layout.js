import { t, getLang } from './localization.js';
import { setCoinsDisplayElement } from './coins.js';
import { playSound } from './audio.js';
import { getHintsCount } from './hints.js';
import { showHintsPurchaseWindow } from './hints_purchase.js';

let statusTextElement = null;
let menuButtonCallback = null;
let gameUI = null;

export function initLayout(rootElement) {
  if (!rootElement) {
    console.error('rootElement is null');
    return;
  }
  
  try {
    rootElement.innerHTML = '';
    
    const background = document.createElement('div');
    background.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      z-index: 0;
    `;
    rootElement.appendChild(background);
  } catch (e) {
    console.error('Failed to create background:', e);
    rootElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }
  
  gameUI = document.createElement('div');
  gameUI.id = 'game-ui';
  gameUI.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
  `;
  
  const topPanel = document.createElement('div');
  topPanel.className = 'top-bar';
  topPanel.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 80px;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    padding: 0 40px;
    box-sizing: border-box;
    z-index: 10;
  `;
  
  const leftContainer = document.createElement('div');
  leftContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 15px;
  `;
  
  const menuButton = createButton(t('MENU'), () => {
    if (menuButtonCallback) {
      menuButtonCallback();
    }
  });
  leftContainer.appendChild(menuButton);
  
  const coinsDisplay = document.createElement('div');
  coinsDisplay.id = 'coins-display';
  coinsDisplay.style.cssText = `
    color: white;
    font-size: 19px;
    font-weight: bold;
    font-family: 'Patsy', sans-serif;
    padding: 12px 24px;
    background: rgba(255, 215, 0, 0.1);
    border: 1px dashed rgba(255, 215, 0, 0.6);
    border-radius: 15px;
    display: flex;
    align-items: center;
    gap: 8px;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  `;
  const coinIcon = document.createElement('img');
  coinIcon.src = './monet.png';
  coinIcon.style.cssText = 'width: 24px; height: 24px;';
  coinsDisplay.appendChild(coinIcon);
  const coinText = document.createElement('span');
  coinText.textContent = '0';
  coinsDisplay.appendChild(coinText);
  leftContainer.appendChild(coinsDisplay);
  setCoinsDisplayElement(coinsDisplay);
  
  topPanel.appendChild(leftContainer);
  
  const centerContainer = document.createElement('div');
  centerContainer.style.cssText = `
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 15px;
    z-index: 1;
  `;
  
  const skipLevelButton = document.createElement('button');
  skipLevelButton.textContent = '⏭️';
  skipLevelButton.id = 'skip-level-button';
  skipLevelButton.style.cssText = `
    padding: 8px 12px;
    font-size: 22.8px;
    font-weight: bold;
    color: white;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid white;
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Patsy', sans-serif;
    transition: all 0.3s;
    position: relative;
    z-index: 10;
    pointer-events: auto;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  `;
  
  skipLevelButton.addEventListener('mouseenter', () => {
    skipLevelButton.style.background = 'rgba(255, 255, 255, 0.4)';
    skipLevelButton.style.transform = 'scale(1.05)';
  });
  
  skipLevelButton.addEventListener('mouseleave', () => {
    skipLevelButton.style.background = 'rgba(255, 255, 255, 0.2)';
    skipLevelButton.style.transform = 'scale(1)';
  });
  
  skipLevelButton.addEventListener('click', () => {
    try {
      playSound('klik');
    } catch (e) {
    }
    if (window.Game && window.Game.isRunning) {
      if (window.showSkipLevelWindow) {
        window.showSkipLevelWindow();
      }
    }
  });
  
  centerContainer.appendChild(skipLevelButton);
  
  const title = document.createElement('div');
  title.id = 'level-title';
  title.textContent = `${t('LEVEL')} 1`;
  title.style.cssText = `
    color: white;
    font-size: 25.84px;
    font-weight: bold;
    font-family: 'Patsy', sans-serif;
    pointer-events: none;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  `;
  centerContainer.appendChild(title);
  
  topPanel.appendChild(centerContainer);
  
  const rightContainer = document.createElement('div');
  rightContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 15px;
    margin-left: auto;
    position: relative;
    z-index: 2;
  `;
  
  const hintButtonContainer = document.createElement('div');
  hintButtonContainer.id = 'hint-button-container';
  hintButtonContainer.style.cssText = `
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  const hintButton = document.createElement('button');
  hintButton.id = 'hint-button';
  hintButton.textContent = '🔍';
  hintButton.style.cssText = `
    padding: 11.4px 22.8px;
    font-size: 26.6px;
    font-weight: bold;
    color: white;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid white;
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Patsy', sans-serif;
    transition: all 0.3s;
    position: relative;
    z-index: 10;
    pointer-events: auto;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 57px;
    min-height: 47.5px;
  `;
  
  hintButton.addEventListener('mouseenter', () => {
    if (!hintButton.disabled) {
      hintButton.style.background = 'rgba(255, 255, 255, 0.4)';
      hintButton.style.transform = 'scale(1.05)';
    }
  });
  
  hintButton.addEventListener('mouseleave', () => {
    if (!hintButton.disabled) {
      hintButton.style.background = 'rgba(255, 255, 255, 0.2)';
      hintButton.style.transform = 'scale(1)';
    }
  });
  
  hintButton.addEventListener('click', async () => {
    try {
      playSound('klik');
    } catch (e) {
    }
    if (!hintButton.disabled) {
      const { getHintsCount } = await import('./hints.js');
      const hintsCount = await getHintsCount();
      if (hintsCount === 0) {
        showHintsPurchaseWindow();
      } else {
        if (window.Game && window.Game.puzzle) {
          await window.Game.puzzle.showHint();
        }
      }
    }
  });
  
  const hintsDisplay = document.createElement('div');
  hintsDisplay.id = 'hints-display';
  hintsDisplay.style.cssText = `
    position: absolute;
    bottom: -8px;
    right: -8px;
    color: white;
    font-size: 16px;
    font-weight: bold;
    font-family: 'Patsy', sans-serif;
    background: rgba(255, 215, 0, 0.9);
    border: 2px solid rgba(255, 215, 0, 1);
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: none;
    align-items: center;
    justify-content: center;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
    z-index: 11;
  `;
  
  hintButtonContainer.appendChild(hintButton);
  hintButtonContainer.appendChild(hintsDisplay);
  rightContainer.appendChild(hintButtonContainer);
  
  const restartButton = createButton(t('RESTART'), () => {
    if (window.Game) {
      window.Game.reset();
    }
  });
  rightContainer.appendChild(restartButton);
  
  topPanel.appendChild(rightContainer);
  
  gameUI.appendChild(topPanel);
  
  const gameArea = document.createElement('div');
  gameArea.id = 'game-area';
  gameArea.style.cssText = `
    position: absolute;
    top: 100px;
    left: 40px;
    right: 40px;
    bottom: 100px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    z-index: 5;
  `;
  gameUI.appendChild(gameArea);
  
  const bottomPanel = document.createElement('div');
  bottomPanel.className = 'bottom-panel';
  bottomPanel.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 60px;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  `;
  
  statusTextElement = document.createElement('div');
  statusTextElement.textContent = '';
  statusTextElement.style.cssText = `
    color: white;
    font-size: 19px;
    font-family: 'Patsy', sans-serif;
    display: none;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  `;
  bottomPanel.appendChild(statusTextElement);
  
  gameUI.appendChild(bottomPanel);
  rootElement.appendChild(gameUI);
}

export function setMenuButtonCallback(callback) {
  menuButtonCallback = callback;
}

export function showGameUI() {
  if (gameUI) {
    gameUI.style.display = 'block';
  }
}

export function hideGameUI() {
  if (gameUI) {
    gameUI.style.display = 'none';
  }
}

function createButton(text, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.disabled = false;
  button.style.cssText = `
    padding: 12px 24px;
    font-size: 17.1px;
    font-weight: bold;
    color: white;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid white;
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Patsy', sans-serif;
    transition: all 0.3s;
    position: relative;
    z-index: 10;
    pointer-events: auto;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  `;
  
  button.addEventListener('mouseenter', () => {
    if (!button.disabled) {
      button.style.background = 'rgba(255, 255, 255, 0.4)';
      button.style.transform = 'scale(1.05)';
    }
  });
  
  button.addEventListener('mouseleave', () => {
    if (!button.disabled) {
      button.style.background = 'rgba(255, 255, 255, 0.2)';
      button.style.transform = 'scale(1)';
    }
  });
  
  button.addEventListener('click', (e) => {
    if (!button.disabled) {
      try {
        playSound('klik');
      } catch (e) {
      }
      onClick(e);
    }
  });
  
  return button;
}

export function setStatusText(text) {
  if (statusTextElement) {
    if (text) {
      statusTextElement.textContent = text;
      statusTextElement.style.display = 'block';
    } else {
      statusTextElement.textContent = '';
      statusTextElement.style.display = 'none';
    }
  }
}

export function getGameArea() {
  return document.getElementById('game-area');
}

export function setLevelTitle(level) {
  const title = document.getElementById('level-title');
  if (title) {
    title.textContent = `${t('LEVEL')} ${level}`;
  }
}

export function updateHintsDisplay(count) {
  const hintsDisplay = document.getElementById('hints-display');
  if (hintsDisplay) {
    if (count === null || count === undefined) {
      hintsDisplay.style.display = 'none';
      return;
    }
    
    hintsDisplay.style.display = 'flex';
    
    if (count === 0) {
      hintsDisplay.textContent = '+';
      hintsDisplay.style.background = 'rgba(100, 200, 100, 0.9)';
      hintsDisplay.style.border = '2px solid rgba(100, 200, 100, 1)';
    } else {
      hintsDisplay.textContent = count.toString();
      hintsDisplay.style.background = 'rgba(255, 215, 0, 0.9)';
      hintsDisplay.style.border = '2px solid rgba(255, 215, 0, 1)';
    }
  }
  
  const hintButton = document.getElementById('hint-button');
  if (hintButton) {
    hintButton.style.opacity = '1';
    hintButton.style.cursor = 'pointer';
    hintButton.disabled = false;
  }
}

