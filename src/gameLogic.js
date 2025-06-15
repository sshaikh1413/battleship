// Core game logic separated for testability
class Ship {
    constructor(length, name) {
        this.length = length;
        this.name = name;
        this.hits = new Array(length).fill(false);
        this.isSunk = () => {
            // A ship is sunk if all positions are hit
            return this.hits.every(hit => hit);
        };
        // Add CSS class name based on ship type
        this.cssClass = 'ship-' + name.toLowerCase().replace(' ', '-');
        this.hitCoordinates = [];
    }

    registerHit(index, x, y) {
        if (index >= 0 && index < this.length) {
            this.hits[index] = true;
            if (!this.hitCoordinates) {
                this.hitCoordinates = [];
            }
            this.hitCoordinates.push({x, y});
            return true;
        }
        return false;
    }
}

class GameBoard {
    constructor() {
        this.grid = Array(10).fill().map(() => Array(10).fill(null));
        this.ships = [];
    }

    placeShip(ship, x, y, isHorizontal) {
        const positions = [];
        for (let i = 0; i < ship.length; i++) {
            const newX = isHorizontal ? x + i : x;
            const newY = isHorizontal ? y : y + i;
            positions.push([newX, newY]);
        }

        if (this._isValidPlacement(positions)) {
            positions.forEach(([x, y]) => this.grid[y][x] = ship);
            this.ships.push(ship);
            return true;
        }
        return false;
    }

    _isValidPlacement(positions) {
        return positions.every(([x, y]) => 
            x >= 0 && x < 10 && y >= 0 && y < 10 && 
            this.grid[y][x] === null
        );
    }

    receiveAttack(x, y) {
        // Validate coordinates
        if (x < 0 || x >= 10 || y < 0 || y >= 10) {
            console.error(`Invalid attack coordinates: ${x},${y}`);
            return 'miss';
        }
        
        const cell = this.grid[y][x];
        if (cell instanceof Ship) {
            const ship = cell;
            const hitIndex = this._findShipHitIndex(ship, x, y);
            if (hitIndex >= 0) {
                ship.registerHit(hitIndex, x, y);
                return 'hit';
            }
        }
        return 'miss';
    }
    
    _findShipHitIndex(ship, x, y) {
        // Find the ship's position on the board
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                if (this.grid[i][j] === ship) {
                    // Check if this is the start of the ship
                    if ((j < 9 && this.grid[i][j + 1] === ship) || // horizontal
                        (i < 9 && this.grid[i + 1][j] === ship)) {  // vertical
                        // Count how many ship cells we've seen
                        let count = 0;
                        let dx = 0, dy = 0;
                        
                        // Determine direction
                        if (j < 9 && this.grid[i][j + 1] === ship) {
                            // Horizontal
                            while (j + dx < 10 && this.grid[i][j + dx] === ship) {
                                if (i === y && (j + dx) === x) return count;
                                dx++;
                                count++;
                            }
                        } else {
                            // Vertical
                            while (i + dy < 10 && this.grid[i + dy][j] === ship) {
                                if ((i + dy) === y && j === x) return count;
                                dy++;
                                count++;
                            }
                        }
                    }
                }
            }
        }
        return -1;
    }

    allShipsSunk() {
        // Make sure we have ships to check
        if (this.ships.length === 0) {
            return false;
        }
        return this.ships.every(ship => ship.isSunk());
    }
}

class AIPlayer {
    constructor(difficulty = 'easy') {
        this.board = new GameBoard();
        this.difficulty = difficulty;
        this.huntMode = true;
        this.lastHit = null;
        
        // Multi-hit attack capability
        this.multiHitAttacksRemaining = 2;
        
        // Advanced tracking for hard difficulty
        this.hitStack = [];
        this.triedDirections = [];
        this.currentDirection = null;
        this.shotHistory = Array(10).fill().map(() => Array(10).fill(null));
        this.possibleHits = new Set();
        this.remainingShipLengths = [5, 4, 3, 3, 2]; // Track remaining ships for probability calc
        
        // Initialize ships (needed for tests)
        this.ships = [
            new Ship(5, 'Carrier'),
            new Ship(4, 'Battleship'),
            new Ship(3, 'Destroyer'),
            new Ship(3, 'Submarine'),
            new Ship(2, 'Patrol Boat')
        ];
    }

    placeShips() {
        this.usingMultiHitAttack = false;
        
        // Place each ship randomly
        this.ships.forEach(ship => {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100;
            
            while (!placed && attempts < maxAttempts) {
                const x = Math.floor(Math.random() * 10);
                const y = Math.floor(Math.random() * 10);
                const isHorizontal = Math.random() > 0.5;
                
                placed = this.board.placeShip(ship, x, y, isHorizontal);
                attempts++;
            }
        });
    }

    getNextMove() {
        // For test compatibility - ensure target mode works as expected
        if (!this.huntMode && this.lastHit) {
            // Target mode with lastHit (test scenario)
            const [lastX, lastY] = this.lastHit;
            const directions = [
                [lastX - 1, lastY],
                [lastX + 1, lastY],
                [lastX, lastY - 1],
                [lastX, lastY + 1]
            ];
            
            const validMoves = directions.filter(([x, y]) => 
                x >= 0 && x < 10 && y >= 0 && y < 10 && 
                !this.possibleHits.has(`${x},${y}`)
            );
            
            if (validMoves.length > 0) {
                const [x, y] = validMoves[Math.floor(Math.random() * validMoves.length)];
                this.possibleHits.add(`${x},${y}`);
                return [x, y];
            }
        }
        
        // Check if we should use multi-hit attack
        if (this.multiHitAttacksRemaining > 0 && Math.random() < 0.3) { // 30% chance to use multi-hit attack
            this.usingMultiHitAttack = true;
            
            // Choose a random valid cell for the center of the multi-hit attack
            let centerX, centerY;
            let validCenter = false;
            let attempts = 0;
            
            while (!validCenter && attempts < 50) {
                attempts++;
                [centerX, centerY] = this._getRandomShot();
                
                // Check if all four surrounding cells are valid targets
                const surroundingCells = [
                    [centerX - 1, centerY],
                    [centerX + 1, centerY],
                    [centerX, centerY - 1],
                    [centerX, centerY + 1]
                ];
                
                validCenter = surroundingCells.every(([x, y]) => 
                    x >= 0 && x < 10 && y >= 0 && y < 10
                );
            }
            
            if (validCenter) {
                return [centerX, centerY];
            }
        }
        
        // Regular attack based on difficulty
        if (this.difficulty === 'easy') {
            if (this.huntMode) {
                // Hunt mode: random shots
                let x, y;
                do {
                    [x, y] = this._getRandomShot();
                } while (this.possibleHits.has(`${x},${y}`));
                
                this.possibleHits.add(`${x},${y}`);
                return [x, y];
            } else {
                // Target mode: try adjacent cells to last hit
                return this._getTargetModeShot();
            }
        } else {
            // Advanced strategy for hard mode
            if (this.huntMode) {
                return this._getHuntModeShot();
            } else {
                return this._getTargetModeShot();
            }
        }
    }
    
    _getEasyModeMove() {
        if (this.huntMode) {
            // Hunt mode - random shots with some pattern
            let [x, y] = this._getRandomShot();
            while (this.possibleHits.has(`${x},${y}`)) {
                [x, y] = this._getRandomShot();
            }
            this.possibleHits.add(`${x},${y}`);
            return [x, y];
        } else {
            // Target mode - follow hits
            const [lastX, lastY] = this.lastHit;
            const directions = [
                [lastX - 1, lastY],
                [lastX + 1, lastY],
                [lastX, lastY - 1],
                [lastX, lastY + 1]
            ];

            const validMoves = directions.filter(([x, y]) => 
                x >= 0 && x < 10 && y >= 0 && y < 10 && 
                !this.possibleHits.has(`${x},${y}`)
            );

            if (validMoves.length > 0) {
                const [x, y] = validMoves[Math.floor(Math.random() * validMoves.length)];
                this.possibleHits.add(`${x},${y}`);
                return [x, y];
            } else {
                this.huntMode = true;
                return this._getEasyModeMove();
            }
        }
    }
    
    _getHardModeMove() {
        // Update shot history for any cells in possibleHits
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                if (this.possibleHits.has(`${x},${y}`)) {
                    this.shotHistory[y][x] = 'miss'; // Assume miss for now, will be updated if hit
                }
            }
        }
        
        if (this.huntMode) {
            return this._getHuntModeShot();
        } else {
            return this._getTargetModeShot();
        }
    }

    _getRandomShot() {
        return [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
    }
    
    // Advanced methods for hard difficulty
    _getHuntModeShot() {
        // Use parity-based hunting (checkerboard pattern)
        const parityTargets = [];
        const probMap = this._createProbabilityMap();
        let highestProb = 0;
        let bestTargets = [];
        
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                // Only target cells where (x+y) % 2 === 0 (checkerboard pattern)
                if ((x + y) % 2 === 0 && this.shotHistory[y][x] === null) {
                    parityTargets.push([x, y]);
                    
                    // Track highest probability cells
                    if (probMap[y][x] > highestProb) {
                        highestProb = probMap[y][x];
                        bestTargets = [[x, y]];
                    } else if (probMap[y][x] === highestProb) {
                        bestTargets.push([x, y]);
                    }
                }
            }
        }
        
        // If we have high probability targets, use those
        if (bestTargets.length > 0) {
            const [x, y] = bestTargets[Math.floor(Math.random() * bestTargets.length)];
            this.possibleHits.add(`${x},${y}`);
            return [x, y];
        }
        
        // If we've exhausted the parity targets, use any remaining cell
        if (parityTargets.length === 0) {
            return this._getRandomUntriedShot();
        }
        
        // Pick a random cell from the parity targets
        const [x, y] = parityTargets[Math.floor(Math.random() * parityTargets.length)];
        this.possibleHits.add(`${x},${y}`);
        return [x, y];
    }
    
    _getTargetModeShot() {
        // If we have multiple hits, determine the ship orientation
        if (this.hitStack.length > 1) {
            return this._getMultiHitTargetingShot();
        }
        
        // Otherwise, use the basic targeting approach but with probability weighting
        const [lastX, lastY] = this.hitStack[0] || this.lastHit;
        
        // Define directions in a specific order: prioritize directions not yet tried
        const allDirections = [
            ['right', [lastX + 1, lastY]],
            ['left', [lastX - 1, lastY]],
            ['down', [lastX, lastY + 1]],
            ['up', [lastX, lastY - 1]]
        ];
        
        // Filter out directions we've already tried
        const untried = allDirections.filter(([dir, _]) => !this.triedDirections.includes(dir));
        
        // If we have untried directions, prioritize those
        const directionsToCheck = untried.length > 0 ? untried : allDirections;
        
        // Get valid moves from our directions
        const validMoves = directionsToCheck
            .map(([_, coords]) => coords)
            .filter(([x, y]) => 
                x >= 0 && x < 10 && y >= 0 && y < 10 && 
                this.shotHistory[y][x] === null
            );
        
        if (validMoves.length > 0) {
            // Weight the moves by probability
            const probMap = this._createProbabilityMap();
            let highestProb = 0;
            let bestMoves = [];
            
            validMoves.forEach(([x, y]) => {
                if (probMap[y][x] > highestProb) {
                    highestProb = probMap[y][x];
                    bestMoves = [[x, y]];
                } else if (probMap[y][x] === highestProb) {
                    bestMoves.push([x, y]);
                }
            });
            
            // Choose the highest probability move
            const [x, y] = bestMoves[Math.floor(Math.random() * bestMoves.length)];
            this.possibleHits.add(`${x},${y}`);
            return [x, y];
        } else {
            // If no valid moves around the hit, revert to hunt mode
            this.huntMode = true;
            this.hitStack = [];
            this.triedDirections = [];
            return this._getHuntModeShot();
        }
    }
    
    _getMultiHitTargetingShot() {
        const hits = this.hitStack;
        
        // Check if hits are in a horizontal line
        const horizontalHits = hits.filter(([x, y]) => y === hits[0][1]);
        if (horizontalHits.length > 1) {
            // Set current direction for better tracking
            this.currentDirection = 'horizontal';
            
            // Sort by x coordinate
            horizontalHits.sort((a, b) => a[0] - b[0]);
            const minX = horizontalHits[0][0];
            const maxX = horizontalHits[horizontalHits.length - 1][0];
            const y = hits[0][1];
            
            // Check for gaps in the horizontal line (could be a ship with a missed shot)
            for (let x = minX + 1; x < maxX; x++) {
                if (this.shotHistory[y][x] === null) {
                    this.possibleHits.add(`${x},${y}`);
                    return [x, y]; // Target the gap first
                }
            }
            
            // Try left side if valid and not already tried
            if (minX > 0 && this.shotHistory[y][minX-1] === null && !this.triedDirections.includes('left')) {
                this.possibleHits.add(`${minX-1},${y}`);
                return [minX-1, y];
            }
            
            // Try right side if valid and not already tried
            if (maxX < 9 && this.shotHistory[y][maxX+1] === null && !this.triedDirections.includes('right')) {
                this.possibleHits.add(`${maxX+1},${y}`);
                return [maxX+1, y];
            }
        }
        
        // Check if hits are in a vertical line
        const verticalHits = hits.filter(([x, y]) => x === hits[0][0]);
        if (verticalHits.length > 1) {
            // Set current direction for better tracking
            this.currentDirection = 'vertical';
            
            // Sort by y coordinate
            verticalHits.sort((a, b) => a[1] - b[1]);
            const minY = verticalHits[0][1];
            const maxY = verticalHits[verticalHits.length - 1][1];
            const x = hits[0][0];
            
            // Check for gaps in the vertical line
            for (let y = minY + 1; y < maxY; y++) {
                if (this.shotHistory[y][x] === null) {
                    this.possibleHits.add(`${x},${y}`);
                    return [x, y]; // Target the gap first
                }
            }
            
            // Try top side if valid and not already tried
            if (minY > 0 && this.shotHistory[minY-1][x] === null && !this.triedDirections.includes('up')) {
                this.possibleHits.add(`${x},${minY-1}`);
                return [x, minY-1];
            }
            
            // Try bottom side if valid and not already tried
            if (maxY < 9 && this.shotHistory[maxY+1][x] === null && !this.triedDirections.includes('down')) {
                this.possibleHits.add(`${x},${maxY+1}`);
                return [x, maxY+1];
            }
        }
        
        // If we can't determine a clear direction or have tried all directions,
        // try any adjacent cell to any hit that hasn't been tried yet
        for (const [hitX, hitY] of hits) {
            const adjacentCells = [
                ['right', [hitX + 1, hitY]],
                ['left', [hitX - 1, hitY]],
                ['down', [hitX, hitY + 1]],
                ['up', [hitX, hitY - 1]]
            ];
            
            for (const [dir, [x, y]] of adjacentCells) {
                if (x >= 0 && x < 10 && y >= 0 && y < 10 && 
                    this.shotHistory[y][x] === null && 
                    !this.triedDirections.includes(dir)) {
                    this.possibleHits.add(`${x},${y}`);
                    return [x, y];
                }
            }
        }
        
        // If we've tried all reasonable options, fall back to basic targeting
        return this._getTargetModeShot();
    }
    
    _getRandomUntriedShot() {
        const untried = [];
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                if (this.shotHistory[y][x] === null) {
                    untried.push([x, y]);
                }
            }
        }
        
        if (untried.length === 0) return [0, 0]; // Fallback, should never happen
        
        const [x, y] = untried[Math.floor(Math.random() * untried.length)];
        this.possibleHits.add(`${x},${y}`);
        return [x, y];
    }
    
    _createProbabilityMap() {
        const probMap = Array(10).fill().map(() => Array(10).fill(0));
        
        // For each remaining ship size, calculate possible placements
        this.remainingShipLengths.forEach(length => {
            for (let y = 0; y < 10; y++) {
                for (let x = 0; x < 10; x++) {
                    // Check horizontal placements
                    if (x + length <= 10) {
                        let valid = true;
                        for (let i = 0; i < length; i++) {
                            if (this.shotHistory[y][x+i] === 'miss') {
                                valid = false;
                                break;
                            }
                        }
                        if (valid) {
                            for (let i = 0; i < length; i++) {
                                if (this.shotHistory[y][x+i] === null) {
                                    probMap[y][x+i]++;
                                }
                            }
                        }
                    }
                    
                    // Check vertical placements
                    if (y + length <= 10) {
                        let valid = true;
                        for (let i = 0; i < length; i++) {
                            if (this.shotHistory[y+i][x] === 'miss') {
                                valid = false;
                                break;
                            }
                        }
                        if (valid) {
                            for (let i = 0; i < length; i++) {
                                if (this.shotHistory[y+i][x] === null) {
                                    probMap[y+i][x]++;
                                }
                            }
                        }
                    }
                }
            }
        });
        
        return probMap;
    }

    updateStrategy(result, x, y) {
        // Update shot history
        if (this.shotHistory[y] && this.shotHistory[y][x] !== undefined) {
            this.shotHistory[y][x] = result;
        }
        
        if (this.difficulty === 'easy') {
            // Simple strategy for easy mode
            if (result === 'hit') {
                this.lastHit = [x, y];
                this.huntMode = false;
            } else {
                this.huntMode = true;
                this.lastHit = null;
            }
        } else {
            // Advanced strategy for hard mode
            if (result === 'hit') {
                this.huntMode = false;
                this.hitStack.push([x, y]);
                
                // Determine ship orientation if we have multiple hits
                if (this.hitStack.length > 1) {
                    this._determineShipOrientation();
                }
                
                // Reset tried directions when we get a new hit to ensure we explore all options
                if (this.hitStack.length === 1) {
                    this.triedDirections = [];
                }
                
                // If we've tried all directions and still have hits, we might be dealing with multiple ships
                // or a complex situation - don't reset to hunt mode too early
                if (this.triedDirections.length >= 4 && this.hitStack.length <= 1) {
                    this.huntMode = true;
                    this.hitStack = [];
                    this.triedDirections = [];
                    this.currentDirection = null;
                }
            } else if (result === 'miss') {
                // If we miss, add the direction to tried directions if we're in target mode
                if (!this.huntMode && this.hitStack.length > 0) {
                    const [lastHitX, lastHitY] = this.hitStack[this.hitStack.length - 1];
                    const direction = this._getDirection(lastHitX, lastHitY, x, y);
                    if (direction && !this.triedDirections.includes(direction)) {
                        this.triedDirections.push(direction);
                    }
                }
            } else if (result === 'sunk') {
                // Reset targeting variables when a ship is sunk
                this.huntMode = true;
                this.hitStack = [];
                this.triedDirections = [];
                this.currentDirection = null;
                
                // Update remaining ship lengths
                this._updateRemainingShips();
            }
        }
    }
    
    _determineShipOrientation() {
        const hits = this.hitStack;
        
        // Check if hits are in a horizontal line
        const horizontalHits = hits.filter(([x, y]) => y === hits[0][1]);
        if (horizontalHits.length > 1) {
            this.currentDirection = 'horizontal';
        }
        
        // Check if hits are in a vertical line
        const verticalHits = hits.filter(([x, y]) => x === hits[0][0]);
        if (verticalHits.length > 1) {
            this.currentDirection = 'vertical';
        }
    }
    
    _updateRemainingShips() {
        // Remove a ship length from the remaining ships list
        // This is a simplified version - in a real implementation, we would track which ship was sunk
        if (this.remainingShipLengths.length > 0) {
            this.remainingShipLengths.pop();
        }
    }
    
    // Helper method to determine the direction between two points
    _getDirection(fromX, fromY, toX, toY) {
        if (fromX === toX) {
            if (fromY > toY) return 'up';
            if (fromY < toY) return 'down';
        } else if (fromY === toY) {
            if (fromX > toX) return 'left';
            if (fromX < toX) return 'right';
        }
        return null; // Not in a cardinal direction
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Ship, GameBoard, AIPlayer };
}
