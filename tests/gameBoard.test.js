const { Ship, GameBoard } = require('../src/gameLogic');

describe('GameBoard', () => {
  let board;
  let ship;

  beforeEach(() => {
    board = new GameBoard();
    ship = new Ship(3, 'Destroyer');
  });

  // BUG-001: Ships could be placed outside grid boundaries
  test('should not allow ship placement outside grid boundaries', () => {
    // Try to place ship at the edge so it extends beyond the grid
    expect(board.placeShip(ship, 8, 0, true)).toBe(false);
    expect(board.placeShip(ship, 0, 8, false)).toBe(false);
    expect(board.ships.length).toBe(0);
  });

  // BUG-004: AI board not responding to clicks after game start
  test('should allow valid ship placement', () => {
    expect(board.placeShip(ship, 0, 0, true)).toBe(true);
    expect(board.ships.length).toBe(1);
    expect(board.grid[0][0]).toBe(ship);
    expect(board.grid[0][1]).toBe(ship);
    expect(board.grid[0][2]).toBe(ship);
  });

  // BUG-005: Game ended prematurely after first move
  test('should correctly register hits on ships', () => {
    board.placeShip(ship, 0, 0, true);
    expect(board.receiveAttack(0, 0)).toBe('hit');
    expect(board.receiveAttack(1, 0)).toBe('hit');
    expect(board.receiveAttack(2, 0)).toBe('hit');
    expect(ship.hits).toEqual([true, true, true]);
  });

  // BUG-005: Game ended prematurely after first move
  test('should register misses correctly', () => {
    board.placeShip(ship, 0, 0, true);
    expect(board.receiveAttack(0, 1)).toBe('miss');
    expect(board.receiveAttack(3, 0)).toBe('miss');
    expect(ship.hits).toEqual([false, false, false]);
  });

  // BUG-006: Game not ending properly according to Battleship rules
  test('should validate attack coordinates', () => {
    expect(board.receiveAttack(-1, 0)).toBe('miss');
    expect(board.receiveAttack(0, -1)).toBe('miss');
    expect(board.receiveAttack(10, 0)).toBe('miss');
    expect(board.receiveAttack(0, 10)).toBe('miss');
  });

  // BUG-006: Game not ending properly according to Battleship rules
  test('should correctly determine if all ships are sunk', () => {
    // No ships placed yet
    expect(board.allShipsSunk()).toBe(false);
    
    // Place a ship
    board.placeShip(ship, 0, 0, true);
    expect(board.allShipsSunk()).toBe(false);
    
    // Hit all positions
    board.receiveAttack(0, 0);
    board.receiveAttack(1, 0);
    board.receiveAttack(2, 0);
    
    // Now the ship should be sunk
    expect(board.allShipsSunk()).toBe(true);
  });

  // BUG-006: Game not ending properly according to Battleship rules
  test('should correctly find ship hit index', () => {
    board.placeShip(ship, 0, 0, true);
    
    // Test horizontal ship
    expect(board._findShipHitIndex(ship, 0, 0)).toBe(0);
    expect(board._findShipHitIndex(ship, 1, 0)).toBe(1);
    expect(board._findShipHitIndex(ship, 2, 0)).toBe(2);
    
    // Test vertical ship
    const verticalShip = new Ship(3, 'Submarine');
    board.placeShip(verticalShip, 5, 5, false);
    
    expect(board._findShipHitIndex(verticalShip, 5, 5)).toBe(0);
    expect(board._findShipHitIndex(verticalShip, 5, 6)).toBe(1);
    expect(board._findShipHitIndex(verticalShip, 5, 7)).toBe(2);
  });

  // BUG-008: Regenerate Ships adding extra ships instead of replacing them
  test('should not allow overlapping ships', () => {
    board.placeShip(ship, 0, 0, true);
    
    const anotherShip = new Ship(2, 'Patrol Boat');
    // Try to place overlapping
    expect(board.placeShip(anotherShip, 1, 0, true)).toBe(false);
    
    // Should be able to place non-overlapping
    expect(board.placeShip(anotherShip, 0, 1, true)).toBe(true);
    expect(board.ships.length).toBe(2);
  });
});
