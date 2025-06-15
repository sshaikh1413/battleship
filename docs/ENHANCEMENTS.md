# Enhancements Log

All planned and implemented enhancements to the Battleship game will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- **ENH-002**: Code refactoring for better testability
  - Refactor codebase to eliminate redundancy between game.js and src/gameLogic.js
  - Implement proper separation of concerns: core game logic vs UI code
  - Options include:
    - Using gameLogic.js as the source of truth and importing it in the browser
    - Implementing a build system (Webpack/Parcel) with proper JS modules
  - Benefits: Improved maintainability, single source of truth for game logic
  - Priority: Medium
  - Proposed: 2025-06-14 02:16:30 CST
  - Status: Planned

### Implemented
- **ENH-008**: Enhanced AI Multi-Hit Attack Strategy

**Status: Completed**

Enhanced the AI's use of multi-hit attacks based on difficulty level:

- Easy mode: AI uses exactly one multi-hit attack early in the game (first opportunity)
- Hard mode: AI uses both multi-hit attacks deterministically - first attack around turn 3-5, second attack around turn 8-12

This makes the AI more challenging in hard mode while keeping it manageable in easy mode.

  - Implemented: 2025-06-14 23:14:54 CST
  - Status: Completed

- **ENH-007**: Improved Game Pacing
  - Reduced AI turn delay by 50% (from 1000ms to 500ms)
  - Reduced transition delay between player and AI turns by 50% (from 500ms to 250ms)
  - Reduced multi-hit attack animation delay by 50% (from 1500ms to 750ms)
  - Results in more responsive gameplay and better overall pacing
  - Implemented: 2025-06-14 14:26:11 CST
  - Status: Completed

- **ENH-006**: Improved Multi-Hit Button UX
  - Disabled multi-hit attack button until game starts
  - Prevents accidental use during setup phase
  - Provides clearer user interface guidance
  - Implemented: 2025-06-14 14:23:25 CST
  - Status: Completed

- **ENH-009**: Enhanced AI Targeting Strategy
  - Improved the AI's targeting strategy to make it more challenging and realistic
  - Enhanced target mode to better select adjacent coordinates after a hit
  - Added direction tracking to avoid retrying failed directions
  - Improved multi-hit targeting to detect ship orientation and target accordingly
  - Added gap detection to find ships with missed middle sections
  - Added persistent ship targeting to ensure ships are completely destroyed before moving on
  - Implemented high-value target identification for coordinates adjacent to multiple hits
  - Added logic to prevent the AI from giving up on partially hit ships
  - Implemented: 2025-06-15 00:25:00 CST
  - Status: Completed

- **ENH-005**: Advanced AI Difficulty Levels
  - Added two difficulty levels: Easy and Hard
  - Easy mode: Basic hunt/target AI with random shots
  - Hard mode: Advanced AI using probability density mapping, parity-based hunting, and intelligent ship targeting
  - Difficulty selection UI with active state indicators
  - Difficulty can only be changed before game starts
  - Implemented: 2025-06-14 14:08:41 CST
  - Status: Completed

- **ENH-004**: Multi-Hit Targeting Feature
  - Added special attack that hits 5 cells in a cross pattern (center + adjacent cells)
  - Limited to 2 uses per game for both player and AI
  - Rocket ship button with usage counter for player control
  - Hover effect to preview attack pattern on the grid
  - Explosion animation for visual feedback
  - AI has 30% chance to use multi-hit attack when available
  - Implemented: 2025-06-14 14:08:41 CST
  - Status: Completed
- **ENH-003**: Ship legend with color coordination
  - Added a legend section that displays each ship type with its corresponding color
  - Helps players identify which ship is which on the game board
  - Improves game clarity and user experience
  - Implemented: 2025-06-14 02:18:30 CST
  - Status: Completed

- **ENH-001**: Skull indicator for sunk ships
  - When a ship is fully destroyed, display skull icons (☠️) on all cells of that ship
  - Applies to both player and AI ships
  - Provides clear visual feedback when a ship is completely eliminated
  - Implemented: 2025-06-14 01:28:45 CST
  - Status: Completed

- **ENH-000**: Unique colors for each ship type
  - Added distinct colors for each ship type (Carrier, Battleship, Destroyer, Submarine, Patrol Boat)
  - Makes it easier to identify different ships on the board
  - Implemented: 2025-06-14 01:12:35 CST
  - Status: Completed
