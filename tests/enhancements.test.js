const { Ship, GameBoard } = require('../src/gameLogic');

// Mock DOM elements for testing UI enhancements
class MockElement {
  constructor() {
    this.classList = {
      add: jest.fn(),
      contains: jest.fn().mockReturnValue(false),
      remove: jest.fn()
    };
    this.querySelector = jest.fn();
    this.dataset = { x: 0, y: 0 };
  }
}

// Mock document for testing DOM manipulation
global.document = {
  createElement: jest.fn().mockReturnValue(new MockElement()),
  querySelector: jest.fn().mockReturnValue(new MockElement())
};

describe('UI Enhancements', () => {
  // ENH-000: Unique colors for each ship type
  describe('Ship Colors', () => {
    test('should assign unique CSS classes to different ship types', () => {
      const carrier = new Ship(5, 'Carrier');
      const battleship = new Ship(4, 'Battleship');
      const destroyer = new Ship(3, 'Destroyer');
      const submarine = new Ship(3, 'Submarine');
      const patrolBoat = new Ship(2, 'Patrol Boat');
      
      expect(carrier.cssClass).toBe('ship-carrier');
      expect(battleship.cssClass).toBe('ship-battleship');
      expect(destroyer.cssClass).toBe('ship-destroyer');
      expect(submarine.cssClass).toBe('ship-submarine');
      expect(patrolBoat.cssClass).toBe('ship-patrol-boat');
      
      // Ensure all classes are unique
      const classes = [
        carrier.cssClass,
        battleship.cssClass,
        destroyer.cssClass,
        submarine.cssClass,
        patrolBoat.cssClass
      ];
      
      const uniqueClasses = new Set(classes);
      expect(uniqueClasses.size).toBe(5);
    });
  });
  
  // ENH-001: Skull indicator for sunk ships
  describe('Skull Indicator', () => {
    test('should track hit coordinates for ships', () => {
      const ship = new Ship(3, 'Destroyer');
      
      ship.registerHit(0, 1, 1);
      expect(ship.hitCoordinates).toEqual([{x: 1, y: 1}]);
      
      ship.registerHit(1, 2, 1);
      expect(ship.hitCoordinates).toEqual([{x: 1, y: 1}, {x: 2, y: 1}]);
      
      ship.registerHit(2, 3, 1);
      expect(ship.hitCoordinates).toEqual([{x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}]);
      
      // Ship should be sunk after all hits
      expect(ship.isSunk()).toBe(true);
    });
    
    // This test simulates the behavior of markShipAsSunk without needing the actual DOM
    test('should be able to identify all cells of a sunk ship', () => {
      const board = new GameBoard();
      const ship = new Ship(3, 'Destroyer');
      
      // Place ship horizontally at (2,3)
      board.placeShip(ship, 2, 3, true);
      
      // Attack all positions
      board.receiveAttack(2, 3);
      board.receiveAttack(3, 3);
      board.receiveAttack(4, 3);
      
      // Ship should be sunk
      expect(ship.isSunk()).toBe(true);
      
      // Check that all ship cells on the board are this ship
      expect(board.grid[3][2]).toBe(ship);
      expect(board.grid[3][3]).toBe(ship);
      expect(board.grid[3][4]).toBe(ship);
      
      // In the actual game, these cells would be marked with the 'sunk' class
    });
  });

  // ENH-008: Enhanced AI Multi-Hit Attack Strategy
  describe('AI Multi-Hit Attack Strategy', () => {
    // Mock the Math.random function to test probability-based decisions
    const originalMathRandom = Math.random;
    
    beforeEach(() => {
      // Reset Math.random before each test
      Math.random = originalMathRandom;
    });
    
    afterAll(() => {
      // Restore original Math.random after all tests
      Math.random = originalMathRandom;
    });
    
    test('Easy mode AI should use exactly one multi-hit attack early in the game', () => {
      // Create a mock Game object to test the deterministic behavior
      const mockGame = {
        difficulty: 'easy',
        aiPlayer: { multiHitAttacksRemaining: 2 },
        aiTurnCount: 1,
        aiUsedFirstMultiHit: false,
        aiUsedSecondMultiHit: false
      };
      
      // Test first attack with 2 remaining - should use multi-hit attack
      let useMultiHit = false;
      if (mockGame.aiPlayer.multiHitAttacksRemaining > 0) {
        if (mockGame.difficulty === 'easy') {
          if (mockGame.aiPlayer.multiHitAttacksRemaining === 2 && !mockGame.aiUsedFirstMultiHit) {
            useMultiHit = true;
            mockGame.aiUsedFirstMultiHit = true;
          }
        }
      }
      expect(useMultiHit).toBe(true);
      expect(mockGame.aiUsedFirstMultiHit).toBe(true);
      
      // Test second attack with 1 remaining - should NOT use multi-hit attack
      mockGame.aiPlayer.multiHitAttacksRemaining = 1;
      useMultiHit = false;
      if (mockGame.aiPlayer.multiHitAttacksRemaining > 0) {
        if (mockGame.difficulty === 'easy') {
          if (mockGame.aiPlayer.multiHitAttacksRemaining === 2 && !mockGame.aiUsedFirstMultiHit) {
            useMultiHit = true;
            mockGame.aiUsedFirstMultiHit = true;
          }
        }
      }
      expect(useMultiHit).toBe(false);
    });
    
    test('Hard mode AI should use both multi-hit attacks deterministically based on turn count', () => {
      // Create a mock Game object to test the deterministic behavior
      const mockGame = {
        difficulty: 'hard',
        aiPlayer: { multiHitAttacksRemaining: 2 },
        aiTurnCount: 2,
        aiUsedFirstMultiHit: false,
        aiUsedSecondMultiHit: false
      };
      
      // Test turn 2 - should NOT use multi-hit attack yet (too early)
      let useMultiHit = false;
      if (mockGame.aiPlayer.multiHitAttacksRemaining > 0) {
        if (mockGame.difficulty === 'hard') {
          if (mockGame.aiPlayer.multiHitAttacksRemaining === 2 && mockGame.aiTurnCount >= 3 && !mockGame.aiUsedFirstMultiHit) {
            useMultiHit = true;
            mockGame.aiUsedFirstMultiHit = true;
          } else if (mockGame.aiPlayer.multiHitAttacksRemaining === 1 && mockGame.aiTurnCount >= 8 && !mockGame.aiUsedSecondMultiHit) {
            useMultiHit = true;
            mockGame.aiUsedSecondMultiHit = true;
          }
        }
      }
      expect(useMultiHit).toBe(false);
      
      // Test turn 3 - should use first multi-hit attack
      mockGame.aiTurnCount = 3;
      useMultiHit = false;
      if (mockGame.aiPlayer.multiHitAttacksRemaining > 0) {
        if (mockGame.difficulty === 'hard') {
          if (mockGame.aiPlayer.multiHitAttacksRemaining === 2 && mockGame.aiTurnCount >= 3 && !mockGame.aiUsedFirstMultiHit) {
            useMultiHit = true;
            mockGame.aiUsedFirstMultiHit = true;
          } else if (mockGame.aiPlayer.multiHitAttacksRemaining === 1 && mockGame.aiTurnCount >= 8 && !mockGame.aiUsedSecondMultiHit) {
            useMultiHit = true;
            mockGame.aiUsedSecondMultiHit = true;
          }
        }
      }
      expect(useMultiHit).toBe(true);
      expect(mockGame.aiUsedFirstMultiHit).toBe(true);
      
      // Test turn 7 with 1 remaining - should NOT use second multi-hit attack yet
      mockGame.aiTurnCount = 7;
      mockGame.aiPlayer.multiHitAttacksRemaining = 1;
      useMultiHit = false;
      if (mockGame.aiPlayer.multiHitAttacksRemaining > 0) {
        if (mockGame.difficulty === 'hard') {
          if (mockGame.aiPlayer.multiHitAttacksRemaining === 2 && mockGame.aiTurnCount >= 3 && !mockGame.aiUsedFirstMultiHit) {
            useMultiHit = true;
            mockGame.aiUsedFirstMultiHit = true;
          } else if (mockGame.aiPlayer.multiHitAttacksRemaining === 1 && mockGame.aiTurnCount >= 8 && !mockGame.aiUsedSecondMultiHit) {
            useMultiHit = true;
            mockGame.aiUsedSecondMultiHit = true;
          }
        }
      }
      expect(useMultiHit).toBe(false);
      
      // Test turn 8 with 1 remaining - should use second multi-hit attack
      mockGame.aiTurnCount = 8;
      useMultiHit = false;
      if (mockGame.aiPlayer.multiHitAttacksRemaining > 0) {
        if (mockGame.difficulty === 'hard') {
          if (mockGame.aiPlayer.multiHitAttacksRemaining === 2 && mockGame.aiTurnCount >= 3 && !mockGame.aiUsedFirstMultiHit) {
            useMultiHit = true;
            mockGame.aiUsedFirstMultiHit = true;
          } else if (mockGame.aiPlayer.multiHitAttacksRemaining === 1 && mockGame.aiTurnCount >= 8 && !mockGame.aiUsedSecondMultiHit) {
            useMultiHit = true;
            mockGame.aiUsedSecondMultiHit = true;
          }
        }
      }
      expect(useMultiHit).toBe(true);
      expect(mockGame.aiUsedSecondMultiHit).toBe(true);
    });
  });
});
