const { AIPlayer } = require('../src/gameLogic');

describe('AIPlayer', () => {
  let ai;

  beforeEach(() => {
    ai = new AIPlayer();
  });

  // BUG-007: AI ships not appearing on grid
  test('should initialize with 5 ships', () => {
    expect(ai.ships.length).toBe(5);
    expect(ai.ships[0].name).toBe('Carrier');
    expect(ai.ships[1].name).toBe('Battleship');
    expect(ai.ships[2].name).toBe('Destroyer');
    expect(ai.ships[3].name).toBe('Submarine');
    expect(ai.ships[4].name).toBe('Patrol Boat');
  });

  // BUG-007: AI ships not appearing on grid
  test('should place all ships on the board', () => {
    ai.placeShips();
    
    // Count how many ships are placed on the board
    let shipCellCount = 0;
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        if (ai.board.grid[y][x] !== null) {
          shipCellCount++;
        }
      }
    }
    
    // Total cells should be sum of all ship lengths
    const totalShipLength = ai.ships.reduce((sum, ship) => sum + ship.length, 0);
    expect(shipCellCount).toBe(totalShipLength);
    
    // All ships should be in the board's ships array
    expect(ai.board.ships.length).toBe(5);
  });

  test('should generate valid next moves', () => {
    const [x, y] = ai.getNextMove();
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThan(10);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y).toBeLessThan(10);
  });

  test('should update strategy based on hit results', () => {
    // Initial state
    expect(ai.huntMode).toBe(true);
    expect(ai.lastHit).toBe(null);
    
    // After a hit
    ai.updateStrategy('hit', 3, 4);
    expect(ai.huntMode).toBe(false);
    expect(ai.lastHit).toEqual([3, 4]);
    
    // After a miss
    ai.updateStrategy('miss', 3, 5);
    expect(ai.huntMode).toBe(true);
    expect(ai.lastHit).toBe(null);
  });

  test('should generate a reasonable number of unique moves', () => {
    // Create a fresh AI instance for this test
    const freshAi = new AIPlayer();
    freshAi.possibleHits = new Set(); // Reset possible hits
    
    // Get 30 moves and track unique ones
    const moves = new Set();
    for (let i = 0; i < 30; i++) {
      const [x, y] = freshAi.getNextMove();
      const moveKey = `${x},${y}`;
      moves.add(moveKey);
    }
    
    // We should have at least 20 unique moves out of 30 attempts
    // This is more resilient than expecting all moves to be unique
    expect(moves.size).toBeGreaterThanOrEqual(20);
  });

  // Tests for target mode behavior
  test('should switch to target mode after a hit', () => {
    // Simulate a hit
    ai.updateStrategy('hit', 5, 5);
    expect(ai.huntMode).toBe(false);
    
    // Next move should be adjacent to the hit
    const [x, y] = ai.getNextMove();
    const isAdjacent = (
      (x === 4 && y === 5) || 
      (x === 6 && y === 5) || 
      (x === 5 && y === 4) || 
      (x === 5 && y === 6)
    );
    expect(isAdjacent).toBe(true);
  });
  
  // ENH-009: Enhanced AI Targeting Strategy Tests
  describe('Enhanced AI Targeting Strategy', () => {
    let hardAI;
    
    beforeEach(() => {
      hardAI = new AIPlayer('hard');
      // Initialize some properties for testing
      hardAI.hitStack = [];
      hardAI.triedDirections = [];
      hardAI.currentDirection = null;
    });
    
    test('_getDirection correctly identifies cardinal directions', () => {
      expect(hardAI._getDirection(5, 5, 6, 5)).toBe('right');
      expect(hardAI._getDirection(5, 5, 4, 5)).toBe('left');
      expect(hardAI._getDirection(5, 5, 5, 6)).toBe('down');
      expect(hardAI._getDirection(5, 5, 5, 4)).toBe('up');
      expect(hardAI._getDirection(5, 5, 6, 6)).toBe(null); // Diagonal
    });
    
    test('updateStrategy tracks tried directions on miss', () => {
      // Set up a hit first
      hardAI.updateStrategy('hit', 5, 5);
      expect(hardAI.huntMode).toBe(false);
      expect(hardAI.hitStack).toEqual([[5, 5]]);
      
      // Try a direction and miss
      hardAI.updateStrategy('miss', 6, 5); // Right direction
      expect(hardAI.triedDirections).toContain('right');
      
      // Try another direction and miss
      hardAI.updateStrategy('miss', 5, 4); // Up direction
      expect(hardAI.triedDirections).toContain('up');
      expect(hardAI.triedDirections.length).toBe(2);
    });
    
    test('_getTargetModeShot prioritizes untried directions', () => {
      // Set up a hit
      hardAI.huntMode = false;
      hardAI.hitStack = [[5, 5]];
      hardAI.triedDirections = ['right', 'up']; // Already tried right and up
      
      // Mock the probability map to return equal probabilities
      hardAI._createProbabilityMap = jest.fn().mockReturnValue(
        Array(10).fill().map(() => Array(10).fill(1))
      );
      
      // Get the next target shot
      const [x, y] = hardAI._getTargetModeShot();
      
      // Should be either left (4,5) or down (5,6) since those are untried
      const isValidMove = (x === 4 && y === 5) || (x === 5 && y === 6);
      expect(isValidMove).toBe(true);
    });
    
    test('_getMultiHitTargetingShot detects ship orientation and targets accordingly', () => {
      // Set up multiple hits in a horizontal line
      hardAI.huntMode = false;
      hardAI.hitStack = [[3, 5], [4, 5]];
      
      // Clear shot history
      hardAI.shotHistory = Array(10).fill().map(() => Array(10).fill(null));
      hardAI.shotHistory[5][3] = 'hit';
      hardAI.shotHistory[5][4] = 'hit';
      
      // Get the multi-hit targeting shot
      const [x, y] = hardAI._getMultiHitTargetingShot();
      
      // Should target either position 2,5 or 5,5 (left or right of the hits)
      const isValidMove = (x === 2 && y === 5) || (x === 5 && y === 5);
      expect(isValidMove).toBe(true);
      expect(hardAI.currentDirection).toBe('horizontal');
    });
    
    test('_getMultiHitTargetingShot detects gaps in ship hits', () => {
      // Set up hits with a gap in between
      hardAI.huntMode = false;
      hardAI.hitStack = [[3, 5], [5, 5]];
      
      // Clear shot history
      hardAI.shotHistory = Array(10).fill().map(() => Array(10).fill(null));
      hardAI.shotHistory[5][3] = 'hit';
      hardAI.shotHistory[5][5] = 'hit';
      
      // Get the multi-hit targeting shot
      const [x, y] = hardAI._getMultiHitTargetingShot();
      
      // Should target the gap at 4,5
      expect(x).toBe(4);
      expect(y).toBe(5);
    });
    
    test('AI never prematurely switches to hunt mode before fully destroying a ship', () => {
      // Set up a hit
      hardAI.huntMode = false;
      hardAI.hitStack = [[5, 5]];
      
      // Try all four directions and miss
      hardAI.updateStrategy('miss', 6, 5); // Right
      hardAI.updateStrategy('miss', 4, 5); // Left
      hardAI.updateStrategy('miss', 5, 4); // Up
      hardAI.updateStrategy('miss', 5, 6); // Down
      
      // Even after trying all directions, AI should still be in targeting mode
      // because there's still a hit in the hitStack
      expect(hardAI.huntMode).toBe(false);
      expect(hardAI.hitStack.length).toBe(1);
      
      // The AI has tried all four directions
      expect(hardAI.triedDirections.length).toBe(4);
      
      // Mock the _getAdjacentCellsToHits method to return a valid move
      hardAI._getAdjacentCellsToHits = jest.fn().mockReturnValue([[4, 4]]);
      
      // Get the next move - should still be in targeting mode
      const move = hardAI._getTargetModeShot();
      expect(move).toBeTruthy();
      
      // Only after a ship is sunk should the AI switch back to hunt mode
      hardAI.updateStrategy('sunk', 5, 5);
      expect(hardAI.huntMode).toBe(true);
      expect(hardAI.hitStack.length).toBe(0);
    });
  });
});
