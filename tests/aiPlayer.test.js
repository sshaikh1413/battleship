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

  test('should not repeat moves', () => {
    // Get 20 moves and ensure none are repeated
    const moves = new Set();
    for (let i = 0; i < 20; i++) {
      const [x, y] = ai.getNextMove();
      const moveKey = `${x},${y}`;
      expect(moves.has(moveKey)).toBe(false);
      moves.add(moveKey);
    }
    expect(moves.size).toBe(20);
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
});
