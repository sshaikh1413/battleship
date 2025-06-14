# Changelog

All notable changes to the Battleship game will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial game setup with basic Battleship functionality
- AI opponent with hunt/target behavior
- Random ship placement with regenerate functionality

### Fixed
- **BUG-001**: Ships could be placed outside grid boundaries
  - Fixed by adding boundary checks in the placement algorithm
  - Date: 2025-06-14 00:00:00 CST
  - Status: Resolved

- **BUG-002**: Game allowed starting with incomplete ship placement
  - Added validation to ensure all ships are placed before starting
  - Date: 2025-06-14 00:02:30 CST
  - Status: Resolved

- **BUG-003**: Multiple clicks could break the game state
  - Added state management to prevent actions during AI turn
  - Date: 2025-06-14 00:05:15 CST
  - Status: Resolved

- **BUG-004**: AI board not responding to clicks after game start
  - Fixed click handler to properly manage game state and player turns
  - Added proper turn management and game over conditions
  - Added visual feedback during AI's turn
  - Date: 2025-06-14 00:56:48 CST
  - Status: Resolved

- **BUG-005**: Game ended prematurely after first move
  - Fixed hit detection logic in `receiveAttack` method
  - Improved ship tracking and hit registration
  - Added better error handling for AI turns
  - Date: 2025-06-14 01:00:10 CST
  - Status: Resolved

- **BUG-006**: Game not ending properly according to Battleship rules
  - Enhanced the `allShipsSunk` method to properly check if ships exist before determining game end
  - Added validation for attack coordinates in `receiveAttack` method
  - Improved game over handling with a Play Again button
  - Date: 2025-06-14 01:03:45 CST
  - Status: Resolved

- **BUG-007**: AI ships not appearing on the grid
  - Fixed by ensuring AI ships are placed on the board when the game starts
  - Added call to `aiPlayer.placeShips()` in the constructor
  - Added fallback ship placement in the `startGame` method
  - Added logging for hit detection to aid debugging
  - Date: 2025-06-14 01:07:45 CST
  - Status: Resolved

- **BUG-008**: Regenerate Ships adding extra ships instead of replacing them
  - Fixed by properly clearing all ship-specific CSS classes before placing new ships
  - Updated the grid cell cleanup to remove all ship type classes
  - Ensures only 5 ships are on the grid at any time
  - Date: 2025-06-14 01:18:45 CST
  - Status: Resolved

### Changed
- Ship placement is now automatic with manual regeneration option
- Improved UI with better visual feedback for ship placement
- Enhanced AI targeting logic for more challenging gameplay

## [1.0.0] - 2025-06-14 00:00:00 CST
### Added
- Initial release of Battleship game
- Basic game mechanics and AI opponent
