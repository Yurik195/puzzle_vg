import { setStatusText, setLevelTitle, getGameArea, updateHintsDisplay } from './ui_layout.js';
import { Puzzle } from './puzzle.js';
import { t } from './localization.js';
import { showInterstitialAd } from './ads_interstitial.js';
import { loadSound, playSound } from './audio.js';
import { showCompletionEffect, removeCompletionEffect } from './completion_effect.js';
import { showVictoryScreen, hideVictoryScreen, isVictoryScreenVisible } from './victory_screen.js';
import ImagePool from './image_pool.js';
import { showMenu } from './main_menu.js';
import { addCoinsForLevel, COINS_PER_LEVEL } from './coins.js';
import { getHintsCount } from './hints.js';
import { initializeProgress, updateProgressOnLevelComplete, getCompletedLevels, markThemeAsVisited, markTutorialCompleted } from './progress.js';
import { getThemeById } from './themes.js';
import { showTutorial, hideTutorial, shouldShowTutorial } from './tutorial.js';
import { showLoadingAnimation, hideLoadingAnimation } from './loading_animation.js';

const LEVEL_STORAGE_PREFIX = 'jigmerge_level_';
const DIFFICULTY_STORAGE_PREFIX = 'jigmerge_difficulty_';

function getLevelStorageKey(theme) {
  return `${LEVEL_STORAGE_PREFIX}${theme}`;
}

function getDifficultyStorageKey(theme, level) {
  return `${DIFFICULTY_STORAGE_PREFIX}${theme}_${level}`;
}

function getCurrentLevel(theme) {
  try {
    if (typeof localStorage === 'undefined' || !localStorage) {
      return 1;
    }
    const key = getLevelStorageKey(theme);
    const level = parseInt(localStorage.getItem(key) || '1', 10);
    return Math.max(1, level);
  } catch (e) {
    if (e.name === 'SecurityError' || e.message.includes('not allowed')) {
      console.warn('Storage access not allowed, using default level');
    } else {
      console.warn('Failed to get current level from storage:', e);
    }
    return 1;
  }
}

export function setCurrentLevel(theme, level) {
  try {
    if (typeof localStorage === 'undefined' || !localStorage) {
      return;
    }
    const key = getLevelStorageKey(theme);
    localStorage.setItem(key, level.toString());
  } catch (e) {
    if (e.name === 'SecurityError' || e.message.includes('not allowed')) {
      console.warn('Storage access not allowed, cannot save level');
    } else {
      console.warn('Failed to save current level to storage:', e);
    }
  }
}

function getSavedDifficultyConfig(theme, level) {
  try {
    if (typeof localStorage === 'undefined' || !localStorage) {
      return null;
    }
    const key = getDifficultyStorageKey(theme, level);
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  } catch (e) {
    if (e.name === 'SecurityError' || e.message.includes('not allowed')) {
      console.warn('Storage access not allowed, cannot get difficulty config');
    } else {
      console.warn('Failed to get difficulty config from storage:', e);
    }
    return null;
  }
}

function saveDifficultyConfig(theme, level, config) {
  try {
    if (typeof localStorage === 'undefined' || !localStorage) {
      return;
    }
    const key = getDifficultyStorageKey(theme, level);
    localStorage.setItem(key, JSON.stringify(config));
  } catch (e) {
    if (e.name === 'SecurityError' || e.message.includes('not allowed')) {
      console.warn('Storage access not allowed, cannot save difficulty config');
    } else {
      console.warn('Failed to save difficulty config to storage:', e);
    }
  }
}

function getDifficultyConfig(theme, level, isLastLevel = false) {
  const saved = getSavedDifficultyConfig(theme, level);
  if (saved) {
    return saved;
  }
  
  let config;
  if (isLastLevel) {
    config = { rows: 9, cols: 9, totalTiles: 81, isHard: true };
  } else if (level <= 10) {
    config = { rows: 3, cols: 3, totalTiles: 9, isHard: false };
  } else if (level <= 20) {
    if (level % 3 === 0) {
      config = { rows: 4, cols: 3, totalTiles: 12, isHard: true };
    } else {
      config = { rows: 3, cols: 3, totalTiles: 9, isHard: false };
    }
  } else if (level <= 40) {
    if (level % 3 === 0) {
      config = { rows: 5, cols: 4, totalTiles: 20, isHard: true };
    } else {
      config = { rows: 3, cols: 3, totalTiles: 9, isHard: false };
    }
  } else if (level <= 70) {
    if (level % 3 === 0) {
      config = { rows: 6, cols: 5, totalTiles: 30, isHard: true };
    } else {
      config = { rows: 3, cols: 3, totalTiles: 9, isHard: false };
    }
  } else {
    if (level % 5 === 0) {
      config = { rows: 7, cols: 6, totalTiles: 42, isHard: true };
    } else {
      config = { rows: 3, cols: 3, totalTiles: 9, isHard: false };
    }
  }
  
  saveDifficultyConfig(theme, level, config);
  return config;
}

export const Game = {
  isRunning: false,
  puzzle: null,
  currentTheme: null,
  currentLevel: 1,
  inputBlocked: false,

  async startWithTheme(themeId) {
    console.log('Game.startWithTheme() called with theme:', themeId);
    this.currentTheme = themeId;
    
    try {
      await loadSound('klik', './klik.mp3').catch(() => {
        console.log('Klik sound not loaded (file may not exist)');
      });
      await loadSound('podsk', './podsk.mp3').catch(() => {
        console.log('Podsk sound not loaded (file may not exist)');
      });
      await loadSound('connectP', './connectP.mp3').catch(() => {
        console.log('ConnectP sound not loaded (file may not exist)');
      });
      await loadSound('vz1', './vz1.mp3').catch(() => {
        console.log('Vz1 sound not loaded (file may not exist)');
      });
      await loadSound('vz2', './vz2.mp3').catch(() => {
        console.log('Vz2 sound not loaded (file may not exist)');
      });
      await loadSound('vz3', './vz3.mp3').catch(() => {
        console.log('Vz3 sound not loaded (file may not exist)');
      });
      await loadSound('vz4', './vz4.mp3').catch(() => {
        console.log('Vz4 sound not loaded (file may not exist)');
      });
      await loadSound('win1', './win1.mp3').catch(() => {
        console.log('Win1 sound not loaded (file may not exist)');
      });
      await loadSound('win2', './win2.mp3').catch(() => {
        console.log('Win2 sound not loaded (file may not exist)');
      });
    } catch (e) {
      console.log('Sound loading error (non-critical):', e);
    }
    
    try {
      console.log('Initializing ImagePool for theme:', themeId);
      await ImagePool.initialize(themeId);
      console.log('ImagePool initialized');
    } catch (error) {
      console.error('Failed to initialize ImagePool:', error);
      setStatusText('Не удалось загрузить изображения');
      return;
    }

    const total = ImagePool.getTotalImages(themeId);
    const progress = await initializeProgress(themeId, total);
    await markThemeAsVisited(themeId, total);
    const completed = progress.completed;
    
    if (completed >= total) {
      this.currentLevel = total;
      ImagePool.themes[themeId].currentIndex = total - 1;
    } else {
      const expectedLevel = completed + 1;
      this.currentLevel = Math.min(expectedLevel, total);
      setCurrentLevel(themeId, this.currentLevel);
      ImagePool.themes[themeId].currentIndex = this.currentLevel - 1;
    }
    
    this.isRunning = true;
    
    setLevelTitle(this.currentLevel);
    const hintsCount = await getHintsCount();
    updateHintsDisplay(hintsCount);
    console.log('Loading level', this.currentLevel, 'for theme', themeId);
    await this.loadLevel(this.currentLevel);
    setStatusText(t('ASSEMBLE_IMAGE'));
    console.log('Game started successfully');
  },

  async start() {
    return this.startWithTheme('animals');
  },

  async loadLevel(level) {
    if (!this.currentTheme) {
      console.error('No theme selected');
      return;
    }

    hideVictoryScreen();
    this.inputBlocked = true;

    const gameArea = getGameArea();
    if (gameArea) {
      const oldTiles = gameArea.querySelectorAll('.puzzle-tile');
      oldTiles.forEach(tile => {
        if (tile.parentNode) {
          tile.parentNode.removeChild(tile);
        }
      });
    }

    if (this.puzzle) {
      this.puzzle.destroy();
      this.puzzle = null;
    }
    
    if (gameArea) {
      const remainingTiles = gameArea.querySelectorAll('.puzzle-tile');
      remainingTiles.forEach(tile => {
        if (tile.parentNode) {
          tile.parentNode.removeChild(tile);
        }
      });
    }
    
    showLoadingAnimation();
    
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    this.puzzle = new Puzzle();
    setLevelTitle(level);
    const hintsCount = await getHintsCount();
    updateHintsDisplay(hintsCount);
    
    const total = ImagePool.getTotalImages(this.currentTheme);
    let isLastLevel = false;
    const completed = await getCompletedLevels(this.currentTheme);
    if (completed >= total && level === total) {
      isLastLevel = true;
      ImagePool.themes[this.currentTheme].currentIndex = total - 1;
    } else {
      const imageIndex = Math.min(level - 1, total - 1);
      ImagePool.themes[this.currentTheme].currentIndex = imageIndex;
    }
    
    const imageUrl = ImagePool.getCurrentImageUrl(this.currentTheme);
    if (!imageUrl) {
      console.error('No image URL available');
      hideLoadingAnimation();
      setStatusText('Не удалось загрузить изображение');
      this.inputBlocked = false;
      return;
    }
    
    const difficulty = getDifficultyConfig(this.currentTheme, level, isLastLevel);
    const { rows, cols, isHard } = difficulty;
    
    if (isHard) {
      await this.showHardLevelWarning(rows, cols);
    }
    
    try {
      const preloadedImg = ImagePool.getPreloadedImage(imageUrl);
      if (preloadedImg && preloadedImg.complete && preloadedImg.naturalWidth > 0) {
        this.puzzle.image = preloadedImg;
        await this.puzzle.createPuzzleFromImage(preloadedImg, rows, cols);
      } else {
        await this.puzzle.createPuzzle(imageUrl, rows, cols);
      }
      
      this.inputBlocked = false;
      setStatusText(t('ASSEMBLE_IMAGE'));
      
      if (shouldShowTutorial() && level === 1) {
        setTimeout(() => {
          showTutorial();
        }, 500);
      } else {
        hideTutorial();
      }
      
      if (!isLastLevel) {
        ImagePool.preloadNext(this.currentTheme);
      }
    } catch (error) {
      console.error('Failed to load level:', error);
      hideLoadingAnimation();
      this.inputBlocked = false;
      setStatusText('Не удалось загрузить уровень');
    }
  },

  reset() {
    if (this.puzzle) {
      hideVictoryScreen();
      this.inputBlocked = false;
      this.puzzle.reset();
      setStatusText(t('ASSEMBLE_IMAGE'));
    }
  },

  onPointerDown(x, y, event) {
    if (!this.puzzle || !this.isRunning || this.inputBlocked) return;
    if (isVictoryScreenVisible()) return;
    hideTutorial();
    this.puzzle.onPointerDown(x, y);
  },

  onPointerUp(x, y, event) {
    if (!this.puzzle || !this.isRunning || this.inputBlocked) return;
    if (isVictoryScreenVisible()) return;
    
    const wasComplete = this.puzzle.isComplete;
    this.puzzle.onPointerUp(x, y);
    
        setTimeout(async () => {
      if (this.puzzle && !this.inputBlocked) {
        const isComplete = this.puzzle.checkCompletion();
        console.log('Completion check:', isComplete, 'wasComplete:', wasComplete);
        if (isComplete && !wasComplete) {
          console.log('Puzzle completed!');
          this.inputBlocked = true;
          setStatusText(t('SUCCESS'));
          removeCompletionEffect();
          
          hideTutorial();
          
          if (shouldShowTutorial() && this.currentLevel === 1) {
            markTutorialCompleted();
          }
          
          const total = ImagePool.getTotalImages(this.currentTheme);
          await updateProgressOnLevelComplete(this.currentTheme, this.currentLevel - 1, total);
          
          const nextLevel = this.currentLevel + 1;
          setCurrentLevel(this.currentTheme, nextLevel);
          
          const themeName = this.getThemeDisplayName(this.currentTheme);
          showVictoryScreen(
            this.puzzle,
            themeName,
            this.currentLevel,
            () => this.handleNextLevel(),
            () => this.handleRestartLevel(),
            () => this.handleToMenu(),
            COINS_PER_LEVEL
          );
        }
      }
    }, 600);
  },

  onPointerMove(x, y, event) {
    if (!this.puzzle || !this.isRunning || this.inputBlocked) return;
    if (isVictoryScreenVisible()) return;
    this.puzzle.onPointerMove(x, y);
  },
  
  getThemeDisplayName(themeId) {
    const theme = getThemeById(themeId);
    return theme ? theme.title : themeId;
  },
  
  async handleNextLevel() {
    this.inputBlocked = false;
    if (this.currentTheme) {
      ImagePool.moveToNext(this.currentTheme);
    }
    const adPromise = showInterstitialAd('level_complete');
    await adPromise;
    await this.nextLevel();
  },
  
  async handleRestartLevel() {
    this.inputBlocked = false;
    await this.loadLevel(this.currentLevel);
  },
  
  async handleToMenu() {
    this.inputBlocked = false;
    this.isRunning = false;
    if (this.puzzle) {
      this.puzzle.destroy();
      this.puzzle = null;
    }
    const adPromise = showInterstitialAd('to_menu');
    await adPromise;
    showMenu();
  },

  async nextLevel() {
    if (!this.currentTheme) {
      console.error('No theme selected');
      return;
    }
    
    const total = ImagePool.getTotalImages(this.currentTheme);
    const completed = getCompletedLevels(this.currentTheme);
    
    if (completed >= total) {
      this.currentLevel = total;
    } else {
      this.currentLevel++;
      if (this.currentLevel > total) {
        this.currentLevel = total;
      }
    }
    
    setCurrentLevel(this.currentTheme, this.currentLevel);
    await this.loadLevel(this.currentLevel);
  },

  async showHardLevelWarning(rows, cols) {
    return new Promise((resolve) => {
      const gameArea = getGameArea();
      if (!gameArea) {
        resolve();
        return;
      }
      
      const warningOverlay = document.createElement('div');
      warningOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 2500;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      
      const warningContent = document.createElement('div');
      warningContent.style.cssText = `
        text-align: center;
        color: white;
      `;
      
      const emoji = document.createElement('div');
      emoji.textContent = '😤';
      emoji.style.cssText = `
        font-size: 120px;
        margin-bottom: 30px;
        transform: scale(0) rotate(-180deg);
        transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        filter: drop-shadow(0 0 20px rgba(255, 140, 0, 0.8));
      `;
      
      const text = document.createElement('div');
      text.textContent = `${rows}×${cols}`;
      text.style.cssText = `
        font-size: 45.6px;
        font-weight: bold;
        font-family: 'Patsy', sans-serif;
        margin-bottom: 20px;
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.4s ease 0.2s, transform 0.4s ease 0.2s;
        text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
      `;
      
      const subtitle = document.createElement('div');
      subtitle.textContent = 'Сложный уровень!';
      subtitle.style.cssText = `
        font-size: 26.6px;
        font-family: 'Patsy', sans-serif;
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.4s ease 0.3s, transform 0.4s ease 0.3s;
        text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
      `;
      
      warningContent.appendChild(emoji);
      warningContent.appendChild(text);
      warningContent.appendChild(subtitle);
      warningOverlay.appendChild(warningContent);
      gameArea.appendChild(warningOverlay);
      
      requestAnimationFrame(() => {
        warningOverlay.style.opacity = '1';
        setTimeout(() => {
          emoji.style.transform = 'scale(1) rotate(0deg)';
          setTimeout(() => {
            text.style.opacity = '1';
            text.style.transform = 'translateY(0)';
            setTimeout(() => {
              subtitle.style.opacity = '1';
              subtitle.style.transform = 'translateY(0)';
              setTimeout(() => {
                emoji.style.transform = 'scale(0.8) rotate(360deg)';
                emoji.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
                text.style.opacity = '0';
                text.style.transform = 'translateY(-20px)';
                subtitle.style.opacity = '0';
                subtitle.style.transform = 'translateY(-20px)';
                warningOverlay.style.opacity = '0';
                setTimeout(() => {
                  warningOverlay.remove();
                  resolve();
                }, 500);
              }, 1500);
            }, 200);
          }, 200);
        }, 50);
      });
    });
  },

  update(deltaTime) {
  },

  render() {
  },
};

