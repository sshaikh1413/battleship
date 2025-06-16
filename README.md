# Battleship Game

A browser-based implementation of the classic Battleship game where you play against an AI opponent. See a demo version of the game here: https://sshaikh1413.github.io/battleship/public/index.html

## Table of Contents
- [Game Overview](#game-overview)
- [How to Play](#how-to-play)
- [Ship Types](#ship-types)
- [Running the Game](#running-the-game)
- [Technologies Used](#technologies-used)
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

## Clone the Repository

```bash
git clone https://github.com/sshaikh1413/battleship.git
cd battleship
```

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

## Technologies Used

- **HTML5**: Structure and layout
- **CSS3**: Styling and animations
- **JavaScript (ES6+)**: Game logic and interactivity

No external libraries or frameworks are used for the game itself, making it lightweight and fast to load.

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
