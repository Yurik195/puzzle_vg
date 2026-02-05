import { t } from './localization.js';
import { getTotalCoins, spendCoins } from './coins.js';
import { initializeProgress, markThemeAsVisited } from './progress.js';
import ThemeManifests from './theme_manifests.js';
import { isThemeUnlocked, unlockTheme, getThemePrice, isCoinsTheme, isAdTheme, isDoubleAdTheme, getThemeAdProgress, incrementThemeAdProgress } from './theme_unlock.js';
import { THEMES } from './themes.js';
import { playSound } from './audio.js';
import { createDailyRewardsButton, updateDailyRewardsDisplay } from './daily_rewards.js';
import { createGiftsContainer, updateGiftsDisplay, checkGift2Ad } from './gifts.js';
import { showRewardedAd } from './ads_yandex.js';
import { showSettingsWindow } from './settings_ui.js';
import { getIsPortraitMode } from './scale.js';
import ImagePool from './image_pool.js';
import { isVKAvailable, shareGame, openVKCommunity } from './vk_integration.js';

let menuContainer = null;
let onThemeSelectedCallback = null;
let isVisible = false;
let coinsDisplayElement = null;
let themeItems = new Map();

function getSortedThemes() {
  return [...THEMES];
}

async function rebuildThemeList() {
  const themeList = document.getElementById('theme-list');
  if (!themeList) return;
  
  themeList.innerHTML = '';
  themeItems.clear();
  
  const sortedThemes = getSortedThemes();
  for (const theme of sortedThemes) {
    const themeItem = await createThemeItem(theme);
    themeList.appendChild(themeItem);
    themeItems.set(theme.id, themeItem);
  }
  
  for (const theme of THEMES) {
    await updateThemeProgress(theme.id);
  }
}

export async function initMainMenu(rootElement, onThemeSelected) {
  onThemeSelectedCallback = onThemeSelected;
  
  menuContainer = document.createElement('div');
  menuContainer.id = 'main-menu';
  menuContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 100;
    overflow: hidden;
  `;

  const background = document.createElement('div');
  background.style.cssText = `
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    z-index: -1;
  `;
  menuContainer.appendChild(background);

  const topBar = document.createElement('div');
  topBar.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 80px;
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 0 30px;
    box-sizing: border-box;
    z-index: 10;
  `;

  coinsDisplayElement = document.createElement('div');
  coinsDisplayElement.id = 'menu-coins-display';
  coinsDisplayElement.style.cssText = `
    color: white;
    font-size: 24px;
    font-weight: bold;
    font-family: 'Patsy', sans-serif;
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid white;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  updateCoinsDisplay();
  topBar.appendChild(coinsDisplayElement);

  const dailyRewardsButton = createDailyRewardsButton();
  topBar.appendChild(dailyRewardsButton);

  const rightContainer = document.createElement('div');
  rightContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 15px;
    margin-left: auto;
  `;

  const settingsButton = document.createElement('button');
  settingsButton.textContent = '⚙️';
  settingsButton.style.cssText = `
    padding: 12px 24px;
    font-size: 22.8px;
    font-weight: bold;
    color: white;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid white;
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Patsy', sans-serif;
    transition: all 0.3s;
  `;

  settingsButton.addEventListener('mouseenter', () => {
    settingsButton.style.background = 'rgba(255, 255, 255, 0.4)';
    settingsButton.style.transform = 'scale(1.05)';
  });

  settingsButton.addEventListener('mouseleave', () => {
    settingsButton.style.background = 'rgba(255, 255, 255, 0.2)';
    settingsButton.style.transform = 'scale(1)';
  });

  settingsButton.addEventListener('click', () => {
    try {
      playSound('klik');
    } catch (e) {
    }
    showSettingsWindow();
  });

  rightContainer.appendChild(settingsButton);
  topBar.appendChild(rightContainer);
  menuContainer.appendChild(topBar);

  const giftsContainer = createGiftsContainer();
  menuContainer.appendChild(giftsContainer);

  // VK кнопки (только для VK платформы)
  if (isVKAvailable()) {
    // Кнопка "Поделиться" слева внизу
    const shareButton = document.createElement('button');
    shareButton.innerHTML = '📤';
    shareButton.title = 'Поделиться';
    shareButton.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      padding: 15px 20px;
      font-size: 24px;
      color: white;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid white;
      border-radius: 12px;
      cursor: pointer;
      font-family: 'Patsy', sans-serif;
      transition: all 0.3s;
      z-index: 10;
    `;
    
    shareButton.addEventListener('mouseenter', () => {
      shareButton.style.background = 'rgba(255, 255, 255, 0.4)';
      shareButton.style.transform = 'scale(1.05)';
    });
    
    shareButton.addEventListener('mouseleave', () => {
      shareButton.style.background = 'rgba(255, 255, 255, 0.2)';
      shareButton.style.transform = 'scale(1)';
    });
    
    shareButton.addEventListener('click', async () => {
      try {
        playSound('klik');
      } catch (e) {}
      await shareGame();
    });
    
    menuContainer.appendChild(shareButton);
    
    // Кнопка "Сообщество" справа внизу
    const communityButton = document.createElement('button');
    communityButton.innerHTML = '👥';
    communityButton.title = 'Сообщество';
    communityButton.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      padding: 15px 20px;
      font-size: 24px;
      color: white;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid white;
      border-radius: 12px;
      cursor: pointer;
      font-family: 'Patsy', sans-serif;
      transition: all 0.3s;
      z-index: 10;
    `;
    
    communityButton.addEventListener('mouseenter', () => {
      communityButton.style.background = 'rgba(255, 255, 255, 0.4)';
      communityButton.style.transform = 'scale(1.05)';
    });
    
    communityButton.addEventListener('mouseleave', () => {
      communityButton.style.background = 'rgba(255, 255, 255, 0.2)';
      communityButton.style.transform = 'scale(1)';
    });
    
    communityButton.addEventListener('click', () => {
      try {
        playSound('klik');
      } catch (e) {}
      openVKCommunity();
    });
    
    menuContainer.appendChild(communityButton);
  }

  const scrollContainer = document.createElement('div');
  const isPortrait = getIsPortraitMode();
  const basePadding = 20;
  const baseMaxHeight = 100;
  const portraitMaxHeight = baseMaxHeight * 1.68;
  const portraitHeight = portraitMaxHeight;
  const portraitPaddingTop = basePadding * 2.744;
  const portraitPaddingBottom = basePadding * 2.744;
  
  scrollContainer.className = 'main-menu-scroll-container scroll-container';
  scrollContainer.style.cssText = `
    width: 100%;
    max-width: 510px;
    ${isPortrait ? `height: ${portraitHeight}vh;` : ''}
    max-height: ${isPortrait ? portraitMaxHeight + 'vh' : baseMaxHeight + 'vh'};
    margin-top: ${isPortrait ? '0vh' : '2vh'};
    margin-bottom: ${isPortrait ? '0vh' : '0vh'};
    overflow-y: auto;
    overflow-x: hidden;
    padding-top: ${isPortrait ? portraitPaddingTop + 'px' : basePadding + 'px'};
    padding-bottom: ${isPortrait ? portraitPaddingBottom + 'px' : basePadding + 'px'};
    padding-left: ${basePadding}px;
    padding-right: ${basePadding}px;
    box-sizing: border-box;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    overscroll-behavior: contain;
  `;
  
  const scrollStyle = document.createElement('style');
  scrollStyle.textContent = `
    #main-menu .scroll-container::-webkit-scrollbar {
      width: 12px;
    }
    #main-menu .scroll-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }
    #main-menu .scroll-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.4);
      border-radius: 10px;
      border: 2px solid rgba(255, 255, 255, 0.1);
    }
    #main-menu .scroll-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.6);
    }
    #main-menu .scroll-container {
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.4) rgba(255, 255, 255, 0.1);
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
      20%, 40%, 60%, 80% { transform: translateX(10px); }
    }
  `;
  document.head.appendChild(scrollStyle);

  const themeList = document.createElement('div');
  themeList.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  `;

  const sortedThemes = getSortedThemes();
  for (const theme of sortedThemes) {
    const themeItem = await createThemeItem(theme);
    themeList.appendChild(themeItem);
    themeItems.set(theme.id, themeItem);
  }
  
  for (const theme of THEMES) {
    await updateThemeProgress(theme.id);
  }

  scrollContainer.appendChild(themeList);
  menuContainer.appendChild(scrollContainer);

  rootElement.appendChild(menuContainer);
  
  hideMenu();
}

async function createThemeItem(theme) {
  const item = document.createElement('div');
  item.style.cssText = `
    position: relative;
    display: flex;
    align-items: center;
    padding: 20px 30px;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 15px;
    cursor: pointer;
    transition: all 0.3s;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  `;

  const progressBadge = document.createElement('div');
  progressBadge.className = 'progress-badge';
  progressBadge.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(76, 175, 80, 0.9);
    color: white;
    font-size: 14px;
    font-weight: bold;
    font-family: 'Patsy', sans-serif;
    padding: 4px 10px;
    border-radius: 12px;
    border: 2px solid rgba(255, 255, 255, 0.8);
    z-index: 5;
  `;
  item.appendChild(progressBadge);

  const newLevelsBadge = document.createElement('div');
  newLevelsBadge.className = 'new-levels-badge';
  newLevelsBadge.textContent = '+ новые уровни';
  newLevelsBadge.style.cssText = `
    position: absolute;
    top: 8px;
    right: 100px;
    background: rgba(255, 152, 0, 0.9);
    color: white;
    font-size: 12px;
    font-weight: bold;
    font-family: 'Patsy', sans-serif;
    padding: 4px 10px;
    border-radius: 12px;
    border: 2px solid rgba(255, 255, 255, 0.8);
    z-index: 5;
    display: none;
    white-space: nowrap;
  `;
  item.appendChild(newLevelsBadge);

  const emoji = document.createElement('div');
  emoji.textContent = theme.emoji;
  emoji.style.cssText = `
    font-size: 36px;
    margin-right: 20px;
    flex-shrink: 0;
  `;
  item.appendChild(emoji);

  const name = document.createElement('div');
  name.textContent = theme.title;
  name.style.cssText = `
    color: white;
    font-size: 24px;
    font-weight: bold;
    font-family: 'Patsy', sans-serif;
    flex: 1;
  `;
  item.appendChild(name);

  let unlocked = false;
  try {
    unlocked = await isThemeUnlocked(theme.id);
  } catch (e) {
    console.error('Error checking theme unlock status:', e);
  }
  
  if (!unlocked) {
    const lockOverlay = document.createElement('div');
    lockOverlay.className = 'lock-overlay';
    lockOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      backdrop-filter: blur(2px);
    `;
    
    const lockContent = document.createElement('div');
    lockContent.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    `;
    
    const lockIconContainer = document.createElement('div');
    lockIconContainer.style.cssText = `
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const lockIcon = document.createElement('div');
    lockIcon.textContent = '🔒';
    lockIcon.style.cssText = `
      font-size: 48px;
    `;
    lockIconContainer.appendChild(lockIcon);
    
    if (isAdTheme(theme.id)) {
      const adIcon = document.createElement('div');
      adIcon.className = 'lock-ad-icon';
      adIcon.style.cssText = `
        position: absolute;
        bottom: -5px;
        right: -5px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      `;
      
      const filmIcon = document.createElement('span');
      filmIcon.textContent = '🎞️';
      filmIcon.style.cssText = 'font-size: 20px;';
      adIcon.appendChild(filmIcon);
      
      const adText = document.createElement('span');
      adText.textContent = 'AD';
      adText.style.cssText = `
        position: absolute;
        font-size: 8px;
        font-weight: bold;
        color: white;
        font-family: 'Patsy', sans-serif;
        text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      `;
      adIcon.appendChild(adText);
      lockIconContainer.appendChild(adIcon);
    } else if (isDoubleAdTheme(theme.id)) {
      const progress = await getThemeAdProgress(theme.id);
      const remaining = 2 - progress;
      
      const adIconsContainer = document.createElement('div');
      adIconsContainer.className = 'lock-ad-icons';
      adIconsContainer.style.cssText = `
        position: absolute;
        bottom: -8px;
        right: -8px;
        display: flex;
        gap: 4px;
        align-items: center;
        justify-content: center;
      `;
      
      for (let i = 0; i < remaining; i++) {
        const adIcon = document.createElement('div');
        adIcon.className = 'lock-ad-icon';
        adIcon.style.cssText = `
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        `;
        
        const filmIcon = document.createElement('span');
        filmIcon.textContent = '🎞️';
        filmIcon.style.cssText = 'font-size: 18px;';
        adIcon.appendChild(filmIcon);
        
        const adText = document.createElement('span');
        adText.textContent = 'AD';
        adText.style.cssText = `
          position: absolute;
          font-size: 7px;
          font-weight: bold;
          color: white;
          font-family: 'Patsy', sans-serif;
          text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        `;
        adIcon.appendChild(adText);
        adIconsContainer.appendChild(adIcon);
      }
      lockIconContainer.appendChild(adIconsContainer);
    }
    
    lockContent.appendChild(lockIconContainer);
    
    // Текст только для тем с монетами
    if (isCoinsTheme(theme.id)) {
      const lockText = document.createElement('div');
      lockText.style.cssText = `
        color: white;
        font-size: 18px;
        font-weight: bold;
        font-family: 'Patsy', sans-serif;
        text-align: center;
        margin-top: 10px;
      `;
      const price = await getThemePrice(theme.id);
      lockText.innerHTML = `<div>${price} <img src="./monet.png" style="width: 20px; height: 20px; vertical-align: middle;" /></div>`;
      lockContent.appendChild(lockText);
    }
    lockOverlay.appendChild(lockContent);
    item.appendChild(lockOverlay);
    
    item.style.cursor = 'pointer';
    item.style.opacity = '0.7';
  }

  item.addEventListener('mouseenter', () => {
    if (!item.classList.contains('active')) {
      item.style.background = 'rgba(255, 255, 255, 0.3)';
      item.style.transform = 'scale(1.02)';
    }
  });

  item.addEventListener('mouseleave', () => {
    if (!item.classList.contains('active')) {
      item.style.background = 'rgba(255, 255, 255, 0.2)';
      item.style.transform = 'scale(1)';
    }
  });

  item.addEventListener('mousedown', () => {
    item.classList.add('active');
    item.style.background = 'rgba(255, 255, 255, 0.4)';
  });

  item.addEventListener('mouseup', () => {
    item.classList.remove('active');
    item.style.background = 'rgba(255, 255, 255, 0.2)';
  });

  let touchStartY = 0;
  let touchMoved = false;

  item.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchMoved = false;
    item.classList.add('active');
    item.style.background = 'rgba(255, 255, 255, 0.4)';
  });

  item.addEventListener('touchmove', (e) => {
    if (Math.abs(e.touches[0].clientY - touchStartY) > 10) {
      touchMoved = true;
      item.classList.remove('active');
      item.style.background = 'rgba(255, 255, 255, 0.2)';
    }
  });

  item.addEventListener('touchend', async (e) => {
    if (!touchMoved) {
      e.preventDefault();
    }
    item.classList.remove('active');
    item.style.background = 'rgba(255, 255, 255, 0.2)';
    
    if (touchMoved) {
      return;
    }
    
    const unlocked = await isThemeUnlocked(theme.id);
    
    if (!unlocked) {
      if (isCoinsTheme(theme.id)) {
        const price = await getThemePrice(theme.id);
        const coins = getTotalCoins();
        
        if (coins >= price) {
          const spent = await spendCoins(price);
          if (spent) {
            await unlockTheme(theme.id);
            updateCoinsDisplay();
            const lockOverlay = item.querySelector('.lock-overlay');
            if (lockOverlay) {
              lockOverlay.remove();
            }
            item.style.opacity = '1';
            
            if (onThemeSelectedCallback) {
              onThemeSelectedCallback(theme.id);
            }
          }
        } else {
          item.style.animation = 'shake 0.5s';
          setTimeout(() => {
            item.style.animation = '';
          }, 500);
        }
      } else if (isAdTheme(theme.id)) {
        showAdUnlockDialog(theme.id, item);
      } else if (isDoubleAdTheme(theme.id)) {
        showDoubleAdUnlockDialog(theme.id, item);
      }
      return;
    }
    
    try {
      await ImagePool.initialize(theme.id);
      const total = ImagePool.getTotalImages(theme.id);
      markThemeAsVisited(theme.id, total);
      updateThemeProgress(theme.id);
    } catch (error) {
      console.error('Failed to initialize ImagePool:', error);
    }
    
    if (onThemeSelectedCallback) {
      onThemeSelectedCallback(theme.id);
    }
  });

  item.addEventListener('click', async () => {
    try {
      playSound('klik');
    } catch (e) {
    }
    const unlocked = await isThemeUnlocked(theme.id);
    
    if (!unlocked) {
      if (isCoinsTheme(theme.id)) {
        const price = await getThemePrice(theme.id);
        const coins = getTotalCoins();
        
        if (coins >= price) {
          const spent = await spendCoins(price);
          if (spent) {
            await unlockTheme(theme.id);
            updateCoinsDisplay();
            const lockOverlay = item.querySelector('.lock-overlay');
            if (lockOverlay) {
              lockOverlay.remove();
            }
            item.style.opacity = '1';
            
            if (onThemeSelectedCallback) {
              onThemeSelectedCallback(theme.id);
            }
          }
        } else {
          item.style.animation = 'shake 0.5s';
          setTimeout(() => {
            item.style.animation = '';
          }, 500);
        }
      } else if (isAdTheme(theme.id)) {
        showAdUnlockDialog(theme.id, item);
      } else if (isDoubleAdTheme(theme.id)) {
        showDoubleAdUnlockDialog(theme.id, item);
      }
      return;
    }
    
    try {
      await ImagePool.initialize(theme.id);
      const total = ImagePool.getTotalImages(theme.id);
      markThemeAsVisited(theme.id, total);
      updateThemeProgress(theme.id);
    } catch (error) {
      console.error('Failed to initialize ImagePool:', error);
    }
    
    if (onThemeSelectedCallback) {
      onThemeSelectedCallback(theme.id);
    }
  });

  return item;
}

function updateCoinsDisplay() {
  if (coinsDisplayElement) {
    const coins = getTotalCoins();
    coinsDisplayElement.innerHTML = '';
    const coinIcon = document.createElement('img');
    coinIcon.src = './monet.png';
    coinIcon.style.cssText = 'width: 24px; height: 24px;';
    coinsDisplayElement.appendChild(coinIcon);
    const coinText = document.createElement('span');
    coinText.textContent = coins;
    coinsDisplayElement.appendChild(coinText);
  }
}

async function updateThemeLockOverlay(themeItem, themeId) {
  const lockOverlay = themeItem.querySelector('.lock-overlay');
  if (!lockOverlay) return;
  
  const unlocked = await isThemeUnlocked(themeId);
  if (unlocked) {
    lockOverlay.remove();
    themeItem.style.opacity = '1';
    return;
  }
  
  if (isDoubleAdTheme(themeId)) {
    const progress = await getThemeAdProgress(themeId);
    const remaining = 2 - progress;
    
    const adIconsContainer = lockOverlay.querySelector('.lock-ad-icons');
    if (adIconsContainer) {
      adIconsContainer.innerHTML = '';
      
      for (let i = 0; i < remaining; i++) {
        const adIcon = document.createElement('div');
        adIcon.className = 'lock-ad-icon';
        adIcon.style.cssText = `
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        `;
        
        const filmIcon = document.createElement('span');
        filmIcon.textContent = '🎞️';
        filmIcon.style.cssText = 'font-size: 18px;';
        adIcon.appendChild(filmIcon);
        
        const adText = document.createElement('span');
        adText.textContent = 'AD';
        adText.style.cssText = `
          position: absolute;
          font-size: 7px;
          font-weight: bold;
          color: white;
          font-family: 'Patsy', sans-serif;
          text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        `;
        adIcon.appendChild(adText);
        adIconsContainer.appendChild(adIcon);
      }
    }
    
    // Текст не нужен для тем с рекламой
  }
}

async function updateThemeProgress(themeId) {
  const themeItem = themeItems.get(themeId);
  if (!themeItem) return;

  try {
    const total = ThemeManifests.getTotalImages(themeId);
    if (total === 0) {
      return;
    }
    
    const progress = await initializeProgress(themeId, total);

    const progressBadge = themeItem.querySelector('.progress-badge');
    if (progressBadge) {
      progressBadge.textContent = `${progress.completed} / ${progress.currentTotal}`;
    }

    const newLevelsBadge = themeItem.querySelector('.new-levels-badge');
    if (newLevelsBadge) {
      if (progress.hasNewLevels) {
        newLevelsBadge.style.display = 'block';
      } else {
        newLevelsBadge.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Failed to update theme progress:', error);
  }
}

function showAdUnlockDialog(themeId, themeItem) {
  const gameRoot = document.getElementById('game-root');
  if (!gameRoot) return;

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.98) 0%, rgba(255, 140, 0, 0.98) 100%);
    border-radius: 20px;
    padding: 40px;
    min-width: 300px;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    border: 3px solid rgba(255, 255, 255, 0.5);
  `;

  const title = document.createElement('div');
  title.textContent = t('OPEN_THEME');
  title.style.cssText = `
    font-size: 28px;
    font-weight: bold;
    color: white;
    margin-bottom: 20px;
    font-family: 'Patsy', sans-serif;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  `;
  dialog.appendChild(title);

  const text = document.createElement('div');
  text.textContent = t('WATCH_AD_TO_UNLOCK');
  text.style.cssText = `
    font-size: 18px;
    color: white;
    margin-bottom: 30px;
    font-family: 'Patsy', sans-serif;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  `;
  dialog.appendChild(text);

  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 15px;
  `;

  const watchAdButton = document.createElement('button');
  watchAdButton.textContent = t('WATCH_AD');
  watchAdButton.style.cssText = `
    padding: 15px 30px;
    font-size: 20px;
    font-weight: bold;
    color: white;
    background: rgba(255, 255, 255, 0.25);
    border: 2px solid rgba(255, 255, 255, 0.8);
    border-radius: 15px;
    cursor: pointer;
    font-family: 'Patsy', sans-serif;
    transition: all 0.3s ease;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  `;

  watchAdButton.addEventListener('mouseenter', () => {
    watchAdButton.style.background = 'rgba(255, 255, 255, 0.4)';
    watchAdButton.style.transform = 'scale(1.05)';
  });

  watchAdButton.addEventListener('mouseleave', () => {
    watchAdButton.style.background = 'rgba(255, 255, 255, 0.25)';
    watchAdButton.style.transform = 'scale(1)';
  });

  watchAdButton.addEventListener('click', async () => {
    try {
      playSound('klik');
    } catch (e) {
    }
    console.log('Показ рекламы для темы:', themeId);
    
    const result = await showRewardedAd('theme_unlock');
    if (result.rewarded) {
      await unlockTheme(themeId);
      const lockOverlay = themeItem.querySelector('.lock-overlay');
      if (lockOverlay) {
        lockOverlay.remove();
      }
      themeItem.style.opacity = '1';
      
      overlay.remove();
      
      if (onThemeSelectedCallback) {
        onThemeSelectedCallback(themeId);
      }
    } else {
      overlay.remove();
    }
  });

  buttonsContainer.appendChild(watchAdButton);

  const cancelButton = document.createElement('button');
  cancelButton.textContent = t('CANCEL');
  cancelButton.style.cssText = `
    padding: 12px 30px;
    font-size: 18px;
    font-weight: bold;
    color: white;
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.6);
    border-radius: 15px;
    cursor: pointer;
    font-family: 'Patsy', sans-serif;
    transition: all 0.3s ease;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  `;

  cancelButton.addEventListener('mouseenter', () => {
    cancelButton.style.background = 'rgba(255, 255, 255, 0.25)';
  });

  cancelButton.addEventListener('mouseleave', () => {
    cancelButton.style.background = 'rgba(255, 255, 255, 0.15)';
  });

  cancelButton.addEventListener('click', () => {
    try {
      playSound('klik');
    } catch (e) {
    }
    overlay.remove();
  });

  buttonsContainer.appendChild(cancelButton);
  dialog.appendChild(buttonsContainer);
  overlay.appendChild(dialog);
  gameRoot.appendChild(overlay);
}

async function showDoubleAdUnlockDialog(themeId, themeItem) {
  const gameRoot = document.getElementById('game-root');
  if (!gameRoot) return;

  const progress = await getThemeAdProgress(themeId);
  const remaining = 2 - progress;

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.98) 0%, rgba(255, 140, 0, 0.98) 100%);
    border-radius: 20px;
    padding: 40px;
    min-width: 300px;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    border: 3px solid rgba(255, 255, 255, 0.5);
  `;

  const title = document.createElement('div');
  title.textContent = t('OPEN_THEME');
  title.style.cssText = `
    font-size: 26.6px;
    font-weight: bold;
    color: white;
    margin-bottom: 20px;
    font-family: 'Patsy', sans-serif;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  `;
  dialog.appendChild(title);

  const camerasDisplay = document.createElement('div');
  camerasDisplay.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin-bottom: 20px;
  `;
  
  for (let i = 0; i < remaining; i++) {
    const filmIcon = document.createElement('div');
    filmIcon.style.cssText = `
      font-size: 48px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    filmIcon.textContent = '🎞️';
    
    const adText = document.createElement('div');
    adText.textContent = 'AD';
    adText.style.cssText = `
      position: absolute;
      font-size: 18px;
      font-weight: bold;
      color: white;
      font-family: 'Patsy', sans-serif;
      text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    `;
    filmIcon.appendChild(adText);
    camerasDisplay.appendChild(filmIcon);
  }
  dialog.appendChild(camerasDisplay);

  const text = document.createElement('div');
  const lang = (await import('./localization.js')).getLang();
  const adText = lang === 'ru' 
    ? `Просмотрите ${remaining} реклам${remaining === 1 ? 'у' : remaining === 2 ? 'ы' : ''} для разблокировки`
    : `Watch ${remaining} ad${remaining === 1 ? '' : 's'} to unlock`;
  text.textContent = adText;
  text.style.cssText = `
    font-size: 17.1px;
    color: white;
    margin-bottom: 30px;
    font-family: 'Patsy', sans-serif;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  `;
  dialog.appendChild(text);

  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 15px;
  `;

  const watchAdButton = document.createElement('button');
  watchAdButton.textContent = t('WATCH_AD');
  watchAdButton.style.cssText = `
    padding: 15px 30px;
    font-size: 19px;
    font-weight: bold;
    color: white;
    background: rgba(255, 255, 255, 0.25);
    border: 2px solid rgba(255, 255, 255, 0.8);
    border-radius: 15px;
    cursor: pointer;
    font-family: 'Patsy', sans-serif;
    transition: all 0.3s ease;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  `;

  watchAdButton.addEventListener('mouseenter', () => {
    watchAdButton.style.background = 'rgba(255, 255, 255, 0.4)';
    watchAdButton.style.transform = 'scale(1.05)';
  });

  watchAdButton.addEventListener('mouseleave', () => {
    watchAdButton.style.background = 'rgba(255, 255, 255, 0.25)';
    watchAdButton.style.transform = 'scale(1)';
  });

  watchAdButton.addEventListener('click', async () => {
    try {
      playSound('klik');
    } catch (e) {
    }
    
    const result = await showRewardedAd('theme_unlock_double');
    if (result.rewarded) {
      const unlocked = await incrementThemeAdProgress(themeId);
      
      if (unlocked) {
        const lockOverlay = themeItem.querySelector('.lock-overlay');
        if (lockOverlay) {
          lockOverlay.remove();
        }
        themeItem.style.opacity = '1';
        overlay.remove();
        
        if (onThemeSelectedCallback) {
          onThemeSelectedCallback(themeId);
        }
      } else {
        overlay.remove();
        await updateThemeLockOverlay(themeItem, themeId);
      }
    } else {
      overlay.remove();
    }
  });

  buttonsContainer.appendChild(watchAdButton);

  const cancelButton = document.createElement('button');
  cancelButton.textContent = t('CANCEL');
  cancelButton.style.cssText = `
    padding: 12px 30px;
    font-size: 17.1px;
    font-weight: bold;
    color: white;
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.6);
    border-radius: 15px;
    cursor: pointer;
    font-family: 'Patsy', sans-serif;
    transition: all 0.3s ease;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  `;

  cancelButton.addEventListener('mouseenter', () => {
    cancelButton.style.background = 'rgba(255, 255, 255, 0.25)';
  });

  cancelButton.addEventListener('mouseleave', () => {
    cancelButton.style.background = 'rgba(255, 255, 255, 0.15)';
  });

  cancelButton.addEventListener('click', () => {
    try {
      playSound('klik');
    } catch (e) {
    }
    overlay.remove();
  });

  buttonsContainer.appendChild(cancelButton);
  dialog.appendChild(buttonsContainer);
  overlay.appendChild(dialog);
  gameRoot.appendChild(overlay);
}

export async function showMenu() {
  if (menuContainer) {
    menuContainer.style.display = 'flex';
    isVisible = true;
    updateCoinsDisplay();
    updateDailyRewardsDisplay();
    updateGiftsDisplay();
    await checkGift2Ad();
    for (const theme of THEMES) {
      await updateThemeProgress(theme.id);
    }
  }
}

export function hideMenu() {
  if (menuContainer) {
    menuContainer.style.display = 'none';
    isVisible = false;
  }
}

export function isMenuVisible() {
  return isVisible;
}







