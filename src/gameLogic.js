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
        console.log('AI deciding next move, difficulty:', this.difficulty);
        console.log('Hunt mode:', this.huntMode, 'Hit stack size:', this.hitStack.length);
        
        // ALWAYS prioritize targeting mode if we have any hits in the hitStack
        if (this.hitStack.length > 0) {
            this.huntMode = false;  // Force targeting mode if we have hits
            console.log('Forcing targeting mode due to existing hits');
        }
        
        // In hard mode, use the advanced targeting strategy
        if (this.difficulty === 'hard') {
            // If we're in targeting mode with hits, use advanced targeting
            if (!this.huntMode && this.hitStack.length > 0) {
                console.log('Using advanced targeting strategy with hit stack');
                return this._getHardModeMove();
            }
            // Otherwise use hunt mode with probability map
            else {
                console.log('Using hunt mode with probability map');
                return this._getHuntModeShot();
            }
        }
        
        // For easy mode or fallback
        if (!this.huntMode && this.lastHit) {
            const [lastX, lastY] = this.lastHit;
            console.log(`Basic targeting from last hit at ${lastX},${lastY}`);
            
            // If we have multiple hits, use the advanced targeting strategy
            if (this.hitStack.length > 1) {
                console.log('Multiple hits detected, using multi-hit targeting');
                const multiHitShot = this._getMultiHitTargetingShot();
                if (multiHitShot) {
                    return multiHitShot;
                }
            }
            
            // Try adjacent cells in all four directions
            const directions = [
                [lastX - 1, lastY], // left
                [lastX + 1, lastY], // right
                [lastX, lastY - 1], // up
                [lastX, lastY + 1]  // down
            ];
            
            // Filter for valid moves that haven't been tried
            const validMoves = directions.filter(([x, y]) => 
                x >= 0 && x < 10 && y >= 0 && y < 10 && this.shotHistory[y][x] === null
            );
            
            if (validMoves.length > 0) {
                // Choose a random valid move
                const randomIndex = Math.floor(Math.random() * validMoves.length);
                const [x, y] = validMoves[randomIndex];
                console.log(`Targeting adjacent cell at ${x},${y}`);
                this.possibleHits.add(`${x},${y}`);
                return [x, y];
            }
        }
        
        // Multi-hit attack logic is now handled by the game.js aiTurn method
        // which will call this method to get the center point for the multi-hit attack
        // at specific turns (3 and 6) in hard mode
        
        // Regular attack based on difficulty
        if (this.difficulty === 'easy') {
            if (this.huntMode) {
                // Hunt mode: random shots
                let x, y;
                do {
                    [x, y] = this._getRandomShot();
                } while (this.possibleHits.has(`${x},${y}`));
                
                console.log(`Easy mode random shot at ${x},${y}`);
                this.possibleHits.add(`${x},${y}`);
                return [x, y];
            } else {
                // Target mode: try adjacent cells to last hit
                console.log('Easy mode target shot');
                return this._getTargetModeShot();
            }
        } else {
            // Advanced strategy for hard mode
            if (this.huntMode) {
                console.log('Hard mode hunt shot');
                return this._getHuntModeShot();
            } else {
                console.log('Hard mode target shot');
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
        
        // ALWAYS prioritize targeting mode if we have hits in the hitStack
        if (this.hitStack.length > 0) {
            this.huntMode = false;
            console.log('AI in targeting mode with', this.hitStack.length, 'hits');
            console.log('Current hitStack:', JSON.stringify(this.hitStack));
        }
        
        // Deterministic decision based on mode
        if (this.huntMode) {
            console.log('AI using hunt mode strategy');
            return this._getHuntModeShot();
        } else {
            console.log('AI using target mode strategy');
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
        // If we have multiple hits, use the advanced multi-hit targeting strategy
        if (this.hitStack.length > 1) {
            console.log('Using multi-hit targeting strategy with', this.hitStack.length, 'hits');
            return this._getMultiHitTargetingShot();
        }
        
        // Otherwise, use the basic targeting approach but with probability weighting
        const [lastX, lastY] = this.hitStack[0] || this.lastHit;
        console.log(`Basic targeting from hit at ${lastX},${lastY}`);
        
        // Define directions in a specific order: prioritize directions not yet tried
        const allDirections = [
            ['right', [lastX + 1, lastY]],
            ['left', [lastX - 1, lastY]],
            ['down', [lastX, lastY + 1]],
            ['up', [lastX, lastY - 1]]
        ];
        
        // Filter out directions we've already tried
        const untried = allDirections.filter(([dir, _]) => !this.triedDirections.includes(dir));
        console.log('Untried directions:', untried.map(d => d[0]));
        
        // If we have untried directions, prioritize those
        const directionsToCheck = untried.length > 0 ? untried : allDirections;
        
        // Get valid moves from our directions
        const validMoves = directionsToCheck
            .map(([dir, coords]) => ({dir, coords}))
            .filter(({coords: [x, y]}) => 
                x >= 0 && x < 10 && y >= 0 && y < 10 && 
                this.shotHistory[y][x] === null
            );
        
        if (validMoves.length > 0) {
            // Weight the moves by probability
            const probMap = this._createProbabilityMap();
            let highestProb = 0;
            let bestMoves = [];
            
            validMoves.forEach(({dir, coords: [x, y]}) => {
                if (probMap[y][x] > highestProb) {
                    highestProb = probMap[y][x];
                    bestMoves = [{dir, x, y}];
                } else if (probMap[y][x] === highestProb) {
                    bestMoves.push({dir, x, y});
                }
            });
            
            // Choose the highest probability move
            const {dir, x, y} = bestMoves[Math.floor(Math.random() * bestMoves.length)];
            console.log(`Targeting ${dir} direction at ${x},${y} with probability ${highestProb}`);
            this.possibleHits.add(`${x},${y}`);
            return [x, y];
        } else {
            // CRITICAL: If no valid moves around the hit but we still have hits in the hitStack,
            // we should NOT revert to hunt mode. Instead, reset tried directions and try again.
            if (this.hitStack.length > 0) {
                console.log('No valid moves around current hit, but still have hits in hitStack');
                console.log('Resetting tried directions to continue targeting');
                this.triedDirections = [];
                
                // Try adjacent cells to any hit
                const adjacentCells = this._getAdjacentCellsToHits();
                if (adjacentCells.length > 0) {
                    const [x, y] = adjacentCells[0];
                    console.log(`Targeting cell adjacent to hits: ${x},${y}`);
                    this.possibleHits.add(`${x},${y}`);
                    return [x, y];
                }
                
                // If still no valid moves, only then fall back to hunt mode
                console.log('No valid targeting options, reluctantly falling back to hunt mode');
            }
            
            this.huntMode = true;
            this.hitStack = [];
            this.triedDirections = [];
            return this._getHuntModeShot();
        }
    }
    
    _getMultiHitTargetingShot() {
        const hits = this.hitStack;
        console.log('AI using multi-hit targeting with hits:', hits);
        
        // Check if hits are in a horizontal line
        const horizontalHits = hits.filter(([x, y]) => y === hits[0][1]);
        if (horizontalHits.length > 1) {
            // Set current direction for better tracking
            this.currentDirection = 'horizontal';
            console.log('Ship orientation detected: horizontal');
            
            // Sort by x coordinate
            horizontalHits.sort((a, b) => a[0] - b[0]);
            const minX = horizontalHits[0][0];
            const maxX = horizontalHits[horizontalHits.length - 1][0];
            const y = hits[0][1];
            
            // Check for gaps in the horizontal line (could be a ship with a missed shot)
            for (let x = minX + 1; x < maxX; x++) {
                if (this.shotHistory[y][x] === null) {
                    console.log(`AI targeting gap at ${x},${y} in horizontal ship`);
                    this.possibleHits.add(`${x},${y}`);
                    return [x, y]; // Target the gap first
                }
            }
            
            // Try left side if valid
            if (minX > 0 && this.shotHistory[y][minX-1] === null) {
                console.log(`AI targeting left side at ${minX-1},${y}`);
                this.possibleHits.add(`${minX-1},${y}`);
                return [minX-1, y];
            }
            
            // Try right side if valid
            if (maxX < 9 && this.shotHistory[y][maxX+1] === null) {
                console.log(`AI targeting right side at ${maxX+1},${y}`);
                this.possibleHits.add(`${maxX+1},${y}`);
                return [maxX+1, y];
            }
        }
        
        // Check if hits are in a vertical line
        const verticalHits = hits.filter(([x, y]) => x === hits[0][0]);
        if (verticalHits.length > 1) {
            // Set current direction for better tracking
            this.currentDirection = 'vertical';
            console.log('Ship orientation detected: vertical');
            
            // Sort by y coordinate
            verticalHits.sort((a, b) => a[1] - b[1]);
            const minY = verticalHits[0][1];
            const maxY = verticalHits[verticalHits.length - 1][1];
            const x = hits[0][0];
            
            // Check for gaps in the vertical line
            for (let y = minY + 1; y < maxY; y++) {
                if (this.shotHistory[y][x] === null) {
                    console.log(`AI targeting gap at ${x},${y} in vertical ship`);
                    this.possibleHits.add(`${x},${y}`);
                    return [x, y]; // Target the gap first
                }
            }
            
            // Try top side if valid
            if (minY > 0 && this.shotHistory[minY-1][x] === null) {
                console.log(`AI targeting top side at ${x},${minY-1}`);
                this.possibleHits.add(`${x},${minY-1}`);
                return [x, minY-1];
            }
            
            // Try bottom side if valid
            if (maxY < 9 && this.shotHistory[maxY+1][x] === null) {
                console.log(`AI targeting bottom side at ${x},${maxY+1}`);
                this.possibleHits.add(`${x},${maxY+1}`);
                return [x, maxY+1];
            }
        }
        
        // If we can't determine a clear direction or have tried all directions,
        // try any adjacent cell to any hit that hasn't been tried yet
        
        // First, prioritize cells adjacent to multiple hits
        // This helps identify ships that might be in unusual configurations
        const adjacentCells = this._getAdjacentCellsToHits();
        
        if (adjacentCells.length > 0) {
            const [x, y] = adjacentCells[0]; // Use the highest priority cell (most adjacent hits)
            console.log(`AI targeting cell adjacent to multiple hits: ${x},${y}`);
            this.possibleHits.add(`${x},${y}`);
            return [x, y];
        }
        
        // If no adjacent cells are available, fall back to basic targeting
        console.log('No clear targeting strategy, falling back to basic targeting');
        return this._getTargetModeShot();
    }
    
    _getAdjacentCellsToHits() {
        // Find all cells adjacent to hits that haven't been tried yet
        const adjacentCounts = {};
        
        for (const [hitX, hitY] of this.hitStack) {
            const adjacentCells = [
                [hitX - 1, hitY], // left
                [hitX + 1, hitY], // right
                [hitX, hitY - 1], // up
                [hitX, hitY + 1]  // down
            ];
            
            for (const [x, y] of adjacentCells) {
                if (x >= 0 && x < 10 && y >= 0 && y < 10 && this.shotHistory[y][x] === null) {
                    const key = `${x},${y}`;
                    adjacentCounts[key] = (adjacentCounts[key] || 0) + 1;
                }
            }
        }
        
        // Convert to array of coordinates and sort by count (highest first)
        const sortedCoords = Object.entries(adjacentCounts)
            .map(([key, count]) => {
                const [x, y] = key.split(',').map(Number);
                return { x, y, count };
            })
            .sort((a, b) => b.count - a.count);
        
        return sortedCoords.map(coord => [coord.x, coord.y]);
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
                // Always store the last hit and force targeting mode
                this.lastHit = [x, y];
                this.huntMode = false;
                this.hitStack.push([x, y]);
                
                console.log(`AI hit at ${x},${y}, hitStack now has ${this.hitStack.length} hits`);
                
                // Determine ship orientation if we have multiple hits
                if (this.hitStack.length > 1) {
                    this._determineShipOrientation();
                    console.log(`Ship orientation determined: ${this.currentDirection || 'unknown'}`);
                }
                
                // Reset tried directions when we get a new hit to ensure we explore all options
                if (this.hitStack.length === 1) {
                    this.triedDirections = [];
                    console.log('First hit, resetting tried directions');
                }
                
                // If we've tried all directions but still have hits, reset directions
                // This ensures we don't get stuck and can try different approaches
                if (this.triedDirections.length >= 4 && this.hitStack.length >= 1) {
                    console.log('Tried all directions but still have hits, resetting directions');
                    this.triedDirections = [];
                }
                
                // CRITICAL: We NEVER go back to hunt mode if we have hits in the hitStack
                // This forces the AI to stay focused on destroying the current ship
            } else if (result === 'miss') {
                console.log(`AI missed at ${x},${y}`);
                
                // If we miss, add the direction to tried directions if we're in target mode
                if (!this.huntMode && this.hitStack.length > 0) {
                    const [lastHitX, lastHitY] = this.hitStack[this.hitStack.length - 1];
                    const direction = this._getDirection(lastHitX, lastHitY, x, y);
                    
                    if (direction && !this.triedDirections.includes(direction)) {
                        this.triedDirections.push(direction);
                        console.log(`Added direction ${direction} to tried directions: [${this.triedDirections}]`);
                    }
                }
                
                // IMPORTANT: We do NOT switch back to hunt mode on a miss if we have hits
                // This ensures we keep trying to destroy the ship completely
            } else if (result === 'sunk') {
                console.log('Ship sunk! Resetting targeting variables');
                
                // Reset targeting variables when a ship is sunk
                this.huntMode = true;
                this.hitStack = [];
                this.triedDirections = [];
                this.currentDirection = null;
                
                // Update remaining ship lengths
                this._updateRemainingShips();
                console.log(`Remaining ship lengths: [${this.remainingShipLengths}]`);
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
    
    _getDirection(x1, y1, x2, y2) {
        // Determine the cardinal direction from (x1,y1) to (x2,y2)
        if (x1 === x2) {
            if (y2 < y1) return 'up';
            if (y2 > y1) return 'down';
        } else if (y1 === y2) {
            if (x2 < x1) return 'left';
            if (x2 > x1) return 'right';
        }
        return null; // Not a cardinal direction
    }
    
    _isStuckInTargeting() {
        // This method determines if the AI is stuck in targeting mode
        // We've modified the AI to NEVER give up on targeting mode if there are hits
        // So this method now just checks if there are any valid moves left
        
        // If we have any hits, we're not stuck - we're actively working on a ship
        if (this.hitStack.length > 0) {
            return false;
        }
        
        return true; // Only return true if we have no hits at all
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Ship, GameBoard, AIPlayer };
}
