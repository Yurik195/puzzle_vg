import { getHintsCount, addHints } from './hints.js';
import { getTotalCoins, spendCoins } from './coins.js';
import { updateHintsDisplay } from './ui_layout.js';
import { getGameArea } from './ui_layout.js';
import { Game } from './game_logic.js';
import { playSound } from './audio.js';
import { showRewardedAd } from './ads_yandex.js';
import { t } from './localization.js';

let purchaseOverlay = null;

export function showHintsPurchaseWindow() {
  if (purchaseOverlay) {
    return;
  }

  if (Game) {
    Game.inputBlocked = true;
  }

  const gameArea = getGameArea();
  if (!gameArea) return;

  const gameRoot = document.getElementById('game-root');
  if (!gameRoot) return;

  purchaseOverlay = document.createElement('div');
  purchaseOverlay.id = 'hints-purchase-overlay';
  purchaseOverlay.style.cssText = `
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

  const purchaseCard = document.createElement('div');
  purchaseCard.style.cssText = `
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.98) 0%, rgba(255, 140, 0, 0.98) 100%);
    border-radius: 25px;
    padding: 40px;
    min-width: 320px;
    max-width: 400px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6),
                0 0 100px rgba(255, 215, 0, 0.4);
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
    hideHintsPurchaseWindow();
  });

  purchaseCard.appendChild(closeButton);

  const hintsInfo = document.createElement('div');
  hintsInfo.style.cssText = `
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

  const hintIcon = document.createElement('span');
  hintIcon.textContent = '🔍';
  hintIcon.style.cssText = 'font-size: 40px;';

  const hintCount = document.createElement('span');
  hintCount.textContent = '5';

  hintsInfo.appendChild(hintIcon);
  hintsInfo.appendChild(hintCount);

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
  buyButton.appendChild(document.createTextNode('500'));

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
    const price = 500;
    if (getTotalCoins() >= price) {
      await spendCoins(price);
      await addHints(5);
      const hintsCount = await getHintsCount();
      updateHintsDisplay(hintsCount);
      hideHintsPurchaseWindow();
    } else {
      buyButton.style.animation = 'shake 0.5s';
      setTimeout(() => {
        buyButton.style.animation = '';
      }, 500);
    }
  });

  const rewardButton = document.createElement('button');
  rewardButton.textContent = `3 ${t('HINTS')}`;
  rewardButton.style.cssText = `
    padding: 18px 35px;
    font-size: 17.1px;
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

  const rewardIcon = document.createElement('span');
  rewardIcon.textContent = '🎁';
  rewardIcon.style.cssText = 'font-size: 24px;';
  rewardButton.appendChild(rewardIcon);
  rewardButton.appendChild(document.createTextNode(`3 ${t('HINTS')}`));

  rewardButton.addEventListener('mouseenter', () => {
    rewardButton.style.background = 'rgba(255, 255, 255, 0.4)';
    rewardButton.style.transform = 'scale(1.05) translateY(-2px)';
    rewardButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
  });

  rewardButton.addEventListener('mouseleave', () => {
    rewardButton.style.background = 'rgba(255, 255, 255, 0.25)';
    rewardButton.style.transform = 'scale(1) translateY(0)';
    rewardButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
  });

  rewardButton.addEventListener('click', async () => {
    try {
      playSound('klik');
    } catch (e) {
    }
    const result = await showRewardedAd('hints_purchase');
    if (result.rewarded) {
      await addHints(3);
      const hintsCount = await getHintsCount();
      updateHintsDisplay(hintsCount);
      hideHintsPurchaseWindow();
    }
  });

  purchaseCard.appendChild(hintsInfo);
  buttonsContainer.appendChild(buyButton);
  buttonsContainer.appendChild(rewardButton);
  purchaseCard.appendChild(buttonsContainer);

  purchaseOverlay.appendChild(purchaseCard);
  gameRoot.appendChild(purchaseOverlay);

  purchaseOverlay.addEventListener('click', (e) => {
    if (e.target === purchaseOverlay) {
      hideHintsPurchaseWindow();
    }
  });

  const style = document.createElement('style');
  if (!document.getElementById('hints-purchase-styles')) {
    style.id = 'hints-purchase-styles';
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
    purchaseOverlay.style.opacity = '1';
    purchaseCard.style.animation = 'purchaseAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
  });

  const appearStyle = document.createElement('style');
  if (!document.getElementById('purchase-appear-styles')) {
    appearStyle.id = 'purchase-appear-styles';
    appearStyle.textContent = `
      @keyframes purchaseAppear {
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

export function hideHintsPurchaseWindow() {
  if (purchaseOverlay) {
    purchaseOverlay.style.opacity = '0';
    purchaseOverlay.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      if (purchaseOverlay) {
        purchaseOverlay.remove();
        purchaseOverlay = null;
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

