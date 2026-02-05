import { Tile } from './tile.js';
import { getGameArea, updateHintsDisplay } from './ui_layout.js';
import { playSound } from './audio.js';
import { generateDemoImage } from './utils.js';
import { getHintsCount, useHint } from './hints.js';
import { t } from './localization.js';
import { setStatusText } from './ui_layout.js';
import { showHintsPurchaseWindow } from './hints_purchase.js';
import { hideLoadingAnimation } from './loading_animation.js';

function showThumbsUpEmoji(tile) {
  if (!tile || !tile.element) return;
  
  const gameArea = getGameArea();
  if (!gameArea) return;
  
  const emoji = document.createElement('div');
  emoji.textContent = '👍';
  
  const tileX = tile.currentX + tile.tileWidth / 2;
  const tileY = tile.currentY - 10;
  
  emoji.style.cssText = `
    position: absolute;
    left: ${tileX}px;
    top: ${tileY}px;
    font-size: 28.5px;
    pointer-events: none;
    z-index: 2000;
    transform: translate(-50%, -100%) scale(0);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), 
                opacity 0.3s ease,
                top 0.8s ease;
    opacity: 0;
  `;
  
  gameArea.appendChild(emoji);
  
  requestAnimationFrame(() => {
    emoji.style.transform = 'translate(-50%, -100%) scale(1)';
    emoji.style.opacity = '1';
    
    setTimeout(() => {
      emoji.style.top = `${tile.currentY - 50}px`;
      emoji.style.opacity = '0';
      
      setTimeout(() => {
        emoji.remove();
      }, 800);
    }, 200);
  });
}

export class Puzzle {
  constructor() {
    this.image = null;
    this.tiles = [];
    this.rows = 4;
    this.cols = 4;
    this.tileWidth = 0;
    this.tileHeight = 0;
    this.containerX = 0;
    this.containerY = 0;
    this.draggedTile = null;
    this.draggedGroup = null;
    this.isComplete = false;
    this.grid = null;
    this.groups = [];
    this.swapSoundPlayed = false;
  }
  
  async loadImage(imagePath) {
    return new Promise(async (resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.image = img;
        resolve(img);
      };
      img.onerror = async () => {
        try {
          const demoImg = await generateDemoImage();
          this.image = demoImg;
          resolve(demoImg);
        } catch (e) {
          reject(e);
        }
      };
      img.src = imagePath;
      
      if (img.complete && img.naturalWidth > 0) {
        this.image = img;
        resolve(img);
      }
    });
  }
  
  createPuzzle(imagePath, rows = 4, cols = 4) {
    this.rows = rows;
    this.cols = cols;
    
    console.log(`Creating puzzle: ${imagePath}, ${rows}x${cols}`);
    
    return this.loadImage(imagePath).then(() => {
      return this.createPuzzleFromImage(this.image, rows, cols);
    }).catch(error => {
      console.error('Error creating puzzle:', error);
      hideLoadingAnimation();
      throw error;
    });
  }

  createPuzzleFromImage(image, rows = 4, cols = 4) {
    return new Promise((resolve, reject) => {
      try {
        console.log('[createPuzzleFromImage] Starting, image:', image ? 'present' : 'null');
        this.rows = rows;
        this.cols = cols;
        this.image = image;
        
        if (!image) {
          console.error('[createPuzzleFromImage] No image provided');
          reject(new Error('No image provided'));
          return;
        }
        
        const checkImageReady = () => {
          if (image.complete && image.naturalWidth > 0) {
            requestAnimationFrame(() => {
              createTiles();
            });
          } else {
            image.onload = () => {
              requestAnimationFrame(() => {
                createTiles();
              });
            };
            image.onerror = () => {
              console.error('[createPuzzleFromImage] Image failed to load');
              reject(new Error('Image failed to load'));
            };
          }
        };
        
        const createTiles = () => {
          console.log(`[createPuzzleFromImage] Creating puzzle from image: ${rows}x${cols}`);
          console.log('[createPuzzleFromImage] Image loaded:', this.image.width, 'x', this.image.height);
          
          const gameArea = getGameArea();
          if (!gameArea) {
            console.error('[createPuzzleFromImage] Game area not found');
            reject(new Error('Game area not found'));
            return;
          }
          
          const oldTiles = gameArea.querySelectorAll('.puzzle-tile');
          oldTiles.forEach(tile => {
            if (tile.parentNode) {
              tile.parentNode.removeChild(tile);
            }
          });
          
          const areaWidth = gameArea.offsetWidth;
          const areaHeight = gameArea.offsetHeight;
          console.log('[createPuzzleFromImage] Game area size:', areaWidth, 'x', areaHeight);
          
          const imageAspect = this.image.height / this.image.width;
          const areaAspect = areaHeight / areaWidth;
          
          let puzzleWidth, puzzleHeight;
          
          if (imageAspect > areaAspect) {
            puzzleHeight = areaHeight * 0.9;
            puzzleWidth = puzzleHeight / imageAspect;
          } else {
            puzzleWidth = areaWidth * 0.9;
            puzzleHeight = puzzleWidth * imageAspect;
          }
          
          this.tileWidth = Math.floor(puzzleWidth / this.cols);
          this.tileHeight = Math.floor(puzzleHeight / this.rows);
          
          puzzleWidth = this.tileWidth * this.cols;
          puzzleHeight = this.tileHeight * this.rows;
          
          console.log('[createPuzzleFromImage] Tile size:', this.tileWidth, 'x', this.tileHeight);
          
          const sourceTileWidth = this.image.width / this.cols;
          const sourceTileHeight = this.image.height / this.rows;
          
          this.containerX = (areaWidth - puzzleWidth) / 2;
          this.containerY = (areaHeight - puzzleHeight) / 2;
          
          console.log('[createPuzzleFromImage] Puzzle center at:', this.containerX, this.containerY);
          
          this.puzzleWidth = puzzleWidth;
          this.puzzleHeight = puzzleHeight;
          this.imageWidth = this.image.width;
          this.imageHeight = this.image.height;
          
          this.tiles = [];
          this.grid = [];
          
          for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
              const sourceX = col * sourceTileWidth;
              const sourceY = row * sourceTileHeight;
              
              const tile = new Tile(
                this.image,
                sourceX,
                sourceY,
                sourceTileWidth,
                sourceTileHeight,
                col,
                row,
                this.tileWidth,
                this.tileHeight,
                puzzleWidth,
                puzzleHeight
              );
              
              tile.element.style.opacity = '0';
              tile.element.style.visibility = 'hidden';
              this.tiles.push(tile);
              this.grid[row][col] = tile;
            }
          }
          
          console.log(`[createPuzzleFromImage] Created ${this.tiles.length} tiles`);
          
          console.log('[createPuzzleFromImage] Shuffling tiles...');
          this.shuffleTiles();
          console.log('[createPuzzleFromImage] Tiles shuffled');
          
          console.log('[createPuzzleFromImage] Recalculating groups...');
          this.recalculateGroups();
          console.log('[createPuzzleFromImage] Groups recalculated, total groups:', this.groups.length);
          
          console.log('[createPuzzleFromImage] Updating borders...');
          this.updateAllBorders();
          console.log('[createPuzzleFromImage] Borders updated');
          
          console.log('[createPuzzleFromImage] Puzzle created successfully');
          
          requestAnimationFrame(() => {
            for (const tile of this.tiles) {
              tile.setBackgroundImage();
              gameArea.appendChild(tile.element);
            }
            
            requestAnimationFrame(() => {
              hideLoadingAnimation();
              
              requestAnimationFrame(() => {
                for (const tile of this.tiles) {
                  tile.element.style.transition = 'opacity 0.3s ease';
                  tile.element.style.visibility = 'visible';
                  tile.element.style.opacity = '1';
                }
              });
            });
          });
          
          resolve();
        };
        
        checkImageReady();
      } catch (error) {
        console.error('[createPuzzleFromImage] Outer error:', error);
        console.error(error.stack);
        reject(error);
      }
    });
  }
  
  shuffleTiles() {
    const shuffledTiles = [...this.tiles];
    
    for (let i = shuffledTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledTiles[i], shuffledTiles[j]] = [shuffledTiles[j], shuffledTiles[i]];
    }
    
    let index = 0;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const tile = shuffledTiles[index];
        tile.setGridPosition(col, row, this.containerX, this.containerY);
        this.grid[row][col] = tile;
        index++;
      }
    }
    
    console.log('Tiles shuffled');
  }
  
  getTileAtGridPosition(col, row) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return null;
    }
    return this.grid[row][col];
  }
  
  getTileAtScreenPosition(x, y, excludeTile = null) {
    const gameArea = getGameArea();
    if (!gameArea) return null;
    
    const gameRoot = document.getElementById('game-root');
    if (!gameRoot) return null;
    
    const rootRect = gameRoot.getBoundingClientRect();
    const areaRect = gameArea.getBoundingClientRect();
    
    const rootX = rootRect.left;
    const rootY = rootRect.top;
    const areaX = areaRect.left;
    const areaY = areaRect.top;
    
    const areaXInRoot = (areaX - rootX) / (rootRect.width / gameRoot.offsetWidth);
    const areaYInRoot = (areaY - rootY) / (rootRect.height / gameRoot.offsetHeight);
    
    const relativeX = x - areaXInRoot;
    const relativeY = y - areaYInRoot;
    
    const gridCol = Math.floor((relativeX - this.containerX) / this.tileWidth);
    const gridRow = Math.floor((relativeY - this.containerY) / this.tileHeight);
    
    if (gridRow >= 0 && gridRow < this.rows && gridCol >= 0 && gridCol < this.cols) {
      const tile = this.grid[gridRow][gridCol];
      if (tile && tile !== excludeTile) {
        return tile;
      }
    }
    
    for (let i = this.tiles.length - 1; i >= 0; i--) {
      const tile = this.tiles[i];
      if (tile === excludeTile) continue;
      if (tile.containsPoint(relativeX, relativeY)) {
        return tile;
      }
    }
    
    return null;
  }
  
  getGroupForTile(tile) {
    for (const group of this.groups) {
      if (group.includes(tile)) {
        return group;
      }
    }
    return null;
  }
  
  recalculateGroups() {
    this.groups = [];
    const processed = new Set();
    
    for (const tile of this.tiles) {
      if (processed.has(tile)) continue;
      
      const group = this.buildGroupFromTile(tile);
      if (group.length > 0) {
        this.groups.push(group);
        for (const t of group) {
          processed.add(t);
        }
      }
    }
    
    this.updateGroupVisuals();
  }
  
  buildGroupFromTile(startTile) {
    const group = [];
    const visited = new Set();
    const queue = [startTile];
    visited.add(startTile);
    
    while (queue.length > 0) {
      const tile = queue.shift();
      group.push(tile);
      
      const neighbors = this.getCorrectNeighbors(tile);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    
    return group;
  }
  
  getCorrectNeighbors(tile) {
    const neighbors = [];
    const currentCol = tile.currentGridCol;
    const currentRow = tile.currentGridRow;
    const correctCol = tile.correctGridCol;
    const correctRow = tile.correctGridRow;
    
    const directions = [
      { dCol: 0, dRow: -1, expectedDCol: 0, expectedDRow: -1 },
      { dCol: 1, dRow: 0, expectedDCol: 1, expectedDRow: 0 },
      { dCol: 0, dRow: 1, expectedDCol: 0, expectedDRow: 1 },
      { dCol: -1, dRow: 0, expectedDCol: -1, expectedDRow: 0 }
    ];
    
    for (const dir of directions) {
      const neighborCol = currentCol + dir.dCol;
      const neighborRow = currentRow + dir.dRow;
      
      if (neighborRow >= 0 && neighborRow < this.rows && neighborCol >= 0 && neighborCol < this.cols) {
        const neighbor = this.grid[neighborRow][neighborCol];
        if (neighbor) {
          const expectedCorrectCol = correctCol + dir.expectedDCol;
          const expectedCorrectRow = correctRow + dir.expectedDRow;
          
          if (neighbor.correctGridCol === expectedCorrectCol && neighbor.correctGridRow === expectedCorrectRow) {
            neighbors.push(neighbor);
          }
        }
      }
    }
    
    return neighbors;
  }
  
  updateGroupVisuals() {
    for (const tile of this.tiles) {
      tile.setInGroup(false);
    }
  }
  
  swapTiles(tile1, tile2) {
    if (!tile1 || !tile2 || tile1 === tile2) return;
    
    this.swapSingleTiles(tile1, tile2);
    
    this.recalculateGroups();
    this.updateAllBorders();
  }
  
  swapSingleTiles(tile1, tile2) {
    const col1 = tile1.currentGridCol;
    const row1 = tile1.currentGridRow;
    const col2 = tile2.currentGridCol;
    const row2 = tile2.currentGridRow;
    
    this.grid[row1][col1] = tile2;
    this.grid[row2][col2] = tile1;
    
    tile1.endDrag();
    tile2.endDrag();
    
    tile1.setGridPositionWithAnimation(col2, row2, this.containerX, this.containerY);
    tile2.setGridPositionWithAnimation(col1, row1, this.containerX, this.containerY);
    
    if (!this.swapSoundPlayed) {
      this.swapSoundPlayed = true;
      const swapSounds = ['vz1', 'vz2', 'vz3', 'vz4'];
      const randomSound = swapSounds[Math.floor(Math.random() * swapSounds.length)];
      try {
        playSound(randomSound);
      } catch (e) {
      }
      setTimeout(() => {
        this.swapSoundPlayed = false;
      }, 500);
    }
  }
  
  handleGroupDrop(group, screenX, screenY) {
    if (!this.anchorTile) {
      console.log('[handleGroupDrop] No anchor tile');
      return false;
    }
    
    const targetCells = this.getTargetCellsForGroup(group, screenX, screenY);
    
    if (!targetCells || targetCells.length === 0) {
      console.log('[handleGroupDrop] No target cells');
      return false;
    }
    
    if (targetCells.length !== group.length) {
      console.log('[handleGroupDrop] Target cells count mismatch:', targetCells.length, 'vs', group.length);
      return false;
    }
    
    for (const cell of targetCells) {
      if (cell.col < 0 || cell.col >= this.cols || cell.row < 0 || cell.row >= this.rows) {
        console.log('[handleGroupDrop] Target cell out of bounds:', cell);
        return false;
      }
    }
    
    const oldCells = [];
    const groupSet = new Set(group);
    
    for (const tile of group) {
      const originalPos = this.groupOriginalPositions.get(tile);
      if (!originalPos) {
        console.log('[handleGroupDrop] No original position for tile');
        return false;
      }
      
      oldCells.push({
        col: originalPos.col,
        row: originalPos.row,
        tile: tile
      });
    }
    
    const targetCellsSet = new Set();
    for (const cell of targetCells) {
      const key = `${cell.row},${cell.col}`;
      if (targetCellsSet.has(key)) {
        console.log('[handleGroupDrop] Duplicate target cell:', cell);
        return false;
      }
      targetCellsSet.add(key);
    }
    
    let hasMovement = false;
    for (let i = 0; i < oldCells.length; i++) {
      if (oldCells[i].col !== targetCells[i].col || oldCells[i].row !== targetCells[i].row) {
        hasMovement = true;
        break;
      }
    }
    
    if (!hasMovement) {
      console.log('[handleGroupDrop] No movement detected');
      return false;
    }
    
    const backupGrid = [];
    for (let row = 0; row < this.rows; row++) {
      backupGrid[row] = [];
      for (let col = 0; col < this.cols; col++) {
        backupGrid[row][col] = this.grid[row][col];
      }
    }
    
    const minRow = Math.min(...targetCells.map(c => c.row));
    const maxRow = Math.max(...targetCells.map(c => c.row));
    const minCol = Math.min(...targetCells.map(c => c.col));
    const maxCol = Math.max(...targetCells.map(c => c.col));
    
    const destinationRect = {
      minRow,
      maxRow,
      minCol,
      maxCol
    };
    
    console.log('[handleGroupDrop] Destination rect:', destinationRect);
    console.log('[handleGroupDrop] Group size:', group.length);
    console.log('[handleGroupDrop] Old cells:', oldCells.map(c => `${c.row},${c.col}`));
    console.log('[handleGroupDrop] Target cells:', targetCells.map(c => `${c.row},${c.col}`));
    
    const oldCellsSet = new Set();
    for (const oldCell of oldCells) {
      const key = `${oldCell.row},${oldCell.col}`;
      oldCellsSet.add(key);
    }
    
    const tilesToEvict = [];
    const destinationCells = new Set();
    
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const key = `${row},${col}`;
        destinationCells.add(key);
        
        if (targetCellsSet.has(key)) {
          const tile = backupGrid[row][col];
          if (tile && !groupSet.has(tile)) {
            tilesToEvict.push({
              tile: tile,
              row: row,
              col: col
            });
          }
        }
      }
    }
    
    console.log('[handleGroupDrop] Tiles to evict:', tilesToEvict.length);
    
    const emptyCells = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const key = `${row},${col}`;
        const isTargetCell = targetCellsSet.has(key);
        const isOldGroupCell = oldCellsSet.has(key);
        const hasTile = backupGrid[row][col] !== null;
        
        if (isTargetCell) {
          continue;
        }
        
        if (isOldGroupCell || !hasTile) {
          emptyCells.push({ row, col });
        }
      }
    }
    
    console.log('[handleGroupDrop] Empty cells:', emptyCells.length);
    
    if (emptyCells.length < tilesToEvict.length) {
      console.log('[handleGroupDrop] Not enough empty cells for evicted tiles');
      this.restoreGrid(backupGrid);
      return false;
    }
    
    const evictMoves = new Map();
    const usedEmptyCells = new Set();
    
    for (const evict of tilesToEvict) {
      let bestCell = null;
      let bestDistance = Infinity;
      
      for (const empty of emptyCells) {
        const key = `${empty.row},${empty.col}`;
        if (usedEmptyCells.has(key)) continue;
        
        const distance = Math.abs(empty.row - evict.row) + Math.abs(empty.col - evict.col);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestCell = empty;
        }
      }
      
      if (!bestCell) {
        console.log('[handleGroupDrop] Could not find empty cell for evicted tile');
        this.restoreGrid(backupGrid);
        return false;
      }
      
      const key = `${bestCell.row},${bestCell.col}`;
      usedEmptyCells.add(key);
      evictMoves.set(evict.tile, bestCell);
    }
    
    const tileMoves = new Map();
    
    for (let i = 0; i < oldCells.length; i++) {
      const oldCell = oldCells[i];
      const newCell = targetCells[i];
      if (oldCell.col !== newCell.col || oldCell.row !== newCell.row) {
        tileMoves.set(oldCell.tile, newCell);
      }
    }
    
    for (const [tile, newPos] of evictMoves) {
      tileMoves.set(tile, newPos);
    }
    
    console.log('[handleGroupDrop] Total moves:', tileMoves.size);
    
    const newGrid = [];
    for (let row = 0; row < this.rows; row++) {
      newGrid[row] = [];
      for (let col = 0; col < this.cols; col++) {
        newGrid[row][col] = null;
      }
    }
    
    for (const [tile, newPos] of tileMoves) {
      if (newGrid[newPos.row][newPos.col] !== null) {
        console.log('[handleGroupDrop] Conflict: two tiles want same cell:', newPos);
        this.restoreGrid(backupGrid);
        return false;
      }
      newGrid[newPos.row][newPos.col] = tile;
    }
    
    const movedTiles = new Set(tileMoves.keys());
    
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (newGrid[row][col] === null) {
          const originalTile = backupGrid[row][col];
          if (!movedTiles.has(originalTile)) {
            newGrid[row][col] = originalTile;
          } else {
            console.log('[handleGroupDrop] Missing tile for cell:', row, col);
            this.restoreGrid(backupGrid);
            return false;
          }
        }
      }
    }
    
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.grid[row][col] = newGrid[row][col];
      }
    }
    
    for (const [tile, newPos] of tileMoves) {
      tile.setGridPositionWithAnimation(newPos.col, newPos.row, this.containerX, this.containerY);
    }
    
    if (!this.validateGrid()) {
      console.log('[handleGroupDrop] Grid validation failed');
      this.restoreGrid(backupGrid);
      return false;
    }
    
    if (!this.swapSoundPlayed) {
      this.swapSoundPlayed = true;
      const swapSounds = ['vz1', 'vz2', 'vz3', 'vz4'];
      const randomSound = swapSounds[Math.floor(Math.random() * swapSounds.length)];
      try {
        playSound(randomSound);
      } catch (e) {
      }
      setTimeout(() => {
        this.swapSoundPlayed = false;
      }, 500);
    }
    
    this.recalculateGroups();
    this.updateAllBorders();
    
    return true;
  }
  
  restoreGrid(backupGrid) {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.grid[row][col] = backupGrid[row][col];
      }
    }
    for (const tile of this.tiles) {
      tile.setGridPosition(tile.currentGridCol, tile.currentGridRow, this.containerX, this.containerY);
    }
    this.recalculateGroups();
    this.updateAllBorders();
  }
  
  validateGrid() {
    const tileSet = new Set();
    let tileCount = 0;
    
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const tile = this.grid[row][col];
        if (!tile) {
          return false;
        }
        if (tileSet.has(tile)) {
          return false;
        }
        tileSet.add(tile);
        tileCount++;
        
        if (tile.currentGridCol !== col || tile.currentGridRow !== row) {
          return false;
        }
      }
    }
    
    if (tileCount !== this.tiles.length) {
      return false;
    }
    
    return true;
  }
  
  getTargetCellsForGroup(group, screenX, screenY) {
    if (!this.anchorTile) return null;
    
    const gameArea = getGameArea();
    if (!gameArea) return null;
    
    const gameRoot = document.getElementById('game-root');
    if (!gameRoot) return null;
    
    const rootRect = gameRoot.getBoundingClientRect();
    const areaRect = gameArea.getBoundingClientRect();
    
    const rootX = rootRect.left;
    const rootY = rootRect.top;
    const areaX = areaRect.left;
    const areaY = areaRect.top;
    
    const areaXInRoot = (areaX - rootX) / (rootRect.width / gameRoot.offsetWidth);
    const areaYInRoot = (areaY - rootY) / (rootRect.height / gameRoot.offsetHeight);
    
    const relativeX = screenX - areaXInRoot;
    const relativeY = screenY - areaYInRoot;
    
    const targetCol = Math.floor((relativeX - this.containerX) / this.tileWidth);
    const targetRow = Math.floor((relativeY - this.containerY) / this.tileHeight);
    
    const anchorOriginalPos = this.groupOriginalPositions.get(this.anchorTile);
    if (!anchorOriginalPos) return null;
    
    const targetCells = [];
    for (const tile of group) {
      const offset = this.groupOffsets.get(tile);
      if (!offset) return null;
      
      const newCol = targetCol + offset.col;
      const newRow = targetRow + offset.row;
      
      targetCells.push({ col: newCol, row: newRow });
    }
    
    return targetCells;
  }
  
  updateAllBorders() {
    for (const tile of this.tiles) {
      const currentCol = tile.currentGridCol;
      const currentRow = tile.currentGridRow;
      const correctCol = tile.correctGridCol;
      const correctRow = tile.correctGridRow;
      
      const tileGroup = this.getGroupForTile(tile);
      
      let topNeighbor = null;
      let rightNeighbor = null;
      let bottomNeighbor = null;
      let leftNeighbor = null;
      
      const topTile = this.getTileAtGridPosition(currentCol, currentRow - 1);
      const rightTile = this.getTileAtGridPosition(currentCol + 1, currentRow);
      const bottomTile = this.getTileAtGridPosition(currentCol, currentRow + 1);
      const leftTile = this.getTileAtGridPosition(currentCol - 1, currentRow);
      
      if (topTile) {
        const topTileGroup = this.getGroupForTile(topTile);
        const isInSameGroup = tileGroup && topTileGroup && tileGroup === topTileGroup;
        const isCorrectNeighbor = topTile.correctGridRow === correctRow - 1 && topTile.correctGridCol === correctCol;
        if (isInSameGroup || isCorrectNeighbor) {
          topNeighbor = topTile;
        }
      }
      
      if (rightTile) {
        const rightTileGroup = this.getGroupForTile(rightTile);
        const isInSameGroup = tileGroup && rightTileGroup && tileGroup === rightTileGroup;
        const isCorrectNeighbor = rightTile.correctGridRow === correctRow && rightTile.correctGridCol === correctCol + 1;
        if (isInSameGroup || isCorrectNeighbor) {
          rightNeighbor = rightTile;
        }
      }
      
      if (bottomTile) {
        const bottomTileGroup = this.getGroupForTile(bottomTile);
        const isInSameGroup = tileGroup && bottomTileGroup && tileGroup === bottomTileGroup;
        const isCorrectNeighbor = bottomTile.correctGridRow === correctRow + 1 && bottomTile.correctGridCol === correctCol;
        if (isInSameGroup || isCorrectNeighbor) {
          bottomNeighbor = bottomTile;
        }
      }
      
      if (leftTile) {
        const leftTileGroup = this.getGroupForTile(leftTile);
        const isInSameGroup = tileGroup && leftTileGroup && tileGroup === leftTileGroup;
        const isCorrectNeighbor = leftTile.correctGridRow === correctRow && leftTile.correctGridCol === correctCol - 1;
        if (isInSameGroup || isCorrectNeighbor) {
          leftNeighbor = leftTile;
        }
      }
      
      tile.updateBorders({
        top: topNeighbor,
        right: rightNeighbor,
        bottom: bottomNeighbor,
        left: leftNeighbor
      });
    }
  }
  
  onPointerDown(x, y) {
    const gameArea = getGameArea();
    if (!gameArea) return;
    
    const gameRoot = document.getElementById('game-root');
    if (!gameRoot) return;
    
    const rootRect = gameRoot.getBoundingClientRect();
    const areaRect = gameArea.getBoundingClientRect();
    
    const rootX = rootRect.left;
    const rootY = rootRect.top;
    const areaX = areaRect.left;
    const areaY = areaRect.top;
    
    const areaXInRoot = (areaX - rootX) / (rootRect.width / gameRoot.offsetWidth);
    const areaYInRoot = (areaY - rootY) / (rootRect.height / gameRoot.offsetHeight);
    
    const relativeX = x - areaXInRoot;
    const relativeY = y - areaYInRoot;
    
    const tile = this.getTileAtScreenPosition(x, y);
    if (tile) {
      this.draggedTile = tile;
      const group = this.getGroupForTile(tile);
      this.draggedGroup = group;
      
      if (group && group.length > 1) {
        this.anchorTile = tile;
        
        this.groupOriginalPositions = new Map();
        this.groupOffsets = new Map();
        
        const anchorCol = tile.currentGridCol;
        const anchorRow = tile.currentGridRow;
        
        for (const t of group) {
          this.groupOriginalPositions.set(t, {
            col: t.currentGridCol,
            row: t.currentGridRow
          });
          
          const deltaCol = t.currentGridCol - anchorCol;
          const deltaRow = t.currentGridRow - anchorRow;
          this.groupOffsets.set(t, {
            col: deltaCol,
            row: deltaRow
          });
        }
        
        const baseX = tile.currentX;
        const baseY = tile.currentY;
        
        const groupSet = new Set(group);
        for (const t of group) {
          const offsetX = t.currentX - baseX;
          const offsetY = t.currentY - baseY;
          t.groupOffsetX = offsetX;
          t.groupOffsetY = offsetY;
          t.startDrag(relativeX - offsetX, relativeY - offsetY, true);
          
          const neighbors = this.getGroupNeighbors(t, groupSet);
          t.updateShadow(neighbors, true);
          t.updateBorders(neighbors);
        }
      } else {
        tile.startDrag(relativeX, relativeY, false);
        const neighbors = this.getGroupNeighbors(tile, new Set([tile]));
        tile.updateShadow(neighbors, false);
        tile.updateBorders(neighbors);
      }
      
      try {
        playSound('klik');
      } catch (e) {
      }
    }
  }
  
  onPointerMove(x, y) {
    if (!this.draggedTile) return;
    
    const gameArea = getGameArea();
    if (!gameArea) return;
    
    const gameRoot = document.getElementById('game-root');
    if (!gameRoot) return;
    
    const rootRect = gameRoot.getBoundingClientRect();
    const areaRect = gameArea.getBoundingClientRect();
    
    const rootX = rootRect.left;
    const rootY = rootRect.top;
    const areaX = areaRect.left;
    const areaY = areaRect.top;
    
    const areaXInRoot = (areaX - rootX) / (rootRect.width / gameRoot.offsetWidth);
    const areaYInRoot = (areaY - rootY) / (rootRect.height / gameRoot.offsetHeight);
    
    const relativeX = x - areaXInRoot;
    const relativeY = y - areaYInRoot;
    
    if (this.draggedGroup && this.draggedGroup.length > 1) {
      const groupSet = new Set(this.draggedGroup);
      for (const tile of this.draggedGroup) {
        const offsetX = tile.groupOffsetX || 0;
        const offsetY = tile.groupOffsetY || 0;
        tile.updateDrag(relativeX - offsetX, relativeY - offsetY);
        
        const neighbors = this.getGroupNeighbors(tile, groupSet);
        tile.updateShadow(neighbors, true);
        tile.updateBorders(neighbors);
      }
    } else {
      this.draggedTile.updateDrag(relativeX, relativeY);
      const neighbors = this.getGroupNeighbors(this.draggedTile, new Set([this.draggedTile]));
      this.draggedTile.updateShadow(neighbors, false);
      this.draggedTile.updateBorders(neighbors);
    }
  }
  
  getGroupNeighbors(tile, groupSet) {
    const correctCol = tile.correctGridCol;
    const correctRow = tile.correctGridRow;
    
    let topNeighbor = null;
    let rightNeighbor = null;
    let bottomNeighbor = null;
    let leftNeighbor = null;
    
    for (const otherTile of groupSet) {
      if (otherTile === tile) continue;
      
      const otherCorrectCol = otherTile.correctGridCol;
      const otherCorrectRow = otherTile.correctGridRow;
      
      if (otherCorrectRow === correctRow - 1 && otherCorrectCol === correctCol) {
        topNeighbor = otherTile;
      } else if (otherCorrectRow === correctRow && otherCorrectCol === correctCol + 1) {
        rightNeighbor = otherTile;
      } else if (otherCorrectRow === correctRow + 1 && otherCorrectCol === correctCol) {
        bottomNeighbor = otherTile;
      } else if (otherCorrectRow === correctRow && otherCorrectCol === correctCol - 1) {
        leftNeighbor = otherTile;
      }
    }
    
    return {
      top: topNeighbor,
      right: rightNeighbor,
      bottom: bottomNeighbor,
      left: leftNeighbor
    };
  }
  
  onPointerUp(x, y) {
    if (!this.draggedTile) return;
    
    const gameArea = getGameArea();
    if (!gameArea) return;
    
    const tile = this.draggedTile;
    const group = this.draggedGroup;
    this.draggedTile = null;
    this.draggedGroup = null;
    
    if (group && group.length > 1) {
      let maxGroupSizeBefore = 0;
      for (const g of this.groups) {
        if (g.length > maxGroupSizeBefore) {
          maxGroupSizeBefore = g.length;
        }
      }
      
      const success = this.handleGroupDrop(group, x, y);
      if (!success) {
        for (const t of group) {
          const originalPos = this.groupOriginalPositions.get(t);
          if (originalPos) {
            t.setGridPosition(originalPos.col, originalPos.row, this.containerX, this.containerY);
          }
          t.endDrag();
        }
        this.recalculateGroups();
        this.updateAllBorders();
      } else {
        for (const t of group) {
          t.endDrag();
        }
        
        let maxGroupSizeAfter = 0;
        for (const g of this.groups) {
          if (g.length > maxGroupSizeAfter) {
            maxGroupSizeAfter = g.length;
          }
        }
        
        if (maxGroupSizeAfter > maxGroupSizeBefore) {
          try {
            playSound('podsk');
          } catch (e) {
          }
        }
        
        if (Math.random() < 0.01) {
          const centerTile = group[Math.floor(group.length / 2)];
          showThumbsUpEmoji(centerTile);
        }
      }
      this.groupOriginalPositions = null;
      this.groupOffsets = null;
      this.anchorTile = null;
    } else {
      const targetTile = this.getTileAtScreenPosition(x, y, tile);
      
      if (targetTile && targetTile !== tile) {
        let maxGroupSizeBefore = 0;
        for (const g of this.groups) {
          if (g.length > maxGroupSizeBefore) {
            maxGroupSizeBefore = g.length;
          }
        }
        
        tile.endDrag();
        this.swapTiles(tile, targetTile);
        
        let maxGroupSizeAfter = 0;
        for (const g of this.groups) {
          if (g.length > maxGroupSizeAfter) {
            maxGroupSizeAfter = g.length;
          }
        }
        
        if (maxGroupSizeAfter > maxGroupSizeBefore) {
          try {
            playSound('podsk');
          } catch (e) {
          }
          
          if (Math.random() < 0.05) {
            showThumbsUpEmoji(tile);
          }
        }
      } else {
        tile.setGridPosition(tile.currentGridCol, tile.currentGridRow, this.containerX, this.containerY);
        tile.endDrag();
        this.recalculateGroups();
        this.updateAllBorders();
      }
    }
  }
  
  checkCompletion() {
    let allCorrect = true;
    for (const tile of this.tiles) {
      if (!tile.isInCorrectPosition()) {
        allCorrect = false;
        break;
      }
    }
    
    if (allCorrect && !this.isComplete) {
      console.log('Puzzle completed!');
      this.isComplete = true;
      this.updateAllBorders();
      return true;
    }
    
    return false;
  }
  
  reset() {
    this.isComplete = false;
    this.draggedTile = null;
    this.draggedGroup = null;
    
    for (const tile of this.tiles) {
      tile.endDrag();
    }
    
    this.shuffleTiles();
    this.recalculateGroups();
    this.updateAllBorders();
  }
  
  destroy() {
    for (const tile of this.tiles) {
      tile.remove();
    }
    
    this.tiles = [];
    this.grid = null;
    this.draggedTile = null;
  }
  
  canMergeTiles(tile1, tile2) {
    if (!tile1 || !tile2 || tile1 === tile2) return false;
    
    const group1 = this.getGroupForTile(tile1);
    const group2 = this.getGroupForTile(tile2);
    
    if (group1 === group2 && group1 && group1.length > 1) {
      return false;
    }
    
    const correctCol1 = tile1.correctGridCol;
    const correctRow1 = tile1.correctGridRow;
    const correctCol2 = tile2.correctGridCol;
    const correctRow2 = tile2.correctGridRow;
    
    const isNeighbor = 
      (correctRow1 === correctRow2 && Math.abs(correctCol1 - correctCol2) === 1) ||
      (correctCol1 === correctCol2 && Math.abs(correctRow1 - correctRow2) === 1);
    
    if (!isNeighbor) return false;
    
    const correctNeighbors1 = this.getCorrectNeighbors(tile1);
    if (correctNeighbors1.includes(tile2)) {
      return false;
    }
    
    const currentCol1 = tile1.currentGridCol;
    const currentRow1 = tile1.currentGridRow;
    const currentCol2 = tile2.currentGridCol;
    const currentRow2 = tile2.currentGridRow;
    
    const areAdjacent = 
      (currentRow1 === currentRow2 && Math.abs(currentCol1 - currentCol2) === 1) ||
      (currentCol1 === currentCol2 && Math.abs(currentRow1 - currentRow2) === 1);
    
    return areAdjacent;
  }
  
  isGroupInCorrectPosition(group) {
    for (const tile of group) {
      if (tile.currentGridCol !== tile.correctGridCol || 
          tile.currentGridRow !== tile.correctGridRow) {
        return false;
      }
    }
    return true;
  }
  
  getGroupBounds(group) {
    let minCol = Infinity;
    let maxCol = -Infinity;
    let minRow = Infinity;
    let maxRow = -Infinity;
    
    for (const tile of group) {
      minCol = Math.min(minCol, tile.currentGridCol);
      maxCol = Math.max(maxCol, tile.currentGridCol);
      minRow = Math.min(minRow, tile.currentGridRow);
      maxRow = Math.max(maxRow, tile.currentGridRow);
    }
    
    return { minCol, maxCol, minRow, maxRow };
  }
  
  getCorrectBounds(group) {
    let minCol = Infinity;
    let maxCol = -Infinity;
    let minRow = Infinity;
    let maxRow = -Infinity;
    
    for (const tile of group) {
      minCol = Math.min(minCol, tile.correctGridCol);
      maxCol = Math.max(maxCol, tile.correctGridCol);
      minRow = Math.min(minRow, tile.correctGridRow);
      maxRow = Math.max(maxRow, tile.correctGridRow);
    }
    
    return { minCol, maxCol, minRow, maxRow };
  }
  
  findHintGroup() {
    const processed = new Set();
    
    for (const tile of this.tiles) {
      if (processed.has(tile)) continue;
      
      const group = this.getGroupForTile(tile);
      if (!group || group.length === 0) continue;
      
      for (const t of group) {
        processed.add(t);
      }
      
      if (!this.isGroupInCorrectPosition(group)) {
        return group;
      }
    }
    
    return null;
  }
  
  highlightGroupAndTarget(group) {
    if (!group || group.length === 0) return;
    
    for (const tile of group) {
      if (tile && tile.element) {
        tile.element.classList.add('hint-group-tile');
      }
    }
    
    const currentBounds = this.getGroupBounds(group);
    const correctBounds = this.getCorrectBounds(group);
    
    const currentX = this.containerX + currentBounds.minCol * this.tileWidth;
    const currentY = this.containerY + currentBounds.minRow * this.tileHeight;
    const currentWidth = (currentBounds.maxCol - currentBounds.minCol + 1) * this.tileWidth;
    const currentHeight = (currentBounds.maxRow - currentBounds.minRow + 1) * this.tileHeight;
    
    const currentCenterX = currentX + currentWidth / 2;
    const currentCenterY = currentY + currentHeight / 2;
    
    const targetX = this.containerX + correctBounds.minCol * this.tileWidth;
    const targetY = this.containerY + correctBounds.minRow * this.tileHeight;
    const targetWidth = (correctBounds.maxCol - correctBounds.minCol + 1) * this.tileWidth;
    const targetHeight = (correctBounds.maxRow - correctBounds.minRow + 1) * this.tileHeight;
    
    const targetCenterX = targetX + targetWidth / 2;
    const targetCenterY = targetY + targetHeight / 2;
    
    const gameArea = getGameArea();
    if (!gameArea) return;
    
    const targetOverlay = document.createElement('div');
    targetOverlay.className = 'hint-target-overlay';
    targetOverlay.style.cssText = `
      position: absolute;
      left: ${targetX}px;
      top: ${targetY}px;
      width: ${targetWidth}px;
      height: ${targetHeight}px;
      border: 4px solid rgba(0, 255, 0, 0.9);
      background: rgba(0, 255, 0, 0.2);
      border-radius: 8px;
      pointer-events: none;
      z-index: 400;
      box-shadow: 0 0 20px rgba(0, 255, 0, 0.6),
                  0 0 40px rgba(0, 255, 0, 0.4),
                  inset 0 0 20px rgba(0, 255, 0, 0.3);
      animation: hint-target-pulse 1.5s ease-in-out;
    `;
    gameArea.appendChild(targetOverlay);
    
    const dx = targetCenterX - currentCenterX;
    const dy = targetCenterY - currentCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 20) {
      const arrowId = `arrow-${Date.now()}-${Math.random()}`;
      const arrow = document.createElement('div');
      arrow.className = 'hint-arrow';
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      
      arrow.style.cssText = `
        position: absolute;
        left: ${currentCenterX}px;
        top: ${currentCenterY}px;
        width: ${distance}px;
        height: 20px;
        transform-origin: left center;
        transform: rotate(${angle}deg);
        pointer-events: none;
        z-index: 401;
      `;
      
      arrow.innerHTML = `
        <svg width="${distance}" height="20" style="position: absolute; top: 0; left: 0;">
          <defs>
            <marker id="${arrowId}" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <polygon points="0 0, 12 6, 0 12" fill="rgba(0, 255, 0, 0.9)" />
            </marker>
            <filter id="glow-${arrowId}">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <line x1="5" y1="10" x2="${Math.max(distance - 15, 5)}" y2="10" 
                stroke="rgba(0, 255, 0, 0.9)" 
                stroke-width="5" 
                marker-end="url(#${arrowId})"
                filter="url(#glow-${arrowId})" />
        </svg>
      `;
      gameArea.appendChild(arrow);
      
      setTimeout(() => {
        if (arrow.parentNode) {
          arrow.remove();
        }
      }, 2000);
    }
    
    setTimeout(() => {
      for (const tile of group) {
        if (tile && tile.element) {
          tile.element.classList.remove('hint-group-tile');
        }
      }
      if (targetOverlay.parentNode) {
        targetOverlay.remove();
      }
      if (arrow.parentNode) {
        arrow.remove();
      }
    }, 2000);
  }
  
  async showHint() {
    const { getHintsCount } = await import('./hints.js');
    const hintsCount = await getHintsCount();
    if (hintsCount === 0) {
      showHintsPurchaseWindow();
      return;
    }
    
    const hintGroup = this.findHintGroup();
    
    if (hintGroup && hintGroup.length > 0) {
      this.highlightGroupAndTarget(hintGroup);
      const { useHint } = await import('./hints.js');
      const used = await useHint();
      if (used) {
        const newCount = await getHintsCount();
        updateHintsDisplay(newCount);
        try {
          playSound('connectP');
        } catch (e) {
        }
      }
    } else {
      setStatusText(t('EASY_PUZZLE'));
      setTimeout(() => {
        setStatusText('');
      }, 2000);
    }
  }
}
