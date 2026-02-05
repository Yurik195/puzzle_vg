export function showCompletionEffect(puzzle) {
  const gameArea = document.getElementById('game-area');
  if (!gameArea) return;
  
  const container = document.createElement('div');
  container.id = 'completion-overlay';
  container.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2000;
    pointer-events: none;
    overflow: hidden;
  `;
  gameArea.appendChild(container);
  
  const puzzleContainer = document.createElement('div');
  puzzleContainer.id = 'completion-puzzle';
  puzzleContainer.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: ${puzzle.puzzleWidth}px;
    height: ${puzzle.puzzleHeight}px;
    transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  `;
  container.appendChild(puzzleContainer);
  
  const areaRect = gameArea.getBoundingClientRect();
  
  for (const tile of puzzle.tiles) {
    const tileClone = tile.element.cloneNode(true);
    tileClone.style.position = 'absolute';
    const relativeX = tile.currentX - puzzle.containerX;
    const relativeY = tile.currentY - puzzle.containerY;
    tileClone.style.left = `${relativeX}px`;
    tileClone.style.top = `${relativeY}px`;
    tileClone.style.border = 'none';
    tileClone.style.zIndex = '1';
    tileClone.style.transition = 'none';
    puzzleContainer.appendChild(tileClone);
  }
  
  const glow = document.createElement('div');
  glow.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: ${puzzle.puzzleWidth + 40}px;
    height: ${puzzle.puzzleHeight + 40}px;
    border-radius: 20px;
    box-shadow: 0 0 60px rgba(255, 215, 0, 0.8),
                0 0 100px rgba(255, 215, 0, 0.6),
                0 0 140px rgba(255, 215, 0, 0.4);
    opacity: 0;
    transition: opacity 0.5s ease;
    pointer-events: none;
  `;
  container.appendChild(glow);
  
  setTimeout(() => {
    puzzleContainer.style.animation = 'pulse 0.6s ease-in-out 3';
    glow.style.opacity = '1';
  }, 100);
  
  setTimeout(() => {
    puzzleContainer.style.animation = '';
    puzzleContainer.style.transform = 'translate(-50%, -50%) scale(1.05)';
    glow.style.width = `${(puzzle.puzzleWidth + 40) * 1.05}px`;
    glow.style.height = `${(puzzle.puzzleHeight + 40) * 1.05}px`;
    glow.style.boxShadow = '0 0 80px rgba(255, 215, 0, 1), 0 0 120px rgba(255, 215, 0, 0.8), 0 0 160px rgba(255, 215, 0, 0.6)';
    
    const areaRect = gameArea.getBoundingClientRect();
    createConfetti(container, areaRect.width, areaRect.height, puzzle.puzzleWidth, puzzle.puzzleHeight);
  }, 2000);
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { transform: translate(-50%, -50%) scale(1); }
      50% { transform: translate(-50%, -50%) scale(1.05); }
    }
  `;
  document.head.appendChild(style);
  
  return container;
}

function createConfetti(container, width, height, puzzleWidth, puzzleHeight) {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FFD93D'];
  const confettiCount = 60;
  
  const centerX = width / 2;
  const puzzleCenterX = centerX;
  const puzzleCenterY = height / 2;
  const puzzleLeft = puzzleCenterX - puzzleWidth / 2;
  const puzzleRight = puzzleCenterX + puzzleWidth / 2;
  const puzzleTop = puzzleCenterY - puzzleHeight / 2;
  const puzzleBottom = puzzleCenterY + puzzleHeight / 2;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 10 + 6;
    const side = i % 2 === 0 ? 'left' : 'right';
    
    const startX = side === 'left' ? puzzleLeft : puzzleRight;
    const startY = puzzleBottom;
    
    const targetX = puzzleCenterX + (Math.random() - 0.5) * puzzleWidth * 0.2;
    const targetY = puzzleCenterY - puzzleHeight * 0.15;
    
    const finalY = height + 50;
    const finalX = targetX + (Math.random() - 0.5) * 200;
    
    const rotation = (Math.random() - 0.5) * 1080;
    const delay = Math.random() * 0.4;
    
    confetti.style.cssText = `
      position: absolute;
      left: ${startX}px;
      top: ${startY}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 2px;
      opacity: 0;
      transform: rotate(0deg);
    `;
    
    container.appendChild(confetti);
    
    setTimeout(() => {
      confetti.style.transition = `left 1s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
                                   top 1s cubic-bezier(0.4, 0, 0.2, 1),
                                   opacity 0.4s ease,
                                   transform 1s linear`;
      confetti.style.opacity = '1';
      confetti.style.left = `${targetX}px`;
      confetti.style.top = `${targetY}px`;
      confetti.style.transform = `rotate(${rotation}deg)`;
      
      setTimeout(() => {
        const fallDistance = finalY - targetY;
        const fallTime = Math.sqrt(fallDistance / 500) * 1000;
        
        confetti.style.transition = `left ${fallTime}ms cubic-bezier(0.4, 0, 0.6, 1), 
                                     top ${fallTime}ms cubic-bezier(0.55, 0.06, 0.68, 0.19),
                                     transform ${fallTime}ms linear`;
        confetti.style.left = `${finalX}px`;
        confetti.style.top = `${finalY}px`;
        confetti.style.transform = `rotate(${rotation + 1080}deg)`;
        
        setTimeout(() => {
          confetti.style.transition = 'opacity 1s ease';
          confetti.style.opacity = '0';
          setTimeout(() => confetti.remove(), 1000);
        }, fallTime - 500);
      }, 1000);
    }, delay * 1000);
  }
}

export function removeCompletionEffect() {
  const overlay = document.getElementById('completion-overlay');
  if (overlay) {
    overlay.remove();
  }
}

