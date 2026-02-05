import { t } from './localization.js';
import { getGameArea } from './ui_layout.js';
import { playSound } from './audio.js';
import { addCoins, addCoinsForLevel } from './coins.js';
import { showRewardedAd } from './ads_yandex.js';
import { showInterstitialAd } from './ads_interstitial.js';

let victoryOverlay = null;
let victoryScreenVisible = false;

export function showVictoryScreen(puzzle, theme, level, onNextLevel, onRestart, onMenu, coinsEarned = 0) {
  if (victoryScreenVisible) return;
  
  victoryScreenVisible = true;
  const gameArea = getGameArea();
  if (!gameArea) return;
  
  const gameRoot = document.getElementById('game-root');
  if (!gameRoot) return;
  
  const winSounds = ['win1', 'win2'];
  const randomWinSound = winSounds[Math.floor(Math.random() * winSounds.length)];
  try {
    playSound(randomWinSound);
  } catch (e) {
  }
  
  removeVictoryScreen();
  
  victoryOverlay = document.createElement('div');
  victoryOverlay.id = 'victory-overlay';
  victoryOverlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0);
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    transition: background 0.4s ease;
  `;
  
  const victoryCard = document.createElement('div');
  victoryCard.style.cssText = `
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.98) 0%, rgba(255, 140, 0, 0.98) 50%, rgba(255, 69, 0, 0.98) 100%);
    border-radius: 30px;
    padding: 50px;
    min-width: 350px;
    max-width: 550px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 
                0 0 100px rgba(255, 215, 0, 0.4),
                inset 0 0 30px rgba(255, 255, 255, 0.2);
    text-align: center;
    opacity: 0;
    pointer-events: none;
    border: 3px solid rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
  `;
  
  const title = document.createElement('div');
  title.textContent = t('LEVEL_COMPLETE');
  title.style.cssText = `
    font-size: 42px;
    font-weight: bold;
    color: white;
    margin-bottom: 15px;
    text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5), 
                 0 0 20px rgba(255, 255, 255, 0.5);
    font-family: 'Patsy', sans-serif;
    letter-spacing: 2px;
  `;
  victoryCard.appendChild(title);
  
  const subtitle = document.createElement('div');
  subtitle.textContent = `${theme} - ${t('LEVEL')} ${level}`;
  subtitle.style.cssText = `
    font-size: 24px;
    color: rgba(255, 255, 255, 0.95);
    margin-bottom: 35px;
    font-family: 'Patsy', sans-serif;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    font-weight: 500;
  `;
  victoryCard.appendChild(subtitle);
  
  const isThirdLevel = level % 3 === 0;
  let doubleRewardButton = null;
  
  if (isThirdLevel && coinsEarned > 0) {
    const rewardText = document.createElement('div');
    rewardText.textContent = `${t('RECEIVED_COINS')} ${coinsEarned} ${t('COINS').toLowerCase()}`;
    rewardText.style.cssText = `
      font-size: 18px;
      color: rgba(255, 255, 255, 0.95);
      margin-bottom: 20px;
      font-family: 'Patsy', sans-serif;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      font-weight: 500;
    `;
    victoryCard.appendChild(rewardText);
    
    doubleRewardButton = document.createElement('button');
    doubleRewardButton.style.cssText = `
      padding: 18px 35px;
      font-size: 20px;
      font-weight: bold;
      color: white;
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.8) 0%, rgba(255, 140, 0, 0.8) 100%);
      border: 2px solid rgba(255, 255, 255, 0.9);
      border-radius: 15px;
      cursor: pointer;
      font-family: 'Patsy', sans-serif;
      transition: all 0.3s ease;
      width: 100%;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    `;
    
    const adIconContainer = document.createElement('div');
    adIconContainer.style.cssText = `
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    `;
    
    const filmIcon = document.createElement('span');
    filmIcon.textContent = '🎞️';
    filmIcon.style.cssText = 'font-size: 24px;';
    adIconContainer.appendChild(filmIcon);
    
    const adText = document.createElement('span');
    adText.textContent = 'AD';
    adText.style.cssText = `
      position: absolute;
      font-size: 10px;
      font-weight: bold;
      color: white;
      font-family: 'Patsy', sans-serif;
      text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    `;
    adIconContainer.appendChild(adText);
    
    const buttonText = document.createElement('span');
    buttonText.textContent = t('DOUBLE_REWARD_FOR_AD');
    doubleRewardButton.appendChild(adIconContainer);
    doubleRewardButton.appendChild(buttonText);
    
    doubleRewardButton.addEventListener('mouseenter', () => {
      doubleRewardButton.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 1) 0%, rgba(255, 140, 0, 1) 100%)';
      doubleRewardButton.style.transform = 'scale(1.05) translateY(-2px)';
      doubleRewardButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
    });
    
    doubleRewardButton.addEventListener('mouseleave', () => {
      doubleRewardButton.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.8) 0%, rgba(255, 140, 0, 0.8) 100%)';
      doubleRewardButton.style.transform = 'scale(1) translateY(0)';
      doubleRewardButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
    });
    
    doubleRewardButton.addEventListener('click', async () => {
      try {
        playSound('klik');
      } catch (e) {
      }
      
      const result = await showRewardedAd('double_reward');
      if (result.rewarded) {
        await addCoins(coinsEarned);
        const buttonText = doubleRewardButton.querySelector('span:last-child');
        if (buttonText) {
          buttonText.textContent = t('REWARD_DOUBLED');
        } else {
          doubleRewardButton.textContent = t('REWARD_DOUBLED');
        }
        doubleRewardButton.style.background = 'rgba(76, 175, 80, 0.8)';
        doubleRewardButton.style.pointerEvents = 'none';
        doubleRewardButton.style.cursor = 'default';
        
        setTimeout(() => {
          if (doubleRewardButton && doubleRewardButton.parentElement) {
            doubleRewardButton.remove();
          }
        }, 2000);
      }
    });
  }
  
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 100%;
  `;
  
  if (doubleRewardButton) {
    buttonsContainer.appendChild(doubleRewardButton);
  }
  
  const nextButton = createVictoryButton(t('NEXT_LEVEL'), async () => {
    hideVictoryScreen();
    if (onNextLevel) {
      const adPromise = showInterstitialAd('next_level');
      await adPromise;
      onNextLevel();
    }
  });
  buttonsContainer.appendChild(nextButton);
  
  const restartButton = createVictoryButton(t('RESTART_LEVEL'), () => {
    hideVictoryScreen();
    if (onRestart) onRestart();
  });
  buttonsContainer.appendChild(restartButton);
  
  const menuButton = createVictoryButton(t('TO_MENU'), async () => {
    hideVictoryScreen();
    if (onMenu) {
      const adPromise = showInterstitialAd('to_menu');
      await adPromise;
      onMenu();
    }
  });
  buttonsContainer.appendChild(menuButton);
  
  victoryCard.appendChild(buttonsContainer);
  victoryOverlay.appendChild(victoryCard);
  
  gameRoot.appendChild(victoryOverlay);
  
  createConfettiAnimation(gameRoot);
  
  if (coinsEarned > 0) {
    setTimeout(() => {
      showCoinsAnimation(coinsEarned, gameRoot);
    }, 800);
  }
  
  setTimeout(() => {
    victoryOverlay.style.background = 'rgba(0, 0, 0, 0.6)';
    victoryOverlay.style.pointerEvents = 'auto';
    victoryCard.style.transition = 'opacity 0.4s ease';
    victoryCard.style.opacity = '1';
    victoryCard.style.pointerEvents = 'auto';
    victoryCard.style.animation = 'victoryAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
  }, 1500);
  
  const style = document.createElement('style');
  if (!document.getElementById('victory-screen-styles')) {
    style.id = 'victory-screen-styles';
    style.textContent = `
      @keyframes victoryAppear {
        0% {
          transform: translate(-50%, -50%) scale(0.3) rotate(-10deg);
          opacity: 0;
        }
        60% {
          transform: translate(-50%, -50%) scale(1.1) rotate(2deg);
        }
        100% {
          transform: translate(-50%, -50%) scale(1) rotate(0deg);
          opacity: 1;
        }
      }
      @keyframes victoryGlow {
        0%, 100% {
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 
                      0 0 100px rgba(255, 215, 0, 0.4),
                      inset 0 0 30px rgba(255, 255, 255, 0.2);
        }
        50% {
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 
                      0 0 150px rgba(255, 215, 0, 0.6),
                      inset 0 0 40px rgba(255, 255, 255, 0.3);
        }
      }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
      victoryCard.style.animation += ', victoryGlow 2s ease-in-out infinite';
    }, 2100);
  }
}

function createVictoryButton(text, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.cssText = `
    padding: 18px 35px;
    font-size: 20px;
    font-weight: bold;
    color: white;
    background: rgba(255, 255, 255, 0.25);
    border: 2px solid rgba(255, 255, 255, 0.8);
    border-radius: 15px;
    cursor: pointer;
    font-family: 'Patsy', sans-serif;
    width: 100%;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  `;
  
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      playSound('klik');
    } catch (e) {
    }
    onClick();
  });
  
  return button;
}

function createConfettiAnimation(container) {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FFD93D', '#FF8C00', '#32CD32', '#FF1493', '#00CED1', '#FF69B4', '#FFA500'];
  const confettiCount = 120;
  
  const rect = container.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 10 + 5;
    const shape = Math.random() > 0.5 ? 'square' : 'circle';
    
    const startX = Math.random() * width;
    const startY = -20 - Math.random() * 50;
    
    const vx = (Math.random() - 0.5) * 400;
    const vy = Math.random() * 300 + 200;
    
    const rotationSpeed = (Math.random() - 0.5) * 900;
    const lifetime = 2000 + Math.random() * 500;
    
    confetti.style.cssText = `
      position: absolute;
      left: ${startX}px;
      top: ${startY}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${shape === 'circle' ? '50%' : '2px'};
      opacity: 1;
      transform: rotate(0deg);
      pointer-events: none;
      z-index: 2999;
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
    `;
    
    container.appendChild(confetti);
    
    const startTime = Date.now();
    
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / lifetime;
      
      if (progress >= 1) {
        confetti.style.transition = 'opacity 0.2s ease';
        confetti.style.opacity = '0';
        setTimeout(() => confetti.remove(), 200);
        return;
      }
      
      const gravity = 600;
      const currentX = startX + vx * progress;
      const currentY = startY + vy * progress + 0.5 * gravity * progress * progress;
      const rotation = rotationSpeed * progress;
      
      confetti.style.left = `${currentX}px`;
      confetti.style.top = `${currentY}px`;
      confetti.style.transform = `rotate(${rotation}deg)`;
      
      requestAnimationFrame(animate);
    }
    
    requestAnimationFrame(animate);
  }
}

export function hideVictoryScreen() {
  victoryScreenVisible = false;
  removeVictoryScreen();
}

export function removeVictoryScreen() {
  if (victoryOverlay) {
    victoryOverlay.remove();
    victoryOverlay = null;
  }
}

export function isVictoryScreenVisible() {
  return victoryScreenVisible;
}

function showCoinsAnimation(coinsAmount, container) {
  const coinsDisplay = document.getElementById('coins-display');
  if (!coinsDisplay) return;
  
  const coinsDisplayRect = coinsDisplay.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const targetX = coinsDisplayRect.left + coinsDisplayRect.width / 2 - containerRect.left;
  const targetY = coinsDisplayRect.top + coinsDisplayRect.height / 2 - containerRect.top;
  
  const coinCount = Math.min(coinsAmount / 10, 20);
  
  for (let i = 0; i < coinCount; i++) {
    setTimeout(() => {
      const coin = document.createElement('img');
      coin.src = './monet.png';
      coin.style.cssText = `
        position: absolute;
        width: 40px;
        height: 40px;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 3100;
        pointer-events: none;
        filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8));
      `;
      
      container.appendChild(coin);
      
      const startX = containerRect.width / 2;
      const startY = containerRect.height / 2;
      const angle = (Math.PI * 2 * i) / coinCount;
      const distance = 150 + Math.random() * 100;
      const midX = startX + Math.cos(angle) * distance;
      const midY = startY + Math.sin(angle) * distance;
      
      const duration = 1200 + Math.random() * 300;
      const startTime = Date.now();
      
      function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (progress >= 1) {
          coin.style.transition = 'opacity 0.2s ease';
          coin.style.opacity = '0';
          setTimeout(() => coin.remove(), 200);
          return;
        }
        
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentX = startX + (midX - startX) * easeOut + (targetX - midX) * progress;
        const currentY = startY + (midY - startY) * easeOut + (targetY - midY) * progress;
        const scale = 1 - progress * 0.5;
        const rotation = progress * 720;
        
        coin.style.left = `${currentX}px`;
        coin.style.top = `${currentY}px`;
        coin.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`;
        
        requestAnimationFrame(animate);
      }
      
      requestAnimationFrame(animate);
    }, i * 30);
  }
  
  setTimeout(async () => {
    await addCoinsForLevel();
  }, coinCount * 30 + 500);
}

