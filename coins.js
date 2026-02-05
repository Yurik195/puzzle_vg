import { saveToCloud, loadFromCloud } from './cloud_storage.js';

export const COINS_PER_LEVEL = 50;
const COINS_STORAGE_KEY = 'jigmerge_total_coins';

let totalCoins = 0;
let coinsDisplayElement = null;

async function loadCoins() {
  try {
    const stored = await loadFromCloud(COINS_STORAGE_KEY, 0);
    totalCoins = typeof stored === 'number' ? stored : 0;
  } catch (e) {
    console.warn('Failed to load coins:', e);
    totalCoins = 0;
  }
}

async function saveCoins() {
  try {
    await saveToCloud(COINS_STORAGE_KEY, totalCoins);
  } catch (e) {
    console.warn('Failed to save coins:', e);
  }
}

export async function initializeCoins() {
  await loadCoins();
  updateCoinsDisplay();
}

export async function addCoinsForLevel() {
  totalCoins += COINS_PER_LEVEL;
  await saveCoins();
  updateCoinsDisplay();
}

export async function addCoins(amount) {
  totalCoins += amount;
  await saveCoins();
  updateCoinsDisplay();
}

export function getTotalCoins() {
  return totalCoins;
}

export async function spendCoins(amount) {
  if (totalCoins >= amount) {
    totalCoins -= amount;
    await saveCoins();
    updateCoinsDisplay();
    return true;
  }
  return false;
}

export function setCoinsDisplayElement(element) {
  coinsDisplayElement = element;
  updateCoinsDisplay();
}

function updateCoinsDisplay() {
  if (coinsDisplayElement) {
    const coinText = coinsDisplayElement.querySelector('span');
    if (coinText) {
      coinText.textContent = totalCoins;
    } else {
      coinsDisplayElement.textContent = `Монеты: ${totalCoins}`;
    }
  }
  
  const menuCoinsDisplay = document.getElementById('menu-coins-display');
  if (menuCoinsDisplay) {
    menuCoinsDisplay.innerHTML = '';
    const coinIcon = document.createElement('img');
    coinIcon.src = './monet.png';
    coinIcon.style.cssText = 'width: 24px; height: 24px;';
    menuCoinsDisplay.appendChild(coinIcon);
    const coinText = document.createElement('span');
    coinText.textContent = totalCoins;
    menuCoinsDisplay.appendChild(coinText);
  }
}

