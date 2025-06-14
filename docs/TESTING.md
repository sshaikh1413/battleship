# Battleship Game Test Suite

This document describes the test suite for the Battleship game, which has been implemented to prevent regression of previously fixed bugs and to ensure enhancements work as expected.

## Test Structure

The test suite is organized into several test files, each focusing on a specific component of the game:

1. **Ship Tests** (`ship.test.js`): Tests for the Ship class functionality
2. **GameBoard Tests** (`gameBoard.test.js`): Tests for the GameBoard class and game logic
3. **AIPlayer Tests** (`aiPlayer.test.js`): Tests for AI behavior and ship placement
4. **Enhancement Tests** (`enhancements.test.js`): Tests for UI enhancements like ship colors and skull indicators

## Bug Coverage

The test suite specifically covers the following bugs that were previously fixed:

- **BUG-001**: Ships could be placed outside grid boundaries
- **BUG-004**: AI board not responding to clicks after game start
- **BUG-005**: Game ended prematurely after first move
- **BUG-006**: Game not ending properly according to Battleship rules
- **BUG-007**: AI ships not appearing on grid
- **BUG-008**: Regenerate Ships adding extra ships instead of replacing them

## Enhancement Coverage

The test suite also covers the following enhancements:

- **ENH-000**: Unique colors for each ship type
- **ENH-001**: Skull indicator for sunk ships

## Running the Tests

To run the tests, simply use:

```bash
npm test
```

This will run all tests and display the results in the terminal.

## Adding New Tests

When adding new features or fixing bugs, please add corresponding tests to prevent regression:

1. For new game logic, add tests to the appropriate test file
2. For new UI features, add tests to `enhancements.test.js`
3. For bug fixes, add a test case that would fail before your fix and pass after

## Test Architecture

The tests use Jest as the testing framework. The game logic has been separated into a module (`src/gameLogic.js`) that can be tested independently of the DOM. For UI-related tests, we use mock DOM elements to simulate browser behavior.

## Continuous Integration

Consider setting up a CI pipeline to run these tests automatically on code changes to ensure code quality is maintained.
