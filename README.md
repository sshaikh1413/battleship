# Battleship Game

A browser-based implementation of the classic Battleship game where you play against an AI opponent.

![Battleship Game Screenshot](screenshot.png)

## Table of Contents
- [Game Overview](#game-overview)
- [How to Play](#how-to-play)
- [Ship Types](#ship-types)
- [Installation & Setup](#installation--setup)
- [Running the Game](#running-the-game)
- [Running Tests](#running-tests)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Enhancements & Bug Fixes](#enhancements--bug-fixes)
- [Future Improvements](#future-improvements)

## Game Overview

This Battleship game is a web-based implementation of the classic board game. Players attempt to sink all of the opponent's ships by guessing their locations on a 10x10 grid. The game features:

- Randomly placed ships for both player and AI
- Color-coded ships for easy identification
- Skull indicators (☠️) on sunk ships
- Two AI difficulty levels (Easy and Hard)
- Multi-hit targeting feature with limited uses
- Advanced AI with probability density mapping in Hard mode
- Comprehensive test suite to ensure game logic works correctly

## How to Play

1. When the game loads, your ships are automatically placed on your board (left grid)
2. If you don't like the ship placement, click the "Regenerate Ships" button
3. Select your preferred AI difficulty level (Easy or Hard) before starting
   - Easy: Basic AI with random shots and simple targeting
   - Hard: Advanced AI using probability density mapping and intelligent targeting
4. When ready, click "Start Game" to begin
5. Take turns with the AI by clicking on cells in the opponent's grid (right grid)
6. Use the multi-hit targeting feature (rocket icon) to attack 5 cells at once
   - Each player has 2 multi-hit attacks per game
   - The attack hits the selected cell plus the four adjacent cells
   - Hover over the AI grid in multi-hit mode to see the attack pattern
7. Hit ships are marked in red, misses are marked in gray
8. When a ship is completely sunk, all its cells are marked with skull icons (☠️)
9. The first player to sink all opponent ships wins
10. After the game ends, click "Play Again" to start a new game

## Ship Types

The game includes five different ships, each with a unique color:

- **Carrier** (5 cells) - Red
- **Battleship** (4 cells) - Dark green
- **Destroyer** (3 cells) - Purple
- **Submarine** (3 cells) - Orange
- **Patrol Boat** (2 cells) - Blue

## Installation & Setup

### Prerequisites

- Node.js (for running tests)
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Basic HTTP server capability (Python or any web server)

### Clone the Repository

```bash
git clone https://github.com/yourusername/battleship-game.git
cd battleship-game
```

### Install Dependencies

```bash
npm install
```

This will install Jest for running the test suite.

## Running the Game

You can run the game using any basic HTTP server. Here are a few options:

### Using Python (recommended for simplicity)

```bash
# Navigate to the public directory
cd public

# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open your browser and navigate to: `http://localhost:8000`

### Using Node.js (http-server)

If you have Node.js installed, you can use the http-server package:

```bash
# Install http-server globally if you haven't already
npm install -g http-server

# Run the server from the public directory
cd public
http-server -p 8000
```

Then open your browser and navigate to: `http://localhost:8000`

## Running Tests

The game includes a comprehensive test suite built with Jest. To run the tests:

```bash
npm test
```

This will run all tests and show the results in the terminal. For more details about the testing approach, see the [TESTING.md](TESTING.md) file.

## Technologies Used

- **HTML5**: Structure and layout
- **CSS3**: Styling and animations
- **JavaScript (ES6+)**: Game logic and interactivity
- **Jest**: Testing framework
- **Node.js**: Development environment and test runner

No external libraries or frameworks are used for the game itself, making it lightweight and fast to load.

## Project Structure

```
battleship-game/
├── public/                   # All public-facing assets
│   ├── css/                  # CSS files
│   │   └── styles.css
│   ├── js/                   # Frontend JavaScript
│   │   └── game.js
│   ├── images/               # Images and icons
│   └── index.html            # Main HTML file
├── src/                      # Source code
│   └── gameLogic.js          # Core game logic
├── tests/                    # Test files
│   ├── ship.test.js
│   ├── gameBoard.test.js
│   ├── aiPlayer.test.js
│   └── enhancements.test.js
├── docs/                     # Documentation
│   ├── ENHANCEMENTS.md
│   ├── TESTING.md
│   └── CHANGELOG.md
├── package.json              # NPM dependencies and scripts
├── package-lock.json
└── README.md                 # Project overview
```

## Enhancements & Bug Fixes

The game has undergone several enhancements and bug fixes. For a detailed list, see the [ENHANCEMENTS.md](ENHANCEMENTS.md) file.

Key enhancements include:
- Unique colors for different ship types
- Skull indicators for sunk ships
- Ship legend with color coordination
- Improved AI targeting logic

## Future Improvements

Potential future improvements include:
- Manual ship placement option
- Multiple difficulty levels for AI
- Sound effects and animations
- Multiplayer support
- Persistent statistics and high scores

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the classic Battleship board game by Hasbro
- Created as a learning project for web development and testing practices
