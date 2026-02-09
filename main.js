import { initLayout, setMenuButtonCallback, showGameUI, hideGameUI } from './ui_layout.js';
import { updateScale } from './scale.js';
import './input.js';
import { initAudio } from './audio.js';
import { Game } from './game_logic.js';
import { initMainMenu, showMenu, hideMenu } from './main_menu.js';
import { initializeCoins } from './coins.js';
import { isFirstRun, markFirstRunComplete, updateLastVisitTime } from './progress.js';
import './skip_level.js';
import { initPlayGamaSDK, applyLanguageOnce, sendGameReadyOnce } from './playgama_sdk.js';
import { initVKBridge, showVKBanner, isVKAvailable } from './vk_integration.js';
import { initializeDailyRewards } from './daily_rewards.js';
import { initializeGifts } from './gifts.js';
import { initializeSettings } from './settings.js';
import { showInterstitialAd } from './ads_interstitial.js';

document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  e.stopPropagation();
  return false;
}, { passive: false, capture: true });

document.addEventListener('selectstart', (e) => {
  e.preventDefault();
  e.stopPropagation();
  return false;
}, { passive: false, capture: true });

document.addEventListener('selectionchange', (e) => {
  if (window.getSelection && window.getSelection().toString().length > 0) {
    window.getSelection().removeAllRanges();
  }
}, { passive: false, capture: true });

document.addEventListener('dragstart', (e) => {
  e.preventDefault();
  e.stopPropagation();
  return false;
}, { passive: false, capture: true });

let longPressTimer = null;
let touchStartY = 0;
let touchStartX = 0;
let isInsideGameRoot = false;

document.addEventListener('touchstart', (e) => {
  const target = e.target;
  isInsideGameRoot = target.closest && target.closest('#game-root') !== null;
  
  if (isInsideGameRoot) {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    
    longPressTimer = setTimeout(() => {
      e.preventDefault();
      e.stopPropagation();
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    }, 500);
  } else {
    e.preventDefault();
    e.stopPropagation();
  }
}, { passive: false, capture: true });

document.addEventListener('touchmove', (e) => {
  if (!isInsideGameRoot) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  
  const target = e.target;
  const stillInsideGameRoot = target.closest && target.closest('#game-root') !== null;
  
  if (!stillInsideGameRoot) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  
  const scrollableElement = target.closest('.main-menu-scroll-container') || 
                            target.closest('.daily-rewards-scroll') ||
                            target.closest('[style*="overflow"]') || 
                            target.closest('.scrollable');
  
  if (scrollableElement) {
    return;
  }
  
  const currentY = e.touches[0].clientY;
  const currentX = e.touches[0].clientX;
  const deltaY = Math.abs(currentY - touchStartY);
  const deltaX = Math.abs(currentX - touchStartX);
  
  if (deltaY > 5 || deltaX > 5) {
    const computedStyle = window.getComputedStyle(target);
    const isElementScrollable = computedStyle.overflow === 'scroll' || 
                                 computedStyle.overflow === 'auto' ||
                                 computedStyle.overflowY === 'scroll' || 
                                 computedStyle.overflowY === 'auto' ||
                                 computedStyle.overflowX === 'scroll' || 
                                 computedStyle.overflowX === 'auto';
    
    if (!isElementScrollable) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
}, { passive: false, capture: true });

document.addEventListener('touchend', (e) => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  
  if (!isInsideGameRoot) {
    e.preventDefault();
    e.stopPropagation();
  }
  isInsideGameRoot = false;
}, { passive: false, capture: true });

document.addEventListener('touchcancel', (e) => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  
  if (!isInsideGameRoot) {
    e.preventDefault();
    e.stopPropagation();
  }
  isInsideGameRoot = false;
}, { passive: false, capture: true });

document.addEventListener('wheel', (e) => {
  const target = e.target;
  const isInsideGameRoot = target.closest && target.closest('#game-root') !== null;
  
  if (!isInsideGameRoot) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  
  const scrollableElement = target.closest('[style*="overflow"]') || 
                            target.closest('.scrollable');
  
  if (!scrollableElement) {
    const computedStyle = window.getComputedStyle(target);
    const isElementScrollable = computedStyle.overflow === 'scroll' || 
                                 computedStyle.overflow === 'auto' ||
                                 computedStyle.overflowY === 'scroll' || 
                                 computedStyle.overflowY === 'auto' ||
                                 computedStyle.overflowX === 'scroll' || 
                                 computedStyle.overflowX === 'auto';
    
    if (!isElementScrollable) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
}, { passive: false, capture: true });

document.body.style.overscrollBehavior = 'none';
document.body.style.overscrollBehaviorY = 'none';
document.body.style.overscrollBehaviorX = 'none';
document.documentElement.style.overscrollBehavior = 'none';
document.documentElement.style.overscrollBehaviorY = 'none';
document.documentElement.style.overscrollBehaviorX = 'none';

window.addEventListener('load', async () => {
  try {
    console.log('Starting initialization...');
    
    try {
      await initPlayGamaSDK();
      applyLanguageOnce();
      // Инициализируем VK Bridge для облачных сохранений
      await initVKBridge();
    } catch (e) {
      console.warn('SDK initialization failed (local dev):', e);
    }
    
    try {
      await initializeSettings();
      console.log('Settings initialized');
    } catch (e) {
      console.warn('Settings initialization failed:', e);
    }
    
    const root = document.getElementById('game-root');
    if (!root) {
      console.error('game-root element not found');
      return;
    }
    console.log('game-root found');
    
    try {
      initLayout(root);
      console.log('Layout initialized');
    } catch (e) {
      console.error('Layout initialization failed:', e);
      return;
    }
    
    try {
      await initializeCoins();
      console.log('Coins system initialized');
    } catch (e) {
      console.warn('Coins initialization failed:', e);
    }
    
    try {
      await initializeDailyRewards();
      console.log('Daily rewards system initialized');
    } catch (e) {
      console.warn('Daily rewards initialization failed:', e);
    }
    
    try {
      await initializeGifts();
      console.log('Gifts system initialized');
    } catch (e) {
      console.warn('Gifts initialization failed:', e);
    }
    
    try {
      initAudio();
      console.log('Audio initialized');
    } catch (e) {
      console.warn('Audio initialization failed:', e);
    }
    
    try {
      updateScale();
      console.log('Scale updated');
    } catch (e) {
      console.warn('Scale update failed:', e);
    }
    
    window.Game = Game;
    
    try {
      await initMainMenu(root, async (theme) => {
        console.log('Theme selected:', theme);
        hideMenu();
        showGameUI();
        try {
          await Game.startWithTheme(theme);
        } catch (e) {
          console.error('Failed to start game:', e);
        }
      });
    } catch (e) {
      console.error('Menu initialization failed:', e);
      return;
    }
    
    setMenuButtonCallback(() => {
      console.log('Menu button clicked');
      hideGameUI();
      showMenu();
    });
    
    try {
      if (await isFirstRun()) {
        await markFirstRunComplete();
      }
      await updateLastVisitTime();
    } catch (e) {
      console.warn('Progress initialization failed:', e);
    }
    
    hideGameUI();
    showMenu();
    
    try {
      sendGameReadyOnce();
    } catch (e) {
      console.warn('Game ready failed:', e);
    }
    
    // Показываем VK баннер внизу экрана (только на VK платформе)
    try {
      if (isVKAvailable()) {
        await showVKBanner();
      }
    } catch (e) {
      console.warn('VK banner failed:', e);
    }
    
    console.log('Jigmerge Puzzles initialized');
  } catch (error) {
    console.error('Initialization error:', error);
    console.error(error.stack);
    
    const root = document.getElementById('game-root');
    if (root) {
      root.innerHTML = `
        <div style="color: white; padding: 20px; text-align: center; font-family: Arial, sans-serif;">
          <h1>Ошибка инициализации</h1>
          <p>${error.message}</p>
          <p>Попробуйте обновить страницу</p>
        </div>
      `;
    }
  }
});

