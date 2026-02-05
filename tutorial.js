import { getGameArea } from './ui_layout.js';
import { hasCompletedAnyLevel, isTutorialCompleted, markTutorialCompleted } from './progress.js';

let tutorialOverlay = null;
let tutorialAnimation = null;

export function shouldShowTutorial() {
  return !hasCompletedAnyLevel() && !isTutorialCompleted();
}

export function showTutorial() {
  if (!shouldShowTutorial()) {
    return;
  }

  const gameArea = getGameArea();
  if (!gameArea) return;

  if (tutorialOverlay) {
    return;
  }

  function startTutorialAnimation() {
    const tiles = document.querySelectorAll('.puzzle-tile');
    if (tiles.length < 2) {
      setTimeout(startTutorialAnimation, 100);
      return;
    }

    const firstTile = tiles[0];
    const secondTile = tiles[1];

    const firstRect = firstTile.getBoundingClientRect();
    const gameAreaRect = gameArea.getBoundingClientRect();
    const secondRect = secondTile.getBoundingClientRect();

    const startX = firstRect.left + firstRect.width / 2 - gameAreaRect.left;
    const startY = firstRect.top + firstRect.height / 2 - gameAreaRect.top;
    const endX = secondRect.left + secondRect.width / 2 - gameAreaRect.left;
    const endY = secondRect.top + secondRect.height / 2 - gameAreaRect.top;

    const finger = document.getElementById('tutorial-finger');
    if (!finger) return;

    finger.style.left = `${startX}px`;
    finger.style.top = `${startY}px`;

    let animationStep = 0;
    let isAnimating = false;

    function animateFinger() {
      if (!tutorialOverlay || !finger || isAnimating) return;
      isAnimating = true;

      if (animationStep === 0) {
        finger.style.transform = 'translate(-50%, -50%) scale(1)';
        setTimeout(() => {
          animationStep = 1;
          isAnimating = false;
          animateFinger();
        }, 500);
      } else if (animationStep === 1) {
        finger.style.transform = 'translate(-50%, -50%) scale(0.8)';
        finger.style.transition = 'all 0.2s ease';
        setTimeout(() => {
          animationStep = 2;
          isAnimating = false;
          animateFinger();
        }, 200);
      } else if (animationStep === 2) {
        finger.style.left = `${endX}px`;
        finger.style.top = `${endY}px`;
        finger.style.transform = 'translate(-50%, -50%) scale(1)';
        finger.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
          animationStep = 3;
          isAnimating = false;
          animateFinger();
        }, 1000);
      } else if (animationStep === 3) {
        finger.style.transform = 'translate(-50%, -50%) scale(0.8)';
        finger.style.transition = 'all 0.2s ease';
        setTimeout(() => {
          animationStep = 4;
          isAnimating = false;
          animateFinger();
        }, 200);
      } else if (animationStep === 4) {
        finger.style.left = `${startX}px`;
        finger.style.top = `${startY}px`;
        finger.style.transform = 'translate(-50%, -50%) scale(1)';
        finger.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
          animationStep = 0;
          isAnimating = false;
          setTimeout(() => {
            if (tutorialOverlay && finger) {
              animateFinger();
            }
          }, 500);
        }, 1000);
      }
    }

    animateFinger();
  }

  tutorialOverlay = document.createElement('div');
  tutorialOverlay.id = 'tutorial-overlay';
  tutorialOverlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 3000;
  `;

  const finger = document.createElement('div');
  finger.id = 'tutorial-finger';
  finger.textContent = '👆';
  finger.style.cssText = `
    position: absolute;
    font-size: 60px;
    pointer-events: none;
    z-index: 3001;
    transform: translate(-50%, -50%);
    transition: all 0.3s ease;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
  `;

  tutorialOverlay.appendChild(finger);
  gameArea.appendChild(tutorialOverlay);

  setTimeout(() => {
    startTutorialAnimation();
  }, 300);
}

export function hideTutorial() {
  if (tutorialOverlay) {
    if (tutorialAnimation) {
      clearInterval(tutorialAnimation);
      tutorialAnimation = null;
    }
    tutorialOverlay.remove();
    tutorialOverlay = null;
  }
}

