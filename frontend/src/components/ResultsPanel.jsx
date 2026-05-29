import React from 'react';

const ResultsPanel = ({ results, onNext, gameOver, winner, playerId, isCreator, onLeave }) => {
    if (!results) return null;

    const { round, mean, sd, results: playerResults, eliminated_by_dupe } = results;

    // Determine if it was a 1v1 duel (only 2 participants this round)
    const participants = playerResults.filter(
        p => !p.is_eliminated || p.elimination_round === round
    );
    const isDuel = participants.length === 2;

    return (
        <div className="results-overlay animate-fade-in">
            <div className="glass results-content">
                <h2
                    className="gradient-text"
                    style={{
                        textAlign: 'center',
                        fontSize: '2.2rem',
                        margin: '0 0 1.5rem 0',
                        lineHeight: 1.1,
                        letterSpacing: '-0.03em',
                        fontWeight: 800
                    }}
                >
                    {gameOver ? 'Game Over' : `Round ${round} Results`}
                </h2>

                <div className="results-scroll-area">
                    {/* Winner banner */}
                    {gameOver && (
                        <div className={`winner-banner ${winner === 'No One' ? 'defeat' : 'victory'}`}>
                            <h3 className="winner-name" style={{
                                color: winner === 'No One' ? 'var(--danger)' : 'var(--success)'
                            }}>
                                {winner === 'No One' ? '💀 No Winner' : `🏆 Winner: ${winner}`}
                            </h3>
                        </div>
                    )}

                    {/* Stats cards (hidden in 1v1 duel) */}
                    {!isDuel && (
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div className="stat-card">
                                <div className="stat-label">Target (Mean)</div>
                                <div className="stat-value">{mean}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Spread (SD)</div>
                                <div className="stat-value accent">{sd}</div>
                            </div>
                        </div>
                    )}

                    {isDuel && (
                        <div style={{
                            textAlign: 'center',
                            padding: '0.8rem',
                            marginBottom: '1rem',
                            background: 'rgba(139, 92, 246, 0.06)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(139, 92, 246, 0.15)',
                            color: 'var(--accent-light)',
                            fontSize: '0.85rem',
                            fontWeight: 600
                        }}>
                            ⚔️ 1v1 Duel — Higher number wins (0 beats 100)
                        </div>
                    )}

                    {/* Results table */}
                    <div style={{ marginBottom: '0.5rem' }}>
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left' }}>Player</th>
                                    <th style={{ textAlign: 'center' }}>Choice</th>
                                    {!isDuel && <th style={{ textAlign: 'center' }}>Dist (SD)</th>}
                                    <th style={{ textAlign: 'right' }}>Penalty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {playerResults.map(p => {
                                    const justEliminated = p.elimination_round === round;
                                    const longDead = p.is_eliminated && !justEliminated;

                                    if (longDead) return null;

                                    const isDupeElim = eliminated_by_dupe && eliminated_by_dupe.includes(p.id);
                                    const penaltyText = p.round_penalty === 0 ? 'Safe' : p.round_penalty;
                                    const isMe = p.id === playerId;

                                    return (
                                        <tr key={p.id}>
                                            <td style={{
                                                textAlign: 'left',
                                                color: isMe ? 'var(--accent-light)' : 'inherit',
                                                fontWeight: isMe ? 700 : 400
                                            }}>
                                                {p.name} {isMe && '(You)'}
                                                {p.is_eliminated && (
                                                    <span className="eliminated-tag" style={{ marginLeft: '0.4rem' }}>
                                                        {p.elimination_reason === 'Timeout' ? '⏱️ Timeout' : '(Elim)'}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="chosen-number">
                                                    {p.current_choice === -1 ? '⏱️' : p.current_choice === -2 ? '🚪' : p.current_choice ?? '—'}
                                                </span>
                                            </td>
                                            {!isDuel && (
                                                <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                                    {isDupeElim || p.current_choice < 0
                                                        ? '—'
                                                        : `${p.round_distance.toFixed(1)} (${p.round_sd_units.toFixed(1)})`
                                                    }
                                                </td>
                                            )}
                                            <td style={{
                                                textAlign: 'right',
                                                fontWeight: 700,
                                                color: isDupeElim || p.current_choice < 0
                                                    ? 'var(--danger)'
                                                    : penaltyText === 'Safe'
                                                        ? 'var(--success)'
                                                        : 'var(--danger)'
                                            }}>
                                                {isDupeElim ? 'DUPE' : p.current_choice === -1 ? 'TIMEOUT' : p.current_choice === -2 ? 'LEFT' : penaltyText}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                    {isCreator ? (
                        <>
                            {!gameOver ? (
                                <button
                                    id="next-round-btn"
                                    className="btn-primary"
                                    onClick={onNext}
                                    style={{ width: '100%', fontSize: '1rem', padding: '0.9rem' }}
                                >
                                    Next Round →
                                </button>
                            ) : (
                                <button
                                    id="leave-game-btn"
                                    className="btn-primary"
                                    onClick={onLeave}
                                    style={{ width: '100%', fontSize: '1rem', padding: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)' }}
                                >
                                    🚪 Return to Lobby
                                </button>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', width: '100%' }}>
                            {!gameOver ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', margin: '0.5rem 0' }}>
                                    ⏳ Waiting for room creator to start next round...
                                </p>
                            ) : (
                                <button
                                    id="leave-game-btn"
                                    className="btn-primary"
                                    onClick={onLeave}
                                    style={{ width: '100%', fontSize: '1rem', padding: '0.9rem' }}
                                >
                                    🚪 Leave Room
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResultsPanel;
