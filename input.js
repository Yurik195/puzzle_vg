import { screenToGameCoords } from './scale.js';
import { Game } from './game_logic.js';
import { isMenuVisible } from './main_menu.js';

const root = document.getElementById('game-root');

function init() {
  const rootElement = document.getElementById('game-root');
  if (!rootElement) {
    setTimeout(init, 100);
    return;
  }

  rootElement.addEventListener('pointerdown', (e) => {
    if (isMenuVisible()) {
      return;
    }
    const { x, y } = screenToGameCoords(e.clientX, e.clientY);
    Game.onPointerDown(x, y, e);
  });

  rootElement.addEventListener('pointerup', (e) => {
    if (isMenuVisible()) {
      return;
    }
    const { x, y } = screenToGameCoords(e.clientX, e.clientY);
    if (Game.onPointerUp) {
      Game.onPointerUp(x, y, e);
    }
  });

  rootElement.addEventListener('pointermove', (e) => {
    if (isMenuVisible()) {
      return;
    }
    const { x, y } = screenToGameCoords(e.clientX, e.clientY);
    if (Game.onPointerMove) {
      Game.onPointerMove(x, y, e);
    }
  });

  rootElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  rootElement.addEventListener('dragstart', (e) => {
    e.preventDefault();
  });

  rootElement.addEventListener('touchmove', (e) => {
    if (isMenuVisible()) {
      return;
    }
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('contextmenu', (e) => {
    if (rootElement.contains(e.target)) {
      e.preventDefault();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

