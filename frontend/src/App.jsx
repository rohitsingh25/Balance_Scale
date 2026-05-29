import React, { useState } from 'react';
import TileGrid from './components/TileGrid';
import PlayerStatus from './components/PlayerStatus';
import ResultsPanel from './components/ResultsPanel';

// In production (Vercel), set VITE_API_URL to your Render backend URL
// In development, leave empty to use Vite proxy
const API_URL = import.meta.env.VITE_API_URL || '';

function App() {
    const [gameState, setGameState] = useState(null);
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [roundResults, setRoundResults] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [botCount, setBotCount] = useState(5);

    const startGame = async () => {
        try {
            const res = await fetch(`${API_URL}/start-game`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bot_count: botCount })
            });
            const data = await res.json();
            setGameState(data);
            setGameStarted(true);
            setRoundResults(null);
            setSelectedNumber(null);
        } catch (err) {
            console.error('Failed to start game:', err);
        }
    };

    const submitTurn = async (number = null) => {
        if (number !== null) {
            setSelectedNumber(number);
        }

        const human = gameState?.players.find(p => p.id === 'human');
        const isHumanEliminated = human?.is_eliminated;

        if (!isHumanEliminated && number === null && selectedNumber === null) {
            return;
        }

        const payload = isHumanEliminated ? {} : { number: number ?? selectedNumber };

        try {
            const res = await fetch(`${API_URL}/submit-turn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.error) {
                alert(data.error);
                return;
            }

            setRoundResults(data);
        } catch (err) {
            console.error('Failed to submit turn:', err);
        }
    };

    const nextRound = async () => {
        if (roundResults?.game_over) {
            setGameStarted(false);
            setRoundResults(null);
            setGameState(null);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/game-state`);
            const data = await res.json();
            setGameState(data);
            setRoundResults(null);
            setSelectedNumber(null);
        } catch (err) {
            console.error('Failed to fetch game state:', err);
        }
    };

    const handleRestart = () => {
        setGameStarted(false);
        setRoundResults(null);
        setGameState(null);
        setSelectedNumber(null);
    };

    // ─── LOBBY SCREEN ─────────────────────────────────
    if (!gameStarted) {
        return (
            <div className="lobby-container">
                <div className="glass lobby-card">
                    <div className="lobby-glow" />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <span className="scale-icon" role="img" aria-label="balance scale">⚖️</span>

                        <h1 className="gradient-text lobby-title">
                            Balance Scale
                        </h1>
                        <p className="lobby-subtitle">
                            Developed by RoSY
                        </p>

                        <div className="rules-box">
                            <h3 className="rules-title">
                                <span style={{ color: '#10b981' }}>⚡</span> Rules of Engagement
                            </h3>
                            <ul className="rules-list">
                                <li>Select a number between <strong>0 and 100</strong>.</li>
                                <li>Target the <strong>Mean (Average)</strong> of all players' choices.</li>
                                <li><strong>Duplicate</strong> numbers eliminate each other instantly!</li>
                                <li>Points are deducted based on your distance from the Mean.</li>
                                <li><strong>1v1 Duel:</strong> Higher number wins (except 0 beats 100).</li>
                            </ul>
                        </div>

                        <div className="bot-count-control">
                            <label className="bot-count-label" htmlFor="bot-count-input">
                                Opponent Bots:
                            </label>
                            <input
                                id="bot-count-input"
                                type="number"
                                min="1"
                                max="10"
                                value={botCount}
                                onChange={(e) => {
                                    let val = parseInt(e.target.value);
                                    if (isNaN(val)) val = 1;
                                    if (val < 1) val = 1;
                                    if (val > 10) val = 10;
                                    setBotCount(val);
                                }}
                                className="bot-count-input"
                            />
                        </div>

                        <button
                            id="start-game-btn"
                            className="btn-primary"
                            onClick={startGame}
                            style={{ width: '100%', fontSize: '1.05rem', padding: '1rem' }}
                        >
                            Enter the Arena
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── GAME SCREEN ──────────────────────────────────
    const playersToShow = roundResults ? roundResults.results : (gameState?.players || []);
    const humanPlayer = gameState?.players.find(p => p.id === 'human');
    const isHumanEliminated = humanPlayer?.is_eliminated;
    const aliveCount = playersToShow.filter(p => !p.is_eliminated).length;

    return (
        <div className="main-layout">
            {/* ─── LEFT: GAME AREA ─── */}
            <div className="game-area">
                <div className="game-header">
                    <h2 className="gradient-text game-title">
                        Balance Scale
                    </h2>
                    <div className="round-badge">
                        Round <span className="round-number">{gameState?.round}</span>
                    </div>
                </div>

                {isHumanEliminated && !roundResults && (
                    <div className="glass eliminated-panel">
                        <h3 className="eliminated-title">☠️ You have been eliminated</h3>
                        <p className="eliminated-subtitle">Watch the bots fight for survival.</p>
                        <div className="eliminated-actions">
                            <button
                                id="simulate-btn"
                                className="btn-primary"
                                onClick={() => submitTurn(null)}
                            >
                                Simulate Next Round
                            </button>
                            <button
                                id="restart-btn"
                                className="btn-primary"
                                onClick={handleRestart}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.12)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#ef4444',
                                    boxShadow: 'none'
                                }}
                            >
                                Restart Game
                            </button>
                        </div>
                    </div>
                )}

                {!isHumanEliminated && (
                    <TileGrid
                        selectedNumber={selectedNumber}
                        onSelect={(num) => submitTurn(num)}
                        disabled={!!roundResults}
                        revealedNumbers={
                            roundResults
                                ? roundResults.results
                                    .map(r => r.current_choice)
                                    .filter(n => n !== null)
                                : []
                        }
                        onRestart={handleRestart}
                    />
                )}
            </div>

            {/* ─── RIGHT: SIDEBAR ─── */}
            <div className="sidebar">
                <div className="leaderboard-header">
                    <h2 className="gradient-text leaderboard-title">
                        Leaderboard
                    </h2>
                    <div className="alive-badge">
                        {aliveCount} Alive
                    </div>
                </div>
                <PlayerStatus players={playersToShow} />
            </div>

            {/* ─── RESULTS OVERLAY ─── */}
            <ResultsPanel
                results={roundResults}
                onNext={nextRound}
                gameOver={roundResults?.game_over}
                winner={roundResults?.winner}
            />
        </div>
    );
}

export default App;
