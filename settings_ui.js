import { getSoundEnabled, setSoundEnabled } from './settings.js';
import { muteAudio, unmuteAudio } from './audio.js';
import { playSound } from './audio.js';
import { t } from './localization.js';

let settingsOverlay = null;
let settingsVisible = false;

export async function showSettingsWindow() {
  if (settingsVisible) {
    return;
  }

  settingsVisible = true;
  const gameRoot = document.getElementById('game-root');
  if (!gameRoot) return;

  settingsOverlay = document.createElement('div');
  settingsOverlay.id = 'settings-overlay';
  settingsOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 5000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;

  const settingsCard = document.createElement('div');
  settingsCard.style.cssText = `
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
    hideSettingsWindow();
  });

  settingsCard.appendChild(closeButton);

  const title = document.createElement('div');
  title.textContent = t('SETTINGS');
  title.style.cssText = `
    font-size: 30.4px;
    font-weight: bold;
    color: white;
    margin-bottom: 30px;
    font-family: 'Patsy', sans-serif;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  `;
  settingsCard.appendChild(title);

  const soundContainer = document.createElement('div');
  soundContainer.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding: 15px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 15px;
  `;

  const soundLabel = document.createElement('div');
  soundLabel.textContent = `🔊 ${t('SOUNDS')}`;
  soundLabel.style.cssText = `
    font-size: 19px;
    font-weight: bold;
    color: white;
    font-family: 'Patsy', sans-serif;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  `;
  soundContainer.appendChild(soundLabel);

  const soundToggle = document.createElement('button');
  const soundEnabled = getSoundEnabled();
  soundToggle.textContent = soundEnabled ? t('ON') : t('OFF');
  soundToggle.style.cssText = `
    padding: 10px 20px;
    font-size: 17.1px;
    font-weight: bold;
    color: white;
    background: ${soundEnabled ? 'rgba(76, 175, 80, 0.8)' : 'rgba(255, 82, 82, 0.8)'};
    border: 2px solid rgba(255, 255, 255, 0.8);
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Patsy', sans-serif;
    transition: all 0.3s ease;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  `;

  soundToggle.addEventListener('mouseenter', () => {
    soundToggle.style.transform = 'scale(1.05)';
  });

  soundToggle.addEventListener('mouseleave', () => {
    soundToggle.style.transform = 'scale(1)';
  });

  soundToggle.addEventListener('click', async () => {
    try {
      playSound('klik');
    } catch (e) {
    }
    const newState = !getSoundEnabled();
    await setSoundEnabled(newState);
    
    if (newState) {
      unmuteAudio();
      soundToggle.textContent = t('ON');
      soundToggle.style.background = 'rgba(76, 175, 80, 0.8)';
    } else {
      muteAudio();
      soundToggle.textContent = t('OFF');
      soundToggle.style.background = 'rgba(255, 82, 82, 0.8)';
    }
  });

  soundContainer.appendChild(soundToggle);
  settingsCard.appendChild(soundContainer);

  settingsOverlay.appendChild(settingsCard);
  gameRoot.appendChild(settingsOverlay);

  settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) {
      hideSettingsWindow();
    }
  });

  requestAnimationFrame(() => {
    settingsOverlay.style.opacity = '1';
    settingsCard.style.animation = 'settingsAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
  });

  const appearStyle = document.createElement('style');
  if (!document.getElementById('settings-appear-styles')) {
    appearStyle.id = 'settings-appear-styles';
    appearStyle.textContent = `
      @keyframes settingsAppear {
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

export function hideSettingsWindow() {
  if (settingsOverlay) {
    settingsOverlay.style.opacity = '0';
    settingsOverlay.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      if (settingsOverlay) {
        settingsOverlay.remove();
        settingsOverlay = null;
      }
      settingsVisible = false;
    }, 300);
  } else {
    settingsVisible = false;
  }
}

