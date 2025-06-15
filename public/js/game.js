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
                ship.hits[hitIndex] = true;
                console.log(`Hit on ${ship.name} at position ${hitIndex}`);
                
                // Store the coordinates of this hit for the ship
                if (!ship.hitCoordinates) {
                    ship.hitCoordinates = [];
                }
                ship.hitCoordinates.push({x, y});
                
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
    constructor() {
        this.board = new GameBoard();
        this.huntMode = true;
        this.lastHit = null;
        this.direction = null;
        this.possibleHits = new Set();
        this.ships = [
            new Ship(5, 'Carrier'),
            new Ship(4, 'Battleship'),
            new Ship(3, 'Destroyer'),
            new Ship(3, 'Submarine'),
            new Ship(2, 'Patrol Boat')
        ];
    }

    placeShips() {
        this.ships.forEach(ship => {
            let placed = false;
            while (!placed) {
                const x = Math.floor(Math.random() * 10);
                const y = Math.floor(Math.random() * 10);
                const isHorizontal = Math.random() > 0.5;
                placed = this.board.placeShip(ship, x, y, isHorizontal);
            }
        });
    }

    getNextMove() {
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
                return this.getNextMove();
            }
        }
    }

    _getRandomShot() {
        return [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
    }

    updateStrategy(result, x, y) {
        if (result === 'hit') {
            this.lastHit = [x, y];
            this.huntMode = false;
        } else {
            this.huntMode = true;
            this.lastHit = null;
        }
    }
}

class Game {
    constructor() {
        this.difficulty = 'easy'; // Default difficulty
        this.playerBoard = new GameBoard();
        this.aiPlayer = new AIPlayer(this.difficulty);
        this.currentPlayer = 'player';
        this.gameStarted = false;
        this.ships = [
            new Ship(5, 'Carrier'),
            new Ship(4, 'Battleship'),
            new Ship(3, 'Destroyer'),
            new Ship(3, 'Submarine'),
            new Ship(2, 'Patrol Boat')
        ];
        
        // Multi-hit targeting feature
        this.multiHitAttacksRemaining = 2;
        this.usingMultiHitAttack = false;
        
        // Track AI turn count and multi-hit attack usage for deterministic behavior
        this.aiTurnCount = 0;
        this.aiUsedFirstMultiHit = false;
        this.aiUsedSecondMultiHit = false;
        
        // No longer need selectedShip since ships are placed automatically
        this.isPlacing = false;
        this.setupUI();
        this.placeShipsRandomly();
        
        // Place AI ships
        this.aiPlayer.placeShips();
    }

    setupUI() {
        this.playerGrid = document.getElementById('player-grid');
        this.aiGrid = document.getElementById('ai-grid');
        this.statusText = document.getElementById('status-text');
        this.startButton = document.getElementById('start-game');
        
        // Add regenerate button
        const regenerateButton = document.createElement('button');
        regenerateButton.id = 'regenerate-ships';
        regenerateButton.textContent = 'Regenerate Ships';
        this.startButton.parentNode.insertBefore(regenerateButton, this.startButton);
        
        // Add difficulty selection UI
        const difficultyContainer = document.createElement('div');
        difficultyContainer.className = 'difficulty-container';
        difficultyContainer.innerHTML = `
            <h3>Difficulty Level</h3>
            <div class="difficulty-buttons">
                <button id="easy-mode" class="difficulty-btn active">Easy</button>
                <button id="hard-mode" class="difficulty-btn">Hard</button>
            </div>
        `;
        this.startButton.parentNode.insertBefore(difficultyContainer, this.startButton);
        
        // Add multi-hit targeting button with rocket icon
        const multiHitButton = document.createElement('button');
        multiHitButton.id = 'multi-hit-attack';
        multiHitButton.innerHTML = `🚀 Multi-Hit Attack <span class="counter">${this.multiHitAttacksRemaining}</span>`;
        multiHitButton.className = 'special-attack-btn';
        multiHitButton.disabled = true; // Disable until game starts
        this.startButton.parentNode.insertBefore(multiHitButton, this.startButton);

        this._createGrid(this.playerGrid, true);
        this._createGrid(this.aiGrid, false);

        // Event listeners for grid interactions
        this.playerGrid.addEventListener('click', (e) => this.handlePlayerClick(e));
        this.aiGrid.addEventListener('click', (e) => this.handleAIClick(e));
        this.aiGrid.addEventListener('mouseover', (e) => this.handleGridHover(e));
        this.aiGrid.addEventListener('mouseout', (e) => this.handleGridMouseOut(e));
        
        // Event listeners for buttons
        this.startButton.addEventListener('click', () => this.startGame());
        regenerateButton.addEventListener('click', () => this.regenerateShips());
        multiHitButton.addEventListener('click', () => this.toggleMultiHitMode());
        document.getElementById('easy-mode').addEventListener('click', () => this.setDifficulty('easy'));
        document.getElementById('hard-mode').addEventListener('click', () => this.setDifficulty('hard'));

        // Store references to buttons
        this.multiHitButton = multiHitButton;
        this.easyModeButton = document.getElementById('easy-mode');
        this.hardModeButton = document.getElementById('hard-mode');
    }

    _createGrid(gridElement, isPlayer) {
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                cell.dataset.x = x;
                cell.dataset.y = y;
                gridElement.appendChild(cell);
            }
        }
    }

    // Ship selection is no longer needed as ships are placed automatically
    // Ships are now only placed randomly

    handlePlayerClick(e) {
        // Player clicks on their own grid are no longer needed for ship placement
        // Ships are now placed randomly with the regenerateShips function
        return;
    }

    handleAIClick(e) {
        // Only allow clicks when it's the player's turn and game is in progress
        if (this.currentPlayer !== 'player' || this.isPlacing) return;

        const cell = e.target.closest('.grid-cell');
        if (!cell) return;

        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);

        // Only process if the cell hasn't been clicked before
        if (!cell.classList.contains('hit') && !cell.classList.contains('miss')) {
            if (this.usingMultiHitAttack) {
                // Execute multi-hit attack
                this.executeMultiHitAttack(x, y, 'player');
                
                // Decrement and update counter
                this.multiHitAttacksRemaining--;
                this.multiHitButton.querySelector('.counter').textContent = this.multiHitAttacksRemaining;
                
                // Disable multi-hit button if no attacks remaining
                if (this.multiHitAttacksRemaining <= 0) {
                    this.multiHitButton.disabled = true;
                }
                
                // Turn off multi-hit mode
                this.usingMultiHitAttack = false;
                this.multiHitButton.classList.remove('active');
                
                // Remove any highlighting from the grid
                this.clearMultiHitHighlight();
            } else {
                // Regular single-cell attack
                const result = this.aiPlayer.board.receiveAttack(x, y);
                cell.classList.add(result);
                
                // If it's a hit, add the ship's specific class for color
                if (result === 'hit') {
                    const ship = this.aiPlayer.board.grid[y][x];
                    if (ship && ship.cssClass) {
                        cell.classList.add(ship.cssClass);
                        
                        // Check if ship is sunk after this hit
                        if (ship.isSunk()) {
                            this.markShipAsSunk(ship, 'ai');
                        }
                    }
                }
            }
            
            if (this.aiPlayer.board.allShipsSunk()) {
                this.gameOver('player');
                return;
            }
            
            this.currentPlayer = 'ai';
            this._updateStatus();
            
            // AI takes turn after a short delay (reduced for better pacing)
            setTimeout(() => this.aiTurn(), 250);
        }
    }
    
    // Method to handle grid hover for multi-hit targeting preview
    handleGridHover(e) {
        if (!this.usingMultiHitAttack || this.currentPlayer !== 'player') return;
        
        const cell = e.target.closest('.grid-cell');
        if (!cell) return;
        
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        
        // Clear any existing highlights
        this.clearMultiHitHighlight();
        
        // Highlight the 4-prong attack pattern
        this.highlightMultiHitPattern(x, y);
    }
    
    // Method to clear multi-hit highlighting when mouse leaves
    handleGridMouseOut(e) {
        if (!this.usingMultiHitAttack) return;
        this.clearMultiHitHighlight();
    }
    
    // Method to highlight the multi-hit pattern
    highlightMultiHitPattern(centerX, centerY) {
        // Define the 4-prong pattern: center + up, down, left, right
        const pattern = [
            [centerX, centerY],     // Center
            [centerX, centerY - 1], // Up
            [centerX, centerY + 1], // Down
            [centerX - 1, centerY], // Left
            [centerX + 1, centerY]  // Right
        ];
        
        // Add highlight class to each cell in the pattern if it's valid
        pattern.forEach(([x, y]) => {
            if (x >= 0 && x < 10 && y >= 0 && y < 10) {
                const cell = this.aiGrid.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                if (cell && !cell.classList.contains('hit') && !cell.classList.contains('miss')) {
                    cell.classList.add('multi-hit-highlight');
                }
            }
        });
    }
    
    // Method to clear multi-hit highlighting
    clearMultiHitHighlight() {
        const highlightedCells = this.aiGrid.querySelectorAll('.multi-hit-highlight');
        highlightedCells.forEach(cell => {
            cell.classList.remove('multi-hit-highlight');
        });
    }
    
    // Method to execute a multi-hit attack
    executeMultiHitAttack(centerX, centerY, attacker) {
        // Define the 4-prong pattern: center + up, down, left, right
        const pattern = [
            [centerX, centerY],     // Center
            [centerX, centerY - 1], // Up
            [centerX, centerY + 1], // Down
            [centerX - 1, centerY], // Left
            [centerX + 1, centerY]  // Right
        ];
        
        // Process each cell in the pattern
        pattern.forEach(([x, y]) => {
            if (x >= 0 && x < 10 && y >= 0 && y < 10) {
                const targetBoard = attacker === 'player' ? this.aiPlayer.board : this.playerBoard;
                const targetGrid = attacker === 'player' ? this.aiGrid : this.playerGrid;
                const cell = targetGrid.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                
                // Only attack if cell hasn't been attacked before
                if (cell && !cell.classList.contains('hit') && !cell.classList.contains('miss')) {
                    const result = targetBoard.receiveAttack(x, y);
                    cell.classList.add(result);
                    
                    // Add explosion animation class
                    cell.classList.add('explosion');
                    setTimeout(() => {
                        cell.classList.remove('explosion');
                    }, 1000);
                    
                    // If it's a hit, add the ship's specific class for color
                    if (result === 'hit') {
                        const ship = targetBoard.grid[y][x];
                        if (ship && ship.cssClass) {
                            cell.classList.add(ship.cssClass);
                            
                            // Check if ship is sunk after this hit
                            if (ship.isSunk()) {
                                this.markShipAsSunk(ship, attacker === 'player' ? 'ai' : 'player');
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Method to toggle multi-hit attack mode
    toggleMultiHitMode() {
        // Only allow if player has attacks remaining and it's their turn
        if (this.multiHitAttacksRemaining <= 0 || this.currentPlayer !== 'player') return;
        
        this.usingMultiHitAttack = !this.usingMultiHitAttack;
        
        if (this.usingMultiHitAttack) {
            this.multiHitButton.classList.add('active');
            this.statusText.textContent = 'Multi-Hit Attack Mode: Select a target';
        } else {
            this.multiHitButton.classList.remove('active');
            this.statusText.textContent = 'Your turn!';
            this.clearMultiHitHighlight();
        }
    }
    
    // Method to set AI difficulty
    setDifficulty(level) {
        // Only allow changing difficulty before game starts
        if (this.gameStarted) return;
        
        this.difficulty = level;
        this.aiPlayer = new AIPlayer(level);
        this.aiPlayer.placeShips();
        
        // Update UI
        this.easyModeButton.classList.toggle('active', level === 'easy');
        this.hardModeButton.classList.toggle('active', level === 'hard');
        
        // Update status text
        this.statusText.textContent = `Difficulty set to ${level.charAt(0).toUpperCase() + level.slice(1)}. Click Start Game when ready.`;
    }

    startGame() {
        if (this.playerBoard.ships.length !== this.ships.length) {
            this.statusText.textContent = 'Place all ships before starting!';
            return;
        }
        
        this.gameStarted = true;
        this.isPlacing = false;
        this.currentPlayer = 'player';
        this.aiGrid.style.pointerEvents = 'auto';
        this.statusText.textContent = 'Game started! Your turn!';
        this.startButton.disabled = true;
        document.getElementById('regenerate-ships').disabled = true;
        
        // Disable difficulty selection once game starts
        this.easyModeButton.disabled = true;
        this.hardModeButton.disabled = true;
        
        // Enable multi-hit attack button
        this.multiHitButton.disabled = false;
        this.multiHitButton.querySelector('.counter').textContent = this.multiHitAttacksRemaining;
        
        // Initialize AI with selected difficulty
        this.aiPlayer = new AIPlayer(this.difficulty);
        this.aiPlayer.placeShips();
    }
    
    placeShipsRandomly() {
        // Clear existing ships
        this.playerBoard = new GameBoard();
        
        // Clear visual representation - remove all ship classes
        this.playerGrid.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('ship');
            cell.classList.remove('ship-carrier');
            cell.classList.remove('ship-battleship');
            cell.classList.remove('ship-destroyer');
            cell.classList.remove('ship-submarine');
            cell.classList.remove('ship-patrol-boat');
        });
        
        // Place each ship randomly
        for (const ship of this.ships) {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100;
            
            while (!placed && attempts < maxAttempts) {
                const x = Math.floor(Math.random() * 10);
                const y = Math.floor(Math.random() * 10);
                const isHorizontal = Math.random() > 0.5;
                
                if (this.playerBoard.placeShip(ship, x, y, isHorizontal)) {
                    placed = true;
                    // Update visual
                    for (let i = 0; i < ship.length; i++) {
                        const posX = isHorizontal ? x + i : x;
                        const posY = isHorizontal ? y : y + i;
                        const cell = this.playerGrid.querySelector(`[data-x="${posX}"][data-y="${posY}"]`);
                        if (cell) {
                            cell.classList.add('ship');
                            cell.classList.add(ship.cssClass);
                        }
                    }
                }
                attempts++;
            }
            
            if (!placed) {
                console.error(`Failed to place ${ship.name} after ${maxAttempts} attempts`);
            }
        }
        
        // Reset game state
        this.statusText.textContent = 'Ships placed! Click Start Game when ready.';
        this.startButton.disabled = false;
    }
    
    regenerateShips() {
        this.isPlacing = true;
        this.aiGrid.style.pointerEvents = 'none';
        this.placeShipsRandomly();
    }

    aiTurn() {
        // Check if game is already over
        if (this.playerBoard.allShipsSunk()) {
            this.gameOver('AI');
            return;
        }

        // Show AI is thinking
        this.statusText.textContent = 'AI is thinking...';
        
        // Increment AI turn counter
        this.aiTurnCount++;

        // Add a small delay for better UX (reduced for faster gameplay)
        setTimeout(() => {
            try {
                // Decide whether to use multi-hit attack based on difficulty level
                let useMultiHit = false;
                
                if (this.aiPlayer.multiHitAttacksRemaining > 0) {
                    if (this.difficulty === 'easy') {
                        // In easy mode, use exactly one multi-hit attack early in the game
                        // Use it when AI has 2 attacks remaining (first opportunity)
                        if (this.aiPlayer.multiHitAttacksRemaining === 2 && !this.aiUsedFirstMultiHit) {
                            useMultiHit = true;
                            this.aiUsedFirstMultiHit = true;
                        }
                    } else {
                        // In hard mode, ALWAYS use multi-hit attacks at specific turns
                        // First attack at turn 3, second attack at turn 6
                        // This ensures the AI will definitely use both attacks
                        if (this.aiPlayer.multiHitAttacksRemaining === 2 && this.aiTurnCount === 3) {
                            useMultiHit = true;
                            this.aiUsedFirstMultiHit = true;
                            console.log('AI using first multi-hit attack at turn 3');
                        } else if (this.aiPlayer.multiHitAttacksRemaining === 1 && this.aiTurnCount === 6) {
                            useMultiHit = true;
                            this.aiUsedSecondMultiHit = true;
                            console.log('AI using second multi-hit attack at turn 6');
                        }
                    }
                }
                
                if (useMultiHit) {
                    // Get AI move for multi-hit attack center point
                    const [x, y] = this.aiPlayer.getNextMove();
                    
                    // Execute multi-hit attack
                    this.executeMultiHitAttack(x, y, 'ai');
                    
                    // Update AI's multi-hit attacks remaining
                    this.aiPlayer.multiHitAttacksRemaining--;
                    
                    // Show special message for multi-hit attack
                    this.statusText.textContent = 'AI used a multi-hit attack!';
                    setTimeout(() => {
                        if (this.playerBoard.allShipsSunk()) {
                            this.gameOver('AI');
                            return;
                        }
                        
                        this.currentPlayer = 'player';
                        this._updateStatus();
                    }, 750);
                } else {
                    // Regular single-cell attack
                    const [x, y] = this.aiPlayer.getNextMove();
                    const cell = this.playerGrid.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                    
                    // Skip if cell was already attacked
                    if (cell.classList.contains('hit') || cell.classList.contains('miss')) {
                        this.currentPlayer = 'player';
                        this.statusText.textContent = 'Your turn!';
                        return;
                    }
                    
                    const result = this.playerBoard.receiveAttack(x, y);
                    cell.classList.add(result);
                    
                    // If it's a hit, add the ship's specific class for color
                    if (result === 'hit') {
                        const ship = this.playerBoard.grid[y][x];
                        if (ship && ship.cssClass) {
                            cell.classList.add(ship.cssClass);
                            
                            // Check if ship is sunk after this hit
                            if (ship.isSunk()) {
                                this.markShipAsSunk(ship, 'player');
                            }
                        }
                    }
                    
                    // Update AI strategy based on result
                    this.aiPlayer.updateStrategy(result, x, y);
                    
                    if (this.playerBoard.allShipsSunk()) {
                        this.gameOver('AI');
                        return;
                    }
                    
                    this.currentPlayer = 'player';
                    this._updateStatus();
                }
            } catch (error) {
                console.error('Error during AI turn:', error);
                this.currentPlayer = 'player';
                this._updateStatus();
            }
        }, 500);
    }
    
    markShipAsSunk(ship, player) {
        // Add skull indicators to all cells of the sunk ship
        if (!ship.hitCoordinates) return;
        
        const grid = player === 'player' ? this.playerGrid : this.aiGrid;
        
        // Mark all cells of this ship as sunk
        for (const coord of ship.hitCoordinates) {
            const cell = grid.querySelector(`[data-x="${coord.x}"][data-y="${coord.y}"]`);
            if (cell) {
                cell.classList.add('sunk');
            }
        }
        
        // Also find all cells of this ship and mark them as sunk
        // This is a backup approach in case hitCoordinates is incomplete
        const board = player === 'player' ? this.playerBoard : this.aiPlayer.board;
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                if (board.grid[y][x] === ship) {
                    const cell = grid.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                    if (cell && cell.classList.contains('hit')) {
                        cell.classList.add('sunk');
                    }
                }
            }
        }
        
        // Announce which ship was sunk
        this.statusText.textContent = `${player === 'player' ? 'Your' : 'AI\'s'} ${ship.name} has been sunk!`;
    }
    
    gameOver(winner) {
        this.statusText.textContent = `Game Over! ${winner === 'player' ? 'You' : 'AI'} won!`;
        this.aiGrid.style.pointerEvents = 'none';
        
        // Add a play again button
        const playAgainBtn = document.createElement('button');
        playAgainBtn.textContent = 'Play Again';
        playAgainBtn.addEventListener('click', () => {
            window.location.reload();
        });
        document.querySelector('.status').appendChild(playAgainBtn);
    }
    
    _updateStatus() {
        if (this.isPlacing) {
            this.statusText.textContent = 'Ships placed! Click Start Game when ready.';
        } else if (this.currentPlayer === 'player') {
            this.statusText.textContent = 'Your turn! Click on the AI grid to attack.';
        } else if (this.currentPlayer === 'ai') {
            this.statusText.textContent = 'AI is thinking...';
        }
    }
}

const game = new Game();
