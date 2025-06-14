const { Ship } = require('../src/gameLogic');

describe('Ship', () => {
  let ship;

  beforeEach(() => {
    ship = new Ship(3, 'Destroyer');
  });

  test('should create a ship with the correct length', () => {
    expect(ship.length).toBe(3);
  });

  test('should create a ship with the correct name', () => {
    expect(ship.name).toBe('Destroyer');
  });

  test('should create a ship with all positions not hit', () => {
    expect(ship.hits).toEqual([false, false, false]);
  });

  test('should not be sunk when created', () => {
    expect(ship.isSunk()).toBe(false);
  });

  test('should register hits correctly', () => {
    ship.registerHit(0, 0, 0);
    expect(ship.hits).toEqual([true, false, false]);
    expect(ship.hitCoordinates).toEqual([{x: 0, y: 0}]);
  });

  test('should be sunk when all positions are hit', () => {
    ship.registerHit(0, 0, 0);
    ship.registerHit(1, 1, 0);
    ship.registerHit(2, 2, 0);
    expect(ship.hits).toEqual([true, true, true]);
    expect(ship.isSunk()).toBe(true);
  });

  test('should have the correct CSS class', () => {
    expect(ship.cssClass).toBe('ship-destroyer');
  });

  test('should handle spaces in ship names for CSS classes', () => {
    const patrolBoat = new Ship(2, 'Patrol Boat');
    expect(patrolBoat.cssClass).toBe('ship-patrol-boat');
  });
});
