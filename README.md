# ⚖️ Balance Scale Game

> **"Ideally, the answer should be the number everyone else chooses."**

A real-time, room-based multiplayer strategic survival game inspired by the legendary "Balance Scale" (King of Diamonds) game from *Alice in Borderland*. Built with a modern **React + Vite** frontend and a stateless **Python + Flask** backend.

---

## 🎮 Game Features

*   **🚪 Room-Based Multiplayer**: Users can create private game rooms to generate a unique 4-digit code, or join existing rooms using their name and the room code. Multiple game rooms run concurrently in complete isolation.
*   **👥 Creator Controls**: The creator of a room has exclusive permissions to start the match, add or remove computer-controlled AI bots (capped at 10 total players), and proceed to subsequent rounds.
*   **⏱️ 15-Second Turn Timer**: A dynamic, ticking countdown progress bar keeps the pressure high. If a player fails to make a selection within the 15-second limit, they are automatically eliminated due to `Timeout`.
*   **🛡️ Anti-Cheating Protection**: Payload masking is implemented on the backend. During active play, other players' choices are hidden from API payloads (`current_choice` is masked as `-3`), preventing tech-savvy players from inspecting network responses to gain an unfair advantage.
*   **🔄 Session Reconnection**: Player credentials (`playerName`, `roomCode`, and `playerId`) are persisted in `sessionStorage`. If a player accidentally refreshes their page or loses connection briefly, they are instantly reconnected without losing their score or status.
*   **🌐 Active Rooms Counter**: A glassmorphic indicator with a pulsing live status dot displays the number of active matches globally. The indicator is visible during lobby screens but is automatically hidden during active gameplay to maximize screen space.
*   **📱 Mobile & Tablet Responsive**: Fully optimized layout using CSS Grid, container query inline-sizes, and fluid typography. The 101 selection tiles scale and refit inline on all screens (down to 320px wide) without horizontal scrollbars, keeping the game fully playable on mobile devices.
*   **🎨 Premium Glassmorphism Design**: Rich styling utilizing modern CSS tokens, Harmonious HSL colors, dark mode, smooth scaling animations, and vector graphics (including a custom high-resolution SVG favicon).

---

## 📜 Core Rules

1.  **Selection**: In each round, all active players must select an integer between **0 and 100** within the 15-second time limit.
2.  **Duplicate Elimination**: If two or more players select the **same number**, they are **immediately eliminated** for that round and take a maximum penalty of `-10` points.
3.  **The Balance (3+ Surviving Players)**:
    *   The **Mean (Average)** of all surviving players' selections is calculated and multiplied by **0.8** to find the *target number*.
    *   The **Standard Deviation (SD)** of the selections is calculated.
    *   The player closest to the target number is safe (takes `0` penalty).
    *   All other surviving players take a penalty based on their distance from the target number in Standard Deviation units:
        *   Within 1 SD: `-1` point
        *   Between 1 and 2 SD: `-2` points
        *   Between 2 and 3 SD: `-3` points
        *   More than 3 SD: `-4` points
4.  **1v1 Duel (Final Showdown)**:
    *   When only two players remain, the logic shifts.
    *   The **Higher Number Wins**.
    *   *Exception*: If one player chooses **0** and the other chooses **100**, the player who chose **0** wins.
    *   The loser of the duel takes a `-1` penalty.
5.  **Bankruptcy & Elimination**:
    *   Players start with **10 points**.
    *   A player is eliminated if their points drop to `0` or below.
    *   Eliminated players can stay in the room and spectate the remaining players and bots, or click **Leave** to return to the main lobby.
    *   The game ends when only one player remains.

---

## 🛠️ Tech Stack

*   **Frontend**: React (v18), Vite, Vanilla CSS (Glassmorphism layout, Container queries).
*   **Backend**: Python (v3), Flask, Flask-CORS, Gunicorn (running with 1 worker to ensure memory state stability across room instances).

---

## 🚀 Installation & Local Setup

### Prerequisites
*   [Node.js](https://nodejs.org/) & npm
*   [Python 3](https://www.python.org/) & pip

### 1. Setup

**Clone the repository and install dependencies:**

```bash
# Setup Python Environment
python3 -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt

# Install Frontend Dependencies
npm run frontend:install
```

### 2. Run the Game locally

**Terminal 1 (Flask API Backend - Port 5000):**
```bash
python app.py
```

**Terminal 2 (React Vite Frontend - Port 5173):**
```bash
npm run frontend
```
Navigate to `http://localhost:5173` in your browser.

---

## 📂 Project Structure

```
Balance_Scale/
├── app.py                  # Flask REST API entry point
├── bots.py                 # Bot AI decision logic & archetypes
├── game_logic.py           # Core Game, Player, and Statistics Engine
├── host.md                 # Detailed Hosting & Deployment Guide
├── package.json            # Monorepo setup scripts
├── requirements.txt        # Backend dependencies
├── render.yaml             # Render deployment config
└── frontend/               # React + Vite project
    ├── index.html          # HTML Shell & Google Fonts link
    ├── vite.config.js      # Vite build & local dev proxies
    ├── vercel.json         # Vercel SPA routing rules
    ├── public/
    │   └── favicon.svg     # Premium custom vector scale favicon
    └── src/
        ├── main.jsx        # App mounting point
        ├── index.css       # Design tokens & responsive styles
        ├── App.jsx         # Game state controllers, polling loops, & step screens
        └── components/
            ├── TileGrid.jsx      # Symmetrical 0-100 tile selection dashboard
            ├── PlayerStatus.jsx  # Live Leaderboard (auto-sorting, highlights current player)
            └── ResultsPanel.jsx  # Round stats (Mean, SD), duel banners, & results table
```

---

## 🤖 Bot AI Archetypes

Bots are added dynamically and use historical round data to select numbers:
*   **Conservative**: Sticks close to the previous round's mean value.
*   **Gambler**: Aggressively targets extremes, selecting close to `0` or `100`.
*   **Follower**: Mimics successful choices from survivors of the previous round.
*   **Contrarian**: Intentionally selects numbers far away from the previous mean.
*   **Anxious**: Erratic, unpredictable choices.
*   **Balanced**: Selects values near the initial expected equilibrium of `50`.

---

## 🧪 Automated Testing

We have built automated validation scripts located in the brain/scratch folders to verify stability:
*   **Backend Logic Tests**: Runs Python unit tests verifying room isolation, duplicate checks, 1v1 duel triggers, timeout evaluations, and player departures.
    ```bash
    python3 scratch/multiplayer_test.py
    ```
*   **Selenium Integration Tests**: Boots up a local environment, opens multiple headless Chrome windows, joins them to the same room, adds a bot, starts the game, submits selections, and checks that elements (like active room counts) display or hide correctly.
    ```bash
    python3 scratch/local_browser_test.py
    ```
