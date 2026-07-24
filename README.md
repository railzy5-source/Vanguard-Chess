# Hikari Chess Coach (DavinciChess Clone)

Hikari Chess Coach is a full-featured, interactive chess coaching web application inspired by [DavinciChess](https://davincichess.pages.dev/). It features real-time Stockfish AI gameplay, move timeline scrubbing, best-move colored arrow overlays, a deep dive 10-ply decision tree review system, and Coach Hikari — a supportive, witty AI chess coach.

---

## 🌟 Key Features

### 1. Game Tab (Play)
- **Interactive Chessboard**: Responsive vector SVG chessboard supporting both drag-and-drop and click-to-move interactions.
- **Stockfish AI Engine**: Plays against Stockfish with customizable difficulty modes (Beginner ~ ELO 1000, Club ~ ELO 1500, Master ~ ELO 2200).
- **Move Timeline Scrubber**: `⏮️ First`, `◀️ Back`, `▶️ Next`, `⏭️ Current` buttons allowing you to scrub back through game move history at any time.
- **Best-Move Colored Arrows**: Live SVG overlays showing top candidate moves calculated by Stockfish (Rank 1: Green, Rank 2: Blue, Rank 3: Gold).
- **Game Controls**: `Undo` (rewinds 1 full turn), `Resign`, `New Game`, and `Expand` (fullscreen board view).
- **Coach Hikari**: Flirtatious, funny, and supportive AI grandmaster coach reacting dynamically to brilliant moves, blunders, captures, checks, and game states.

### 2. Deep Dive Tab (Review & Decision Tree)
- **Main Line Board**: Replays the finished or active game move-by-move with best-move arrows for every position.
- **Candidate Branch List**: Evaluates the position on the Main Line Board using Stockfish MultiPV analysis to display top candidate moves with evaluations (`+1.4`, `-0.2`) and tactical tags (`Best Move`, `Solid`, `Tactical`).
- **Branch Line Board (10-Ply Continuation)**: Tapping any candidate move in the Branch List loads a second board displaying the exact **10-ply (5 full moves)** continuation line calculated by Stockfish.
- **Branch Scrubber**: Allows step-by-step navigation through the 10-ply branch variation.

### 3. Menu Tab (☰ Settings & LocalStorage)
- **Settings**: Choose color (`White`, `Black`, or `Random`), AI difficulty, and toggle best-move arrows.
- **Save Game**: Store current game PGN, move history, and results in browser `localStorage`.
- **Quick Panel / Saved Games**: View and manage all saved games. Click "Review in Deep Dive" to immediately load any saved game for branch analysis.

---

## 🛠️ Architecture & Code Structure

The application is structured into modular ES modules:

| File | Purpose |
| --- | --- |
| `index.html` | Primary HTML shell with responsive tab layout and dark theme container |
| `src/style.css` / `style.css` | Dark-themed styling using Tailwind CSS, glassmorphism, and smooth animations |
| `src/script.js` / `script.js` | Main application orchestrator managing game loop, tabs, scrubbers, and state |
| `src/engine.js` / `engine.js` | Stockfish UCI Web Worker wrapper with MultiPV analysis and offline fallback engine |
| `src/board.js` / `board.js` | Interactive SVG board component handling drag/drop, legal dots, and SVG arrows |
| `src/coach.js` / `coach.js` | Coach Hikari dialogue engine, emotion triggers, and avatar display |
| `src/storage.js` / `storage.js` | LocalStorage manager for saved games and settings persistence |

---

## 🚀 How to Run

### Development Mode (Vite)
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser.

### Static Server
Because the application uses standard ES modules and Web Workers, you can also serve it with any HTTP static server (such as `npx serve`, `python -m http.server`, or Live Server).

---

## 📜 License
Apache-2.0 / MIT
