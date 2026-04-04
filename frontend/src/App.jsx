import React, { useState, useEffect } from 'react';
import TileGrid from './components/TileGrid';
import PlayerStatus from './components/PlayerStatus';
import ResultsPanel from './components/ResultsPanel';

function App() {
    const [gameState, setGameState] = useState(null);
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [roundResults, setRoundResults] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [botCount, setBotCount] = useState(5);

    const startGame = async () => {
        try {
            const res = await fetch('/start-game', {
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
            console.error(err);
        }
    };

    const submitTurn = async (number = null) => {
        // If number passed directly (auto-submit), set it
        if (number !== null) {
            setSelectedNumber(number);
        }

        // logic: 
        // If human is alive, number is needed.
        // If human is eliminated, number is usually null, but we call endpoint to advance.

        // Check if human is eliminated
        const human = gameState?.players.find(p => p.id === 'human');
        const isHumanEliminated = human?.is_eliminated;

        if (!isHumanEliminated && number === null && selectedNumber === null) {
            return; // waiting for checking
        }

        const payload = (isHumanEliminated) ? {} : { number: number ?? selectedNumber };

        try {
            const res = await fetch('/submit-turn', {
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
            console.error(err);
        }
    };

    const nextRound = async () => {
        if (roundResults?.game_over) {
            setGameStarted(false); // Go back to lobby or just reset
            // Actually user might want to restart immediately
            setRoundResults(null);
            setGameState(null);
            return;
        }

        try {
            const res = await fetch('/game-state');
            const data = await res.json();
            setGameState(data);
            setRoundResults(null);
            setSelectedNumber(null);
        } catch (err) {
            console.error(err);
        }
    };

    if (!gameStarted) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
            }}>
                <div className="glass" style={{ padding: '3rem', maxWidth: '600px', width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    {/* Decorative background glow */}
                    <div style={{
                        position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
                        zIndex: 0, pointerEvents: 'none'
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{
                            fontSize: '3.5rem',
                            marginBottom: '0.2rem',
                            background: 'linear-gradient(135deg, #fff 0%, #8b5cf6 50%, #3b82f6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.1
                        }}>
                            Balance Scale
                        </h1>
                        <p style={{
                            color: '#94a3b8',
                            fontSize: '0.9rem',
                            marginBottom: '2rem',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase'
                        }}>
                            Developed by RoSY
                        </p>

                        <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem' }}>
                            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: '#10b981' }}>⚡</span> Rules of Engagement
                            </h3>
                            <ul style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', paddingLeft: '1.2rem', margin: 0 }}>
                                <li style={{ marginBottom: '0.5rem' }}>Select a number between <strong>0 and 100</strong>.</li>
                                <li style={{ marginBottom: '0.5rem' }}>Target the <strong>Mean (Average)</strong> of all players' choices.</li>
                                <li style={{ marginBottom: '0.5rem' }}><strong>Duplicate</strong> numbers eliminate each other instantly!</li>
                                <li style={{ marginBottom: '0.5rem' }}>Points are deducted based on your distance from the Mean.</li>
                                <li><strong>1v1 Duel:</strong> Higher number wins (except 0 beats 100).</li>
                            </ul>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <label style={{ color: '#94a3b8', fontWeight: 600 }}>Opponent Bots:</label>
                            <input
                                type="number"
                                min="1"
                                max="15"
                                value={botCount}
                                onChange={(e) => {
                                    let val = parseInt(e.target.value);
                                    if (isNaN(val)) val = 1;
                                    if (val < 1) val = 1;
                                    if (val > 10) val = 10;
                                    setBotCount(val);
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    padding: '0.6rem',
                                    borderRadius: '0.5rem',
                                    width: '70px',
                                    textAlign: 'center',
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold'
                                }}
                            />
                        </div>

                        <button
                            className="btn-primary"
                            onClick={startGame}
                            style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}
                        >
                            Enter the Arena
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Determine which player list to show: round results (with outcomes) or current state
    const playersToShow = roundResults ? roundResults.results : (gameState?.players || []);
    const humanPlayer = gameState?.players.find(p => p.id === 'human');
    const isHumanEliminated = humanPlayer?.is_eliminated;

    const handleRestart = () => {
        setGameStarted(false);
        setRoundResults(null);
        setGameState(null);
        setSelectedNumber(null);
    };

    return (
        <div className="main-layout">
            <div className="game-area">
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', maxWidth: '800px' }}>
                    <h2 style={{
                        fontSize: '2rem',
                        background: 'linear-gradient(135deg, #fff 0%, #8b5cf6 50%, #3b82f6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                        margin: 0
                    }}>
                        Balance Scale
                    </h2>
                    <div style={{
                        padding: '0.5rem 1.2rem',
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '9999px',
                        color: '#c4b5fd',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        boxShadow: '0 0 10px rgba(139, 92, 246, 0.15)',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase'
                    }}>
                        Round <span style={{ color: '#fff', fontSize: '1.1rem', marginLeft: '0.3rem' }}>{gameState?.round}</span>
                    </div>
                </div>

                {isHumanEliminated && !roundResults && (
                    <div className="glass" style={{ padding: '2rem', textAlign: 'center', margin: '2rem', border: '1px solid #ef4444' }}>
                        <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>You have been eliminated</h3>
                        <p style={{ marginBottom: '1rem', color: '#94a3b8' }}>Watch the bots fight for survival.</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className="btn-primary" onClick={() => submitTurn(null)}>
                                Simulate Next Round
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleRestart}
                                style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', boxShadow: 'none' }}
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
                        revealedNumbers={roundResults ? roundResults.results.map(r => r.current_choice).filter(n => n !== null) : []}
                        onRestart={handleRestart}
                    />
                )}
            </div>

            <div className="sidebar">
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{
                        fontSize: '2rem',
                        background: 'linear-gradient(135deg, #fff 0%, #8b5cf6 50%, #3b82f6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                        margin: 0
                    }}>
                        Leaderboard
                    </h2>
                    <div style={{
                        padding: '0.4rem 0.8rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.5rem',
                        color: '#94a3b8',
                        fontWeight: '600',
                        fontSize: '0.8rem'
                    }}>
                        {playersToShow.filter(p => !p.is_eliminated).length} Alive
                    </div>
                </div>
                <PlayerStatus players={playersToShow} />
            </div>

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
