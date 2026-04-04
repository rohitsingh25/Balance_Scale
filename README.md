# Balance Scale Game

**"Ideally, the answer should be the number everyone else chooses."**

A strategic survival game inspired by the "Balance Scale" game from *Alice in Borderland*. Built with **React** (Frontend) and **Flask** (Backend).

**Developed by: RoSY**

![Balance Scale Preview](frontend/public/favicon.png)

## 🎮 Game Overview

You are competing against AI bots. All players must choose a number between **0 and 100**.

### 📜 Core Rules

1.  **Selection**: Everyone picks a number from 0-100.
2.  **Duplicate Elimination**: If two or more players pick the **same number**, they are **immediately eliminated**.
3.  **The Balance (3+ Players)**:
    *   The **Mean (Average)** of all surviving numbers is calculated.
    *   The **Standard Deviation (SD)** is computed.
    *   **Penalty**: Players lose points based on their distance from the Mean (0-1 SD = -1, 1-2 SD = -2, etc.). Closest player is safe (0 penalty).
4.  **1v1 Duel (Final Showdown)**:
    *   When only two players remain, the logic changes.
    *   **Higher Number Wins**.
    *   **Exception**: If one chooses **0** and the other **100**, the **0** wins.
    *   Loser takes a **-1 penalty**.
5.  **Game Over**: 
    *   You are eliminated if your points drop to 0.
    *   The game ends when only one player remains.
    *   If you are eliminated, you can **Spectate** the bots or **Restart**.

---

## 🛠️ Tech Stack

*   **Frontend**: React, Vite, Vanilla CSS (Glassmorphism design, Responsive Layout)
*   **Backend**: Python, Flask, Flask-CORS
*   **AI**: Custom Bot Archetypes (Conservative, Gambler, Contrarian, etc.)

---

## 🚀 Installation & Setup

### Prerequisites
*   Node.js & npm
*   Python 3 & pip

### 1. Setup

**Install Dependencies (Python & Node):**

```bash
# Setup Python Environment
python3 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Install Frontend Dependencies
npm run frontend:install
```

### 2. Run the Game

**Terminal 1 (Backend):**

```bash
python app.py
```

**Terminal 2 (Frontend):**

```bash
npm run frontend
```

---

## 📂 Project Structure

```
Balance Scale/
├── .gitignore
├── requirements.txt
├── package.json
├── venv/
├── app.py           # Flask Entry Point
├── bots.py          # AI Bot Archetypes
├── game_logic.py    # Game Rules & Statistics Engine
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx           # Main Game Loop (UI Layout, Restart Logic)
│       ├── index.css         # Global Styles (Glassmorphism, Grid/Flex Layouts)
│       └── components/
│           ├── TileGrid.jsx      # Number Selection UI (0-100 + Restart Tile)
│           ├── PlayerStatus.jsx  # Leaderboard (Auto-sorted, Alive Counter)
│           └── ResultsPanel.jsx  # Round Summaries & Winners
└── README.md
```

## 🤖 Bot Archetypes

*   **Conservative**: Sticks close to the average.
*   **Gambler**: Takes risks on extreme numbers (0 or 100).
*   **Contrarian**: Deliberately avoids the likely crowd.
*   **Follower**: Mimics successful numbers from previous rounds.
*   **Anxious**: Behaves erratically.

---

*Good luck. The scale is set.*
