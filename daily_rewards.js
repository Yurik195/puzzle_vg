import { saveToCloud, loadFromCloud } from './cloud_storage.js';
import { addCoins } from './coins.js';
import { playSound } from './audio.js';
import { t } from './localization.js';
import { getIsPortraitMode } from './scale.js';

const DAILY_REWARDS_STATE_KEY = 'jigmerge_daily_rewards_state';
const TOTAL_DAYS = 30;
const BASE_REWARD = 30;

let rewardsState = {
  lastClaimedDay: 0,
  lastClaimedDate: null,
  claimedDays: []
};

let rewardsButton = null;
let rewardsWindow = null;

function getServerTime() {
  return Date.now();
}

function getCurrentDay() {
  const now = getServerTime();
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function getDayNumber() {
  const currentDay = getCurrentDay();
  const lastClaimedDate = rewardsState.lastClaimedDate;
  
  if (!lastClaimedDate) {
    return 1;
  }
  
  const lastDay = new Date(lastClaimedDate);
  lastDay.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((currentDay - lastDay) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    return rewardsState.lastClaimedDay;
  } else if (daysDiff === 1) {
    const nextDay = rewardsState.lastClaimedDay + 1;
    if (nextDay > TOTAL_DAYS) {
      return 1;
    }
    return nextDay;
  } else {
    return 1;
  }
}

function canClaimToday() {
  const currentDay = getCurrentDay();
  const lastClaimedDate = rewardsState.lastClaimedDate;
  
  if (!lastClaimedDate) {
    return true;
  }
  
  const lastDay = new Date(lastClaimedDate);
  lastDay.setHours(0, 0, 0, 0);
  
  return currentDay > lastDay;
}

function getRewardForDay(day) {
  return BASE_REWARD * day;
}

async function loadRewardsState() {
  const stored = await loadFromCloud(DAILY_REWARDS_STATE_KEY, null);
  if (stored) {
    rewardsState = { ...rewardsState, ...stored };
    if (!Array.isArray(rewardsState.claimedDays)) {
      rewardsState.claimedDays = [];
    }
  }
}

async function saveRewardsState() {
  await saveToCloud(DAILY_REWARDS_STATE_KEY, rewardsState);
}

async function claimReward(day) {
  if (!canClaimToday()) {
    return false;
  }
  
  const currentDayNumber = getDayNumber();
  if (day !== currentDayNumber) {
    return false;
  }
  
  const reward = getRewardForDay(day);
  const currentDay = getCurrentDay();
  
  rewardsState.lastClaimedDay = day;
  rewardsState.lastClaimedDate = currentDay;
  
  if (!rewardsState.claimedDays.includes(day)) {
    rewardsState.claimedDays.push(day);
  }
  
  await saveRewardsState();
  await addCoins(reward);
  
  updateRewardsButton();
  if (rewardsWindow) {
    updateRewardsWindow();
  }
  
  return true;
}

function createCoinsAnimation(fromElement, toElement, amount) {
  const fromRect = fromElement.getBoundingClientRect();
  const toRect = toElement.getBoundingClientRect();
  
  const coinCount = Math.min(Math.max(Math.floor(amount / 10), 5), 20);
  
  const startX = fromRect.left + fromRect.width / 2;
  const startY = fromRect.top + fromRect.height / 2;
  const endX = toRect.left + toRect.width / 2;
  const endY = toRect.top + toRect.height / 2;
  
  for (let i = 0; i < coinCount; i++) {
    const coin = document.createElement('img');
    coin.src = './monet.png';
    coin.style.cssText = `
      position: fixed;
      left: ${startX}px;
      top: ${startY}px;
      width: 24px;
      height: 24px;
      z-index: 10001;
      pointer-events: none;
      transform: translate(-50%, -50%);
    `;
    
    document.body.appendChild(coin);
    
    const delay = i * 30;
    const angle = (i / coinCount) * Math.PI * 2;
    const spread = 80;
    const midX = startX + Math.cos(angle) * spread;
    const midY = startY + Math.sin(angle) * spread - 30;
    
    const keyframes = [
      {
        transform: `translate(-50%, -50%) translate(0, 0) scale(1) rotate(0deg)`,
        opacity: 1
      },
      {
        transform: `translate(-50%, -50%) translate(${midX - startX}px, ${midY - startY}px) scale(1.2) rotate(180deg)`,
        opacity: 1,
        offset: 0.5
      },
      {
        transform: `translate(-50%, -50%) translate(${endX - startX}px, ${endY - startY}px) scale(0.3) rotate(360deg)`,
        opacity: 0
      }
    ];
    
    setTimeout(() => {
      coin.animate(keyframes, {
        duration: 1000,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }).onfinish = () => {
        if (coin.parentElement) {
          coin.remove();
        }
      };
    }, delay);
  }
}

export function createDailyRewardsButton() {
  if (rewardsButton) {
    return rewardsButton;
  }

  rewardsButton = document.createElement('button');
  rewardsButton.id = 'daily-rewards-button';
  rewardsButton.style.cssText = `
    position: relative;
    padding: 12px 24px;
    font-size: 28px;
    background: rgba(255, 215, 0, 0.3);
    border: 2px solid rgba(255, 215, 0, 0.8);
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Patsy', sans-serif;
    transition: all 0.3s;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    padding: 0;
  `;
  
  const iconImg = document.createElement('img');
  iconImg.src = './3726279.png';
  iconImg.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
  rewardsButton.appendChild(iconImg);

  rewardsButton.addEventListener('mouseenter', () => {
    rewardsButton.style.background = 'rgba(255, 215, 0, 0.5)';
    rewardsButton.style.transform = 'scale(1.05)';
  });

  rewardsButton.addEventListener('mouseleave', () => {
    rewardsButton.style.background = 'rgba(255, 215, 0, 0.3)';
    rewardsButton.style.transform = 'scale(1)';
  });

  rewardsButton.addEventListener('click', () => {
    try {
      playSound('klik');
    } catch (e) {
    }
    showRewardsWindow();
  });

  updateRewardsButton();
  return rewardsButton;
}

function updateRewardsButton() {
  if (!rewardsButton) return;
  
  const canClaim = canClaimToday();
  const notificationBadge = rewardsButton.querySelector('.notification-badge');
  
  if (canClaim && !notificationBadge) {
    const badge = document.createElement('div');
    badge.className = 'notification-badge';
    badge.style.cssText = `
      position: absolute;
      top: -5px;
      right: -5px;
      width: 16px;
      height: 16px;
      background: #ff1744;
      border: 2px solid white;
      border-radius: 50%;
      z-index: 10;
    `;
    rewardsButton.appendChild(badge);
  } else if (!canClaim && notificationBadge) {
    notificationBadge.remove();
  }
}

function showRewardsWindow() {
  if (rewardsWindow) {
    rewardsWindow.style.display = 'flex';
    animateWindowOpen();
    return;
  }

  const gameRoot = document.getElementById('game-root');
  if (!gameRoot) return;

  const overlay = document.createElement('div');
  overlay.id = 'daily-rewards-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;
  `;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      hideRewardsWindow();
    }
  });

  const isPortrait = getIsPortraitMode();
  const baseWidth = 588;
  const portraitWidth = baseWidth * 1.177;
  const baseMaxHeight = 90;
  const portraitMaxHeight = baseMaxHeight * 1.15;
  
  const window = document.createElement('div');
  window.id = 'daily-rewards-window';
  window.className = 'daily-rewards-window-container';
  window.style.cssText = `
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.98) 0%, rgba(255, 140, 0, 0.98) 100%);
    border-radius: 19.6px;
    padding: 29.4px;
    max-width: 90vw;
    max-height: ${isPortrait ? portraitMaxHeight + 'vh' : baseMaxHeight + 'vh'};
    width: ${isPortrait ? portraitWidth + 'px' : baseWidth + 'px'};
    box-shadow: 0 19.6px 58.8px rgba(0, 0, 0, 0.6);
    border: 2px solid rgba(255, 255, 255, 0.5);
    transform: scale(0.5);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    overflow: hidden;
    position: relative;
    z-index: 2001;
  `;

  const title = document.createElement('div');
  title.textContent = t('DAILY_REWARDS');
  title.style.cssText = `
    font-size: 27.44px;
    font-weight: bold;
    color: white;
    margin-bottom: 19.6px;
    text-align: center;
    font-family: 'Patsy', sans-serif;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  `;
  window.appendChild(title);

  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'daily-rewards-scroll';
  const scrollMaxHeight = isPortrait ? 69 : 60;
  scrollContainer.style.cssText = `
    max-height: ${scrollMaxHeight}vh;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 14px;
    margin: -14px;
    touch-action: pan-y;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  `;
  
  const scrollStyle = document.createElement('style');
  scrollStyle.textContent = `
    .daily-rewards-scroll::-webkit-scrollbar {
      width: 12px;
    }
    .daily-rewards-scroll::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }
    .daily-rewards-scroll::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.4);
      border-radius: 10px;
      border: 2px solid rgba(255, 255, 255, 0.1);
    }
    .daily-rewards-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.6);
    }
    .daily-rewards-scroll {
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.4) rgba(255, 255, 255, 0.1);
    }
  `;
  document.head.appendChild(scrollStyle);

  const rewardsGrid = document.createElement('div');
  rewardsGrid.id = 'rewards-grid';
  const columns = isPortrait ? 4 : 5;
  rewardsGrid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(${columns}, 1fr);
    gap: 11.76px;
    padding: 9.8px;
  `;

  scrollContainer.appendChild(rewardsGrid);
  window.appendChild(scrollContainer);

  const closeButton = document.createElement('button');
  closeButton.textContent = '✕';
  closeButton.style.cssText = `
    position: absolute;
    top: 14.7px;
    right: 14.7px;
    width: 34.3px;
    height: 34.3px;
    background: rgba(255, 255, 255, 0.3);
    border: 2px solid white;
    border-radius: 50%;
    cursor: pointer;
    font-size: 19.6px;
    color: white;
    font-family: 'Patsy', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  `;

  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.background = 'rgba(255, 255, 255, 0.5)';
    closeButton.style.transform = 'scale(1.1)';
  });

  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.background = 'rgba(255, 255, 255, 0.3)';
    closeButton.style.transform = 'scale(1)';
  });

  closeButton.addEventListener('click', () => {
    try {
      playSound('klik');
    } catch (e) {
    }
    hideRewardsWindow();
  });

  window.appendChild(closeButton);
  overlay.appendChild(window);
  gameRoot.appendChild(overlay);

  rewardsWindow = overlay;

  updateRewardsWindow();
  animateWindowOpen();
}

function animateWindowOpen() {
  if (!rewardsWindow) return;
  
  requestAnimationFrame(() => {
    rewardsWindow.style.opacity = '1';
    const window = rewardsWindow.querySelector('#daily-rewards-window');
    if (window) {
      window.style.transform = 'scale(1)';
    }
  });
}

function hideRewardsWindow() {
  if (!rewardsWindow) return;
  
  rewardsWindow.style.opacity = '0';
  const window = rewardsWindow.querySelector('#daily-rewards-window');
  if (window) {
    window.style.transform = 'scale(0.5)';
  }
  
  setTimeout(() => {
    if (rewardsWindow && rewardsWindow.parentElement) {
      rewardsWindow.style.display = 'none';
    }
  }, 300);
}

function updateRewardsWindow() {
  if (!rewardsWindow) return;
  
  const isPortrait = getIsPortraitMode();
  
  const windowElement = rewardsWindow.querySelector('#daily-rewards-window');
  if (windowElement) {
    const baseWidth = 588;
    const portraitWidth = baseWidth * 1.177;
    const baseMaxHeight = 90;
    const portraitMaxHeight = baseMaxHeight * 1.15;
    windowElement.style.width = isPortrait ? portraitWidth + 'px' : baseWidth + 'px';
    windowElement.style.maxHeight = isPortrait ? portraitMaxHeight + 'vh' : baseMaxHeight + 'vh';
    
    const scrollContainer = windowElement.querySelector('.daily-rewards-scroll');
    if (scrollContainer) {
      const scrollMaxHeight = isPortrait ? 69 : 60;
      scrollContainer.style.maxHeight = scrollMaxHeight + 'vh';
    }
  }
  
  const rewardsGrid = rewardsWindow.querySelector('#rewards-grid');
  if (!rewardsGrid) return;
  
  const columns = isPortrait ? 4 : 5;
  rewardsGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  
  rewardsGrid.innerHTML = '';
  
  const currentDayNumber = getDayNumber();
  const canClaim = canClaimToday();
  
  for (let day = 1; day <= TOTAL_DAYS; day++) {
    const rewardItem = document.createElement('div');
    rewardItem.className = 'reward-item';
    
    const isClaimed = rewardsState.claimedDays.includes(day);
    const isToday = canClaim && day === currentDayNumber;
    const isPast = day < currentDayNumber && !isClaimed;
    const isFuture = day > currentDayNumber;
    
    let state = 'future';
    if (isClaimed) {
      state = 'claimed';
    } else if (isToday) {
      state = 'today';
    } else if (isPast) {
      state = 'missed';
    }
    
    rewardItem.style.cssText = `
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 14.7px 9.8px;
      background: ${state === 'claimed' ? 'rgba(76, 175, 80, 0.3)' : state === 'today' ? 'rgba(255, 215, 0, 0.5)' : state === 'missed' ? 'rgba(158, 158, 158, 0.3)' : 'rgba(255, 255, 255, 0.2)'};
      border: 2px solid ${state === 'claimed' ? 'rgba(76, 175, 80, 0.8)' : state === 'today' ? 'rgba(255, 215, 0, 1)' : state === 'missed' ? 'rgba(158, 158, 158, 0.6)' : 'rgba(255, 255, 255, 0.4)'};
      border-radius: 11.76px;
      cursor: ${isToday ? 'pointer' : 'default'};
      transition: all 0.3s;
      opacity: ${state === 'future' ? '0.5' : '1'};
      min-height: 98px;
    `;
    
    const dayLabel = document.createElement('div');
    dayLabel.textContent = `${t('DAY')} ${day}`;
    dayLabel.style.cssText = `
      font-size: 11.76px;
      font-weight: bold;
      color: white;
      margin-bottom: 7.84px;
      font-family: 'Patsy', sans-serif;
      text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
    `;
    rewardItem.appendChild(dayLabel);
    
    const rewardAmount = document.createElement('div');
    rewardAmount.style.cssText = `
      display: flex;
      align-items: center;
      gap: 3.92px;
      font-size: 15.68px;
      font-weight: bold;
      color: white;
      font-family: 'Patsy', sans-serif;
      text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
    `;
    const coinIcon = document.createElement('img');
    coinIcon.src = './monet.png';
    coinIcon.style.cssText = 'width: 19.6px; height: 19.6px;';
    rewardAmount.appendChild(coinIcon);
    const rewardText = document.createElement('span');
    rewardText.textContent = getRewardForDay(day);
    rewardAmount.appendChild(rewardText);
    rewardItem.appendChild(rewardAmount);
    
    if (state === 'claimed') {
      const checkmark = document.createElement('div');
      checkmark.textContent = '✓';
      checkmark.style.cssText = `
        position: absolute;
        top: 4.9px;
        right: 4.9px;
        font-size: 19.6px;
        color: #4caf50;
        font-weight: bold;
      `;
      rewardItem.appendChild(checkmark);
    } else if (state === 'today') {
      const todayBadge = document.createElement('div');
      todayBadge.textContent = t('TODAY');
      todayBadge.style.cssText = `
        position: absolute;
        top: -7.84px;
        left: 50%;
        transform: translateX(-50%);
        background: #ff1744;
        color: white;
        font-size: 9.8px;
        font-weight: bold;
        padding: 1.96px 7.84px;
        border-radius: 9.8px;
        border: 2px solid white;
        font-family: 'Patsy', sans-serif;
        text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
        white-space: nowrap;
      `;
      rewardItem.appendChild(todayBadge);
    }
    
    if (isToday) {
      rewardItem.addEventListener('click', async () => {
        try {
          playSound('klik');
        } catch (e) {
        }
        
        const success = await claimReward(day);
        if (success) {
          const coinsDisplay = document.getElementById('menu-coins-display');
          if (coinsDisplay) {
            createCoinsAnimation(rewardItem, coinsDisplay, getRewardForDay(day));
          }
          
          setTimeout(() => {
            updateRewardsWindow();
            updateRewardsButton();
          }, 100);
        }
      });
      
      rewardItem.addEventListener('mouseenter', () => {
        rewardItem.style.background = 'rgba(255, 215, 0, 0.7)';
        rewardItem.style.transform = 'scale(1.05)';
      });
      
      rewardItem.addEventListener('mouseleave', () => {
        rewardItem.style.background = 'rgba(255, 215, 0, 0.5)';
        rewardItem.style.transform = 'scale(1)';
      });
    }
    
    rewardsGrid.appendChild(rewardItem);
  }
}

export async function initializeDailyRewards() {
  await loadRewardsState();
}

export function updateDailyRewardsDisplay() {
  updateRewardsButton();
  if (rewardsWindow) {
    updateRewardsWindow();
  }
}

