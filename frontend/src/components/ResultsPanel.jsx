import React from 'react';

const ResultsPanel = ({ results, onNext, gameOver, winner }) => {
    if (!results) return null;

    const { round, mean, sd, results: playerResults, eliminated_by_dupe } = results;

    return (
        <div className="results-overlay animate-fade-in">
            <div className="glass results-content">
                <h2 style={{
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    fontSize: '2.5rem',
                    background: 'linear-gradient(135deg, #fff 0%, #8b5cf6 50%, #3b82f6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    margin: '0 0 1.5rem 0',
                    lineHeight: 1.1,
                    letterSpacing: '-0.03em'
                }}>
                    {gameOver ? 'Game Over' : `Round ${round} Results`}
                </h2>

                <div className="results-scroll-area">
                    {gameOver && (
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '0.8rem', background: winner === 'No One' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', borderRadius: '0.5rem' }}>
                            <h3 style={{ color: winner === 'No One' ? '#ef4444' : '#10b981', margin: 0 }}>
                                {winner === 'No One' ? 'BINGO NO WINNER' : `Winner: ${winner}`}
                            </h3>
                        </div>
                    )}

                    {(() => {
                        // Logic to hide Stats if it was a 1v1 Duel
                        // Participants = Survivors + Eliminated_This_Round
                        const participants = playerResults.filter(p => !p.is_eliminated || p.elimination_round === round);
                        const isDuel = participants.length === 2;

                        if (isDuel) return null;

                        return (
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '0.75rem',
                                    padding: '1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
                                }}>
                                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Target (Mean)</div>
                                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', textShadow: '0 2px 10px rgba(255,255,255,0.1)' }}>{mean}</div>
                                </div>

                                <div style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '0.75rem',
                                    padding: '1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
                                }}>
                                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Spread (SD)</div>
                                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#c4b5fd', textShadow: '0 2px 10px rgba(139, 92, 246, 0.2)' }}>{sd}</div>
                                </div>
                            </div>
                        );
                    })()}
                    <div style={{ marginBottom: '1rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Player</th>
                                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Choice</th>
                                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Dist (SD)</th>
                                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Penalty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {playerResults.map(p => {
                                    // FILTER LOGIC:
                                    // Show player IF:
                                    // 1. Not eliminated
                                    // 2. Eliminated THIS round (elimination_round == current round)

                                    const justEliminated = p.elimination_round === round;
                                    const longDead = p.is_eliminated && !justEliminated;

                                    if (longDead) return null;

                                    const isDupeElim = eliminated_by_dupe && eliminated_by_dupe.includes(p.id);
                                    const penaltyText = p.round_penalty === 0 ? 'Safe' : p.round_penalty;

                                    return (
                                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '0.5rem', color: p.id === 'human' ? '#8b5cf6' : 'inherit' }}>
                                                {p.name} {p.is_eliminated && <span className="eliminated-tag">(Elim)</span>}
                                            </td>
                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                <span className="chosen-number">{p.current_choice ?? '-'}</span>
                                            </td>
                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                {isDupeElim ? '-' : `${p.round_distance.toFixed(1)} (${p.round_sd_units.toFixed(1)})`}
                                            </td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right', color: penaltyText === 'Safe' ? '#10b981' : '#ef4444' }}>
                                                {isDupeElim ? 'DUPLICATE' : penaltyText}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    {gameOver && (
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>WINNER</span>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{winner}</div>
                        </div>
                    )}

                    <button
                        className="btn-primary"
                        onClick={onNext}
                        style={{ width: '100%' }}
                    >
                        {gameOver ? 'Play Again' : 'Next Round'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultsPanel;
