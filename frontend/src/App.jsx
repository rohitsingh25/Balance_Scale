import React, { useState, useEffect, useRef } from 'react';
import TileGrid from './components/TileGrid';
import PlayerStatus from './components/PlayerStatus';
import ResultsPanel from './components/ResultsPanel';

// In production (Vercel), set VITE_API_URL to your Render backend URL
// In development, leave empty to use Vite proxy
const getApiUrl = () => {
    let url = import.meta.env.VITE_API_URL || '';
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    return url;
};
const API_URL = getApiUrl();

function App() {
    // ─── STATE MANAGEMENT ──────────────────────────────
    const [playerName, setPlayerName] = useState(() => sessionStorage.getItem('bs_player_name') || '');
    const [roomCode, setRoomCode] = useState(() => sessionStorage.getItem('bs_room_code') || '');
    const [playerId, setPlayerId] = useState(() => sessionStorage.getItem('bs_player_id') || '');
    const [lobbyStep, setLobbyStep] = useState(() => {
        const hasRoom = sessionStorage.getItem('bs_room_code');
        const hasId = sessionStorage.getItem('bs_player_id');
        const hasName = sessionStorage.getItem('bs_player_name');
        if (hasRoom && hasId && hasName) return 'waiting_room';
        if (hasName) return 'room_selection';
        return 'name';
    });

    const [joinCode, setJoinCode] = useState('');
    const [gameState, setGameState] = useState(null);
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [lastRound, setLastRound] = useState(0);
    const [localTimeLeft, setLocalTimeLeft] = useState(15.0);

    const lastRoundRef = useRef(0);
    const consecutiveErrorsRef = useRef(0);

    // ─── ROOM POLICING (EFFECTS) ──────────────────────
    // Poller to sync room state with backend
    useEffect(() => {
        if (!roomCode || !playerId) return;

        let isMounted = true;
        const fetchState = async () => {
            try {
                const res = await fetch(`${API_URL}/room-state/${roomCode}?player_id=${playerId}`);
                if (res.status === 404) {
                    if (isMounted) {
                        alert("The game room was dissolved.");
                        handleLeave();
                    }
                    return;
                }
                if (!res.ok) {
                    throw new Error(`Server returned ${res.status}`);
                }
                const data = await res.json();
                if (isMounted) {
                    consecutiveErrorsRef.current = 0; // Reset error count on successful fetch
                    setGameState(data);
                    
                    // Reset selectedNumber and submitted locally when round changes
                    if (data.status === 'playing' && lastRoundRef.current !== data.round) {
                        setSelectedNumber(null);
                        setSubmitted(false);
                        lastRoundRef.current = data.round;
                        setLastRound(data.round);
                    }
                    
                    // Keep step in sync
                    if (data.status === 'lobby') {
                        setLobbyStep('waiting_room');
                    } else if (data.status === 'playing' || data.status === 'round_results' || data.status === 'game_over') {
                        setLobbyStep('playing');
                    }
                }
            } catch (err) {
                console.error("Polling error:", err);
                if (isMounted) {
                    consecutiveErrorsRef.current += 1;
                    // Tolerate up to 5 consecutive failures (approx. 7.5 seconds) before kicking the player.
                    // This handles server redeploys and temporary network glitches smoothly.
                    if (consecutiveErrorsRef.current >= 5) {
                        alert("Lost connection to the game server. Please try re-joining.");
                        handleLeave();
                    }
                }
            }
        };

        fetchState();
        const timer = setInterval(fetchState, 1500);

        return () => {
            isMounted = false;
            clearInterval(timer);
        };
    }, [roomCode, playerId]);

    // Local sub-second countdown timer for UI fluidness
    useEffect(() => {
        if (!gameState || gameState.status !== 'playing') return;
        const tick = () => {
            setLocalTimeLeft(prev => Math.max(0.0, prev - 0.1));
        };
        const timer = setInterval(tick, 100);
        return () => clearInterval(timer);
    }, [gameState?.status, gameState?.round]);

    // Keep client sub-second countdown synchronized with backend
    useEffect(() => {
        if (gameState && gameState.status === 'playing') {
            setLocalTimeLeft(gameState.time_left);
        }
    }, [gameState?.time_left]);

    // ─── ACTION IMPLEMENTATIONS ──────────────────────
    const createRoom = async () => {
        if (!playerName.trim()) return;
        try {
            const res = await fetch(`${API_URL}/create-room`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player_name: playerName.trim() })
            });
            const data = await res.json();
            if (data.error) {
                alert(data.error);
                return;
            }
            setPlayerId(data.player_id);
            setRoomCode(data.room_code);
            setGameState(data.room_state);
            setLobbyStep('waiting_room');
            sessionStorage.setItem('bs_player_id', data.player_id);
            sessionStorage.setItem('bs_room_code', data.room_code);
            sessionStorage.setItem('bs_player_name', playerName.trim());
        } catch (err) {
            console.error(err);
            alert("Could not connect to game server.");
        }
    };

    const joinRoom = async () => {
        if (!playerName.trim() || !joinCode.trim()) return;
        try {
            const res = await fetch(`${API_URL}/join-room`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_code: joinCode.trim(), player_name: playerName.trim() })
            });
            const data = await res.json();
            if (data.error) {
                alert(data.error);
                return;
            }
            setPlayerId(data.player_id);
            setRoomCode(data.room_code || joinCode.trim());
            setGameState(data.room_state);
            setLobbyStep('waiting_room');
            sessionStorage.setItem('bs_player_id', data.player_id);
            sessionStorage.setItem('bs_room_code', data.room_code || joinCode.trim());
            sessionStorage.setItem('bs_player_name', playerName.trim());
        } catch (err) {
            console.error(err);
            alert("Could not connect to game server. Verify code and try again.");
        }
    };

    const submitChoice = async (num) => {
        setSelectedNumber(num);
        setSubmitted(true);
        try {
            const res = await fetch(`${API_URL}/submit-choice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_code: roomCode,
                    player_id: playerId,
                    number: num
                })
            });
            const data = await res.json();
            if (data.error) {
                alert(data.error);
                setSubmitted(false);
                setSelectedNumber(null);
            } else {
                setGameState(data);
            }
        } catch (err) {
            console.error("Error submitting choice:", err);
            alert("Connection error. Choice not submitted.");
            setSubmitted(false);
            setSelectedNumber(null);
        }
    };

    const addBot = async () => {
        try {
            const res = await fetch(`${API_URL}/add-bot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_code: roomCode, player_id: playerId })
            });
            const data = await res.json();
            if (data.error) alert(data.error);
            else setGameState(data);
        } catch (err) {
            console.error(err);
        }
    };

    const removeBot = async (botId) => {
        try {
            const res = await fetch(`${API_URL}/remove-bot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_code: roomCode, player_id: playerId, bot_id: botId })
            });
            const data = await res.json();
            if (data.error) alert(data.error);
            else setGameState(data);
        } catch (err) {
            console.error(err);
        }
    };

    const startMultiplayerGame = async () => {
        try {
            const res = await fetch(`${API_URL}/start-game`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_code: roomCode, player_id: playerId })
            });
            const data = await res.json();
            if (data.error) alert(data.error);
            else {
                setGameState(data);
                lastRoundRef.current = data.round;
                setLastRound(data.round);
                setSubmitted(false);
                setSelectedNumber(null);
                setLobbyStep('playing');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const nextMultiplayerRound = async () => {
        try {
            const res = await fetch(`${API_URL}/next-round`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_code: roomCode, player_id: playerId })
            });
            const data = await res.json();
            if (data.error) alert(data.error);
            else {
                setGameState(data);
                lastRoundRef.current = data.round;
                setLastRound(data.round);
                setSubmitted(false);
                setSelectedNumber(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLeave = async () => {
        if (roomCode && playerId) {
            try {
                await fetch(`${API_URL}/leave-room`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ room_code: roomCode, player_id: playerId })
                });
            } catch (err) {
                console.error(err);
            }
        }
        // Reset states
        setRoomCode('');
        setPlayerId('');
        setGameState(null);
        setSelectedNumber(null);
        setSubmitted(false);
        setLobbyStep('room_selection');
        sessionStorage.removeItem('bs_room_code');
        sessionStorage.removeItem('bs_player_id');
    };

    const sumBots = (players = []) => players.filter(p => p.is_bot).length;
    const isCreator = gameState?.creator_id === playerId;

    // ─── LOBBY RENDER STEPS ──────────────────────────
    // Step 1: Username selection
    if (lobbyStep === 'name') {
        return (
            <div className="lobby-container animate-fade-in">
                <div className="glass lobby-card">
                    <span className="scale-icon" role="img" aria-label="balance scale">⚖️</span>
                    <h1 className="gradient-text lobby-title">Balance Scale</h1>
                    <p className="lobby-subtitle">Enter the Arena</p>
                    
                    <div style={{ margin: '2rem 0', textAlign: 'left' }}>
                        <label className="input-label" htmlFor="player-name-input">
                            Your Name:
                        </label>
                        <input
                            id="player-name-input"
                            type="text"
                            placeholder="Enter username..."
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value.slice(0, 15))}
                            className="text-input"
                            maxLength={15}
                        />
                    </div>
                    
                    <button
                        className="btn-primary"
                        onClick={() => {
                            if (playerName.trim()) {
                                sessionStorage.setItem('bs_player_name', playerName.trim());
                                setLobbyStep('room_selection');
                            } else {
                                alert("Please enter a name");
                            }
                        }}
                        style={{ width: '100%', padding: '1.5rem', fontSize: '1.05rem' }}
                    >
                        Continue
                    </button>
                </div>
            </div>
        );
    }

    // Step 2: Create or Join Room
    if (lobbyStep === 'room_selection') {
        return (
            <div className="lobby-container animate-fade-in">
                <div className="glass lobby-card">
                    <span className="scale-icon" role="img" aria-label="balance scale">⚖️</span>
                    <h1 className="gradient-text lobby-title">Balance Scale</h1>
                    <p className="lobby-subtitle">Welcome, <span className="highlight-text">{playerName}</span>!</p>
                    
                    <div className="action-buttons-stack" style={{ margin: '2rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <button
                            className="btn-primary"
                            onClick={createRoom}
                            style={{ width: '100%', padding: '1rem', fontSize: '1.05rem' }}
                        >
                            ➕ Create Game Room
                        </button>
                        
                        <div className="divider-container">
                            <span className="divider-text">OR JOIN ROOM</span>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <input
                                type="text"
                                placeholder="Enter 4-Digit Room Code..."
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                className="text-input"
                                style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.2em' }}
                                maxLength={4}
                            />
                            <button
                                className="btn-primary"
                                onClick={joinRoom}
                                disabled={joinCode.length !== 4}
                                style={{ width: '100%', padding: '1rem', fontSize: '1.05rem' }}
                            >
                                🚪 Join Room
                            </button>
                        </div>
                    </div>
                    
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setLobbyStep('name');
                        }}
                        className="lobby-back-link"
                    >
                        ← Change Name
                    </a>
                </div>
            </div>
        );
    }

    // Step 3: Waiting Lobby Room
    if (lobbyStep === 'waiting_room') {
        return (
            <div className="lobby-container animate-fade-in">
                <div className="glass lobby-card lobby-card-wide">
                    <span className="scale-icon" role="img" aria-label="balance scale">⚖️</span>
                    <h1 className="gradient-text lobby-title" style={{ fontSize: '2.3rem' }}>Waiting Room</h1>
                    <div className="room-code-tag">
                        Code: <span className="room-code-value">{roomCode}</span>
                    </div>
                    
                    <div className="lobby-lobby-info" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                        <h3 className="waiting-lobby-header">Joined Players ({gameState?.players.length}/10)</h3>
                        <div className="players-lobby-grid">
                            {gameState?.players.map(p => (
                                <div key={p.id} className={`player-lobby-card ${p.is_bot ? 'bot-card' : ''} ${p.id === playerId ? 'self-card' : ''}`}>
                                    <span className="player-lobby-avatar">
                                        {p.is_bot ? '🤖' : p.id === gameState.creator_id ? '👑' : '👤'}
                                    </span>
                                    <div className="player-lobby-detail">
                                        <span className="player-lobby-name">
                                            {p.name} {p.id === playerId && ' (You)'}
                                        </span>
                                        <span className="player-lobby-role">
                                            {p.is_bot ? `Bot (${p.archetype})` : p.id === gameState.creator_id ? 'Room Creator' : 'Player'}
                                        </span>
                                    </div>
                                    {isCreator && p.is_bot && (
                                        <button 
                                            className="btn-remove-lobby-bot" 
                                            onClick={() => removeBot(p.id)}
                                            title="Remove Bot"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {isCreator ? (
                        <div className="creator-lobby-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <button
                                className="btn-secondary"
                                onClick={addBot}
                                disabled={gameState?.players.length >= 10}
                                style={{ width: '100%', padding: '0.8rem' }}
                            >
                                🤖 Add Opponent Bot ({sumBots(gameState?.players)} active)
                            </button>
                            
                            <button
                                className="btn-primary"
                                onClick={startMultiplayerGame}
                                disabled={gameState?.players.length < 2}
                                style={{ width: '100%', padding: '1rem', fontSize: '1.05rem' }}
                            >
                                ⚔️ Start the Match
                            </button>
                        </div>
                    ) : (
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem', textAlign: 'center' }}>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', fontStyle: 'italic' }}>
                                ⏳ Waiting for creator <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{gameState?.players.find(p => p.id === gameState.creator_id)?.name}</span> to start the game...
                            </p>
                        </div>
                    )}
                    
                    <button
                        className="btn-primary"
                        onClick={handleLeave}
                        style={{ width: '100%', padding: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)' }}
                    >
                        🚪 Leave Room
                    </button>
                </div>
            </div>
        );
    }

    // ─── GAME SCREEN ──────────────────────────────────
    const playersToShow = gameState?.last_round_results ? gameState.last_round_results.results : (gameState?.players || []);
    const myPlayer = gameState?.players.find(p => p.id === playerId);
    const isMeEliminated = myPlayer?.is_eliminated;
    const aliveCount = playersToShow.filter(p => !p.is_eliminated).length;
    const roundResults = gameState?.status === 'round_results' || gameState?.status === 'game_over' ? gameState.last_round_results : null;

    return (
        <div className="main-layout animate-fade-in">
            {/* ─── LEFT: GAME AREA ─── */}
            <div className="game-area">
                <div className="game-header">
                    <h2 className="gradient-text game-title">
                        Balance Scale
                    </h2>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div className="room-badge-small">
                            Room {roomCode}
                        </div>
                        <div className="round-badge">
                            Round <span className="round-number">{gameState?.round}</span>
                        </div>
                    </div>
                </div>

                {/* 15-Second Timer Bar */}
                {gameState?.status === 'playing' && (
                    <div className="timer-bar-container">
                        <div 
                            className={`timer-bar-fill ${localTimeLeft < 5.0 ? 'timer-warning' : ''}`} 
                            style={{ width: `${(localTimeLeft / 15.0) * 100}%` }} 
                        />
                        <span className="timer-bar-text">⏱️ {localTimeLeft.toFixed(1)}s left</span>
                    </div>
                )}

                {isMeEliminated && !roundResults && (
                    <div className="glass eliminated-panel">
                        <h3 className="eliminated-title">☠️ You have been eliminated ({myPlayer.elimination_reason || 'Out'})</h3>
                        <p className="eliminated-subtitle">Watch the bots and other players fight for survival.</p>
                        <div className="eliminated-actions">
                            <button
                                id="leave-btn"
                                className="btn-primary"
                                onClick={handleLeave}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.12)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#ef4444',
                                    boxShadow: 'none'
                                }}
                            >
                                Leave Room
                            </button>
                        </div>
                    </div>
                )}

                {!isMeEliminated && (
                    <>
                        {submitted ? (
                            <div className="glass waiting-panel">
                                <h3 className="waiting-title">📬 Choice Submitted: <span style={{ color: 'var(--accent-light)', fontWeight: 800 }}>{selectedNumber}</span></h3>
                                <p className="waiting-subtitle">Waiting for other players to submit...</p>
                                <div className="waiting-spinner" />
                                <button
                                    className="btn-primary"
                                    onClick={handleLeave}
                                    style={{
                                        marginTop: '1.5rem',
                                        background: 'rgba(239, 68, 68, 0.08)',
                                        border: '1px solid rgba(239, 68, 68, 0.25)',
                                        color: '#ef4444',
                                        fontSize: '0.9rem',
                                        padding: '0.6rem 1.2rem',
                                        width: 'auto'
                                    }}
                                >
                                    🚪 Leave Game
                                </button>
                            </div>
                        ) : (
                            <TileGrid
                                selectedNumber={selectedNumber}
                                onSelect={(num) => submitChoice(num)}
                                disabled={gameState?.status !== 'playing'}
                                revealedNumbers={[]}
                                onRestart={handleLeave}
                                restartText="Leave"
                            />
                        )}
                    </>
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
                <PlayerStatus 
                    playerId={playerId}
                    players={playersToShow.map(p => {
                        // Check if player submitted in the current round
                        const activePlayer = gameState?.players.find(ap => ap.id === p.id);
                        const hasSubmitted = activePlayer && activePlayer.current_choice !== null;
                        return {
                            ...p,
                            name: p.is_eliminated 
                                ? p.name 
                                : `${p.name} ${hasSubmitted ? '✅' : '⏳'}`
                        };
                    })} 
                />
            </div>

            {/* ─── RESULTS OVERLAY ─── */}
            <ResultsPanel
                results={roundResults}
                onNext={nextMultiplayerRound}
                gameOver={gameState?.game_over}
                winner={gameState?.winner}
                playerId={playerId}
                isCreator={isCreator}
                onLeave={handleLeave}
            />
        </div>
    );
}

export default App;
