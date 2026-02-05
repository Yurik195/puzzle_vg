import { saveToCloud, loadFromCloud } from './cloud_storage.js';
import { addCoins } from './coins.js';
import { showRewardedAd } from './ads_yandex.js';
import { playSound } from './audio.js';
import { getIsPortraitMode } from './scale.js';

const GIFTS_STATE_KEY = 'jigmerge_gifts_state';

const GIFT_1_INTERVAL = 3600000;
const GIFT_1_REWARD = 50;
const GIFT_2_INTERVAL = 7200000;
const GIFT_2_REWARD = 200;

let giftsState = {
  gift1LastClaimed: 0,
  gift2LastClaimed: 0,
  gift2AdWatched: false
};

let giftsContainer = null;

async function loadGiftsState() {
  const stored = await loadFromCloud(GIFTS_STATE_KEY, null);
  if (stored) {
    giftsState = { ...giftsState, ...stored };
  }
}

async function saveGiftsState() {
  await saveToCloud(GIFTS_STATE_KEY, giftsState);
}

function getServerTime() {
  return Date.now();
}

function getTimeUntilGift1() {
  const now = getServerTime();
  const timeSinceLastClaim = now - giftsState.gift1LastClaimed;
  if (timeSinceLastClaim >= GIFT_1_INTERVAL) {
    return 0;
  }
  return GIFT_1_INTERVAL - timeSinceLastClaim;
}

function getTimeUntilGift2() {
  const now = getServerTime();
  const timeSinceLastClaim = now - giftsState.gift2LastClaimed;
  if (timeSinceLastClaim >= GIFT_2_INTERVAL) {
    return 0;
  }
  return GIFT_2_INTERVAL - timeSinceLastClaim;
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function createGiftButton(giftNumber, isAvailable, timeLeft) {
  const isPortrait = getIsPortraitMode();
  const scale = isPortrait ? 0.95 : 1;
  
  const button = document.createElement('div');
  button.className = `gift-button gift-${giftNumber}`;
  button.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${4.3 * scale}px;
    padding: ${8.6 * scale}px;
    background: ${isAvailable ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
    border: ${2 * scale}px solid ${isAvailable ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 255, 255, 0.3)'};
    border-radius: ${8.6 * scale}px;
    cursor: ${isAvailable ? 'pointer' : 'default'};
    transition: all 0.3s;
    opacity: ${isAvailable ? '1' : '0.6'};
    min-width: ${68 * scale}px;
  `;

  const icon = document.createElement('div');
  icon.textContent = giftNumber === 1 ? '🎁' : '🎁';
  icon.style.cssText = `
    font-size: ${27.4 * scale}px;
    position: relative;
  `;
  
  if (giftNumber === 2) {
    const adBadge = document.createElement('div');
    adBadge.textContent = 'AD';
    adBadge.style.cssText = `
      position: absolute;
      top: ${-4.3 * scale}px;
      right: ${-4.3 * scale}px;
      background: #ff1744;
      color: white;
      font-size: ${8.6 * scale}px;
      font-weight: bold;
      padding: ${1.7 * scale}px ${5.1 * scale}px;
      border-radius: ${6.8 * scale}px;
      border: ${2 * scale}px solid white;
      font-family: Arial, sans-serif;
      text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
      z-index: 10;
    `;
    icon.appendChild(adBadge);
  }
  
  button.appendChild(icon);

  const reward = document.createElement('div');
  reward.style.cssText = `
    display: flex;
    align-items: center;
    gap: ${3.4 * scale}px;
    font-size: ${12 * scale}px;
    font-weight: bold;
    color: white;
    font-family: 'Patsy', sans-serif;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  `;
  const coinIcon = document.createElement('img');
  coinIcon.src = './monet.png';
  coinIcon.style.cssText = `width: ${13.7 * scale}px; height: ${13.7 * scale}px;`;
  reward.appendChild(coinIcon);
  const rewardText = document.createElement('span');
  rewardText.textContent = `+${giftNumber === 1 ? GIFT_1_REWARD : GIFT_2_REWARD}`;
  reward.appendChild(rewardText);
  button.appendChild(reward);

  if (!isAvailable) {
    const timer = document.createElement('div');
    timer.className = 'gift-timer';
    timer.textContent = formatTime(timeLeft);
    timer.style.cssText = `
      font-size: ${9.4 * scale}px;
      color: rgba(255, 255, 255, 0.8);
      font-family: 'Patsy', sans-serif;
      text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
    `;
    button.appendChild(timer);
  }

  if (isAvailable) {
    button.addEventListener('click', async () => {
      try {
        playSound('klik');
      } catch (e) {
      }
      
      if (giftNumber === 1) {
        await claimGift1();
      } else {
        await claimGift2();
      }
    });

    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(255, 215, 0, 0.5)';
      button.style.transform = 'scale(1.05)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(255, 215, 0, 0.3)';
      button.style.transform = 'scale(1)';
    });
  }

  return button;
}

async function claimGift1() {
  const now = getServerTime();
  const timeSinceLastClaim = now - giftsState.gift1LastClaimed;
  
  if (timeSinceLastClaim < GIFT_1_INTERVAL) {
    return;
  }

  giftsState.gift1LastClaimed = now;
  await saveGiftsState();
  
  await addCoins(GIFT_1_REWARD);
  updateGiftsDisplay();
  
  const winSounds = ['win1', 'win2'];
  const randomWinSound = winSounds[Math.floor(Math.random() * winSounds.length)];
  try {
    playSound(randomWinSound);
  } catch (e) {
  }
}

async function claimGift2() {
  const now = getServerTime();
  const timeSinceLastClaim = now - giftsState.gift2LastClaimed;
  
  if (timeSinceLastClaim < GIFT_2_INTERVAL) {
    return;
  }

  if (!giftsState.gift2AdWatched) {
    const result = await showRewardedAd('gift2');
    if (!result.rewarded) {
      return;
    }
    giftsState.gift2AdWatched = true;
  }

  giftsState.gift2LastClaimed = now;
  giftsState.gift2AdWatched = false;
  await saveGiftsState();
  
  await addCoins(GIFT_2_REWARD);
  updateGiftsDisplay();
  
  const winSounds = ['win1', 'win2'];
  const randomWinSound = winSounds[Math.floor(Math.random() * winSounds.length)];
  try {
    playSound(randomWinSound);
  } catch (e) {
  }
}

export async function initializeGifts() {
  await loadGiftsState();
}

export function createGiftsContainer() {
  if (giftsContainer) {
    return giftsContainer;
  }

  giftsContainer = document.createElement('div');
  giftsContainer.id = 'gifts-container';
  giftsContainer.style.cssText = `
    position: absolute;
    left: 30px;
    top: 100px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 10;
  `;

  updateGiftsDisplay();
  return giftsContainer;
}

export function updateGiftsDisplay() {
  if (!giftsContainer) return;

  giftsContainer.innerHTML = '';

  const gift1Time = getTimeUntilGift1();
  const gift2Time = getTimeUntilGift2();
  const gift1Available = gift1Time === 0;
  const gift2Available = gift2Time === 0;

  const gift1Button = createGiftButton(1, gift1Available, gift1Time);
  giftsContainer.appendChild(gift1Button);

  const gift2Button = createGiftButton(2, gift2Available, gift2Time);
  giftsContainer.appendChild(gift2Button);

  if (!gift1Available || !gift2Available) {
    const updateInterval = setInterval(() => {
      const newGift1Time = getTimeUntilGift1();
      const newGift2Time = getTimeUntilGift2();
      const newGift1Available = newGift1Time === 0;
      const newGift2Available = newGift2Time === 0;

      if (newGift1Available !== gift1Available || newGift2Available !== gift2Available) {
        clearInterval(updateInterval);
        updateGiftsDisplay();
      } else {
        const timer1 = gift1Button.querySelector('.gift-timer');
        if (timer1) {
          timer1.textContent = formatTime(newGift1Time);
        }
        const timer2 = gift2Button.querySelector('.gift-timer');
        if (timer2) {
          timer2.textContent = formatTime(newGift2Time);
        }
      }
    }, 1000);
  }
}

export async function checkGift2Ad() {
  const now = getServerTime();
  const timeSinceLastClaim = now - giftsState.gift2LastClaimed;
  
  if (timeSinceLastClaim >= GIFT_2_INTERVAL && !giftsState.gift2AdWatched) {
    updateGiftsDisplay();
  }
}

