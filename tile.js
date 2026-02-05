export class Tile {
  constructor(image, sourceX, sourceY, sourceWidth, sourceHeight, correctGridCol, correctGridRow, tileWidth, tileHeight, puzzleWidth, puzzleHeight) {
    this.image = image;
    this.sourceX = sourceX;
    this.sourceY = sourceY;
    this.sourceWidth = sourceWidth;
    this.sourceHeight = sourceHeight;
    this.correctGridCol = correctGridCol;
    this.correctGridRow = correctGridRow;
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.puzzleWidth = puzzleWidth;
    this.puzzleHeight = puzzleHeight;
    
    this.currentGridCol = correctGridCol;
    this.currentGridRow = correctGridRow;
    
    this.currentX = 0;
    this.currentY = 0;
    
    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.inGroup = false;
    this.isGroupDrag = false;
    
    this.element = null;
    
    this.createElement();
  }
  
  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'puzzle-tile';
    
    let imageUrl = '';
    if (this.image && this.image.src) {
      imageUrl = this.image.src;
    } else if (this.image && this.image instanceof HTMLImageElement) {
      imageUrl = this.image.src;
    }
    
    const scaleX = this.puzzleWidth / this.image.width;
    const scaleY = this.puzzleHeight / this.image.height;
    
    const bgSize = `${this.puzzleWidth}px ${this.puzzleHeight}px`;
    const bgPosX = -this.sourceX * scaleX;
    const bgPosY = -this.sourceY * scaleY;
    const bgPos = `${bgPosX}px ${bgPosY}px`;
    
    this.element.style.cssText = `
      position: absolute;
      width: ${this.tileWidth}px;
      height: ${this.tileHeight}px;
      background-image: none;
      background-size: ${bgSize};
      background-position: ${bgPos};
      background-repeat: no-repeat;
      border: 2px solid rgba(255, 255, 255, 0.5);
      cursor: pointer;
      transition: left 0.2s ease, top 0.2s ease, transform 0.1s;
      z-index: 10;
      box-sizing: border-box;
      background-color: rgba(100, 100, 100, 0.3);
    `;
    
    this.imageUrl = imageUrl;
    
    this.updatePosition();
  }
  
  updatePosition() {
    if (!this.element) return;
    
    this.element.style.left = `${this.currentX}px`;
    this.element.style.top = `${this.currentY}px`;
    
    if (this.isDragging) {
      this.element.classList.remove('tile-drag-single', 'tile-drag-group');
      
      if (this.isGroupDrag) {
        this.element.classList.add('tile-drag-group');
        this.element.style.backgroundColor = 'transparent';
      } else {
        this.element.classList.add('tile-drag-single');
        this.element.style.backgroundColor = 'rgba(100, 100, 100, 0.3)';
      }
      
      this.element.style.removeProperty('box-shadow');
    } else {
      this.element.classList.remove('tile-drag-single', 'tile-drag-group');
      this.element.style.zIndex = '10';
      this.element.style.transform = 'scale(1)';
      this.element.style.removeProperty('box-shadow');
      this.element.style.setProperty('box-shadow', 'none', 'important');
      this.element.style.backgroundColor = 'rgba(100, 100, 100, 0.3)';
      this.element.style.transition = 'left 0.2s ease, top 0.2s ease, transform 0.2s';
    }
  }
  
  setInGroup(value) {
    this.inGroup = value;
  }
  
  setGridPosition(col, row, offsetX, offsetY) {
    this.currentGridCol = col;
    this.currentGridRow = row;
    this.currentX = offsetX + col * this.tileWidth;
    this.currentY = offsetY + row * this.tileHeight;
    this.updatePosition();
  }
  
  setGridPositionWithAnimation(col, row, offsetX, offsetY) {
    this.currentGridCol = col;
    this.currentGridRow = row;
    const targetX = offsetX + col * this.tileWidth;
    const targetY = offsetY + row * this.tileHeight;
    
    if (this.element) {
      this.element.style.transition = 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1), top 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s';
    }
    
    this.currentX = targetX;
    this.currentY = targetY;
    this.updatePosition();
  }
  
  startDrag(x, y, isGroup = false) {
    this.isDragging = true;
    this.isGroupDrag = isGroup;
    this.dragOffsetX = x - this.currentX;
    this.dragOffsetY = y - this.currentY;
    this.updatePosition();
  }
  
  updateDrag(x, y) {
    if (!this.isDragging) return;
    
    this.currentX = x - this.dragOffsetX;
    this.currentY = y - this.dragOffsetY;
    this.updatePosition();
  }
  
  endDrag() {
    this.isDragging = false;
    this.isGroupDrag = false;
    if (this.element) {
      this.element.classList.remove('tile-drag-single', 'tile-drag-group');
      this.element.style.zIndex = '10';
      this.element.style.transform = 'scale(1)';
      this.element.style.setProperty('box-shadow', 'none', 'important');
      this.element.style.transition = 'left 0.2s ease, top 0.2s ease, transform 0.2s';
    }
    this.updatePosition();
  }
  
  containsPoint(x, y) {
    return x >= this.currentX && 
           x <= this.currentX + this.tileWidth &&
           y >= this.currentY && 
           y <= this.currentY + this.tileHeight;
  }
  
  isInCorrectPosition() {
    return this.currentGridCol === this.correctGridCol && 
           this.currentGridRow === this.correctGridRow;
  }
  
  updateBorders(neighbors) {
    if (!this.element) return;
    
    const borderWidth = '2px';
    const borderStyle = 'solid';
    const borderColor = 'rgba(255, 255, 255, 0.5)';
    const borderNone = 'none';
    
    let borderTop = `${borderWidth} ${borderStyle} ${borderColor}`;
    let borderRight = `${borderWidth} ${borderStyle} ${borderColor}`;
    let borderBottom = `${borderWidth} ${borderStyle} ${borderColor}`;
    let borderLeft = `${borderWidth} ${borderStyle} ${borderColor}`;
    
    let hasAdjacentNeighbor = false;
    
    if (neighbors.top) {
      borderTop = borderNone;
      hasAdjacentNeighbor = true;
    }
    
    if (neighbors.right) {
      borderRight = borderNone;
      hasAdjacentNeighbor = true;
    }
    
    if (neighbors.bottom) {
      borderBottom = borderNone;
      hasAdjacentNeighbor = true;
    }
    
    if (neighbors.left) {
      borderLeft = borderNone;
      hasAdjacentNeighbor = true;
    }
    
    this.element.style.borderTop = borderTop;
    this.element.style.borderRight = borderRight;
    this.element.style.borderBottom = borderBottom;
    this.element.style.borderLeft = borderLeft;
    
    if (hasAdjacentNeighbor && this.isDragging) {
      this.element.style.backgroundColor = 'transparent';
    } else if (!this.isDragging) {
      this.element.style.backgroundColor = 'rgba(100, 100, 100, 0.3)';
    }
  }
  
  updateShadow(neighbors, isGroupDrag = false) {
    if (!this.element || !this.isDragging) return;
    
    this.element.style.removeProperty('box-shadow');
    this.element.style.setProperty('box-shadow', 'none', 'important');
    
    if (!neighbors) {
      return;
    }
    
    const hasTop = neighbors.top !== null && neighbors.top !== undefined;
    const hasRight = neighbors.right !== null && neighbors.right !== undefined;
    const hasBottom = neighbors.bottom !== null && neighbors.bottom !== undefined;
    const hasLeft = neighbors.left !== null && neighbors.left !== undefined;
    
    const shadowBlur = isGroupDrag ? 6 : 12;
    const shadowOpacity = isGroupDrag ? 0.25 : 0.35;
    const shadowSpread = isGroupDrag ? -2 : -3;
    const shadowY = isGroupDrag ? 3 : 4;
    
    const shadows = [];
    
    if (!hasTop) {
      shadows.push(`0 -${shadowY}px ${shadowBlur}px ${shadowSpread}px rgba(0, 0, 0, ${shadowOpacity})`);
    }
    if (!hasRight) {
      shadows.push(`${shadowY}px 0 ${shadowBlur}px ${shadowSpread}px rgba(0, 0, 0, ${shadowOpacity})`);
    }
    if (!hasBottom) {
      shadows.push(`0 ${shadowY}px ${shadowBlur}px ${shadowSpread}px rgba(0, 0, 0, ${shadowOpacity})`);
    }
    if (!hasLeft) {
      shadows.push(`-${shadowY}px 0 ${shadowBlur}px ${shadowSpread}px rgba(0, 0, 0, ${shadowOpacity})`);
    }
    
    if (shadows.length > 0) {
      this.element.style.setProperty('box-shadow', shadows.join(', '), 'important');
    } else {
      this.element.style.setProperty('box-shadow', 'none', 'important');
    }
  }
  
  setBackgroundImage() {
    if (this.element && this.imageUrl) {
      this.element.style.backgroundImage = `url("${this.imageUrl}")`;
    }
  }
  
  remove() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
