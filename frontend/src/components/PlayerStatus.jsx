import React from 'react';

const PlayerStatus = ({ players }) => {
    // Sort: Active (score desc) → Eliminated (by round desc)
    const sortedPlayers = [...players].sort((a, b) => {
        if (a.is_eliminated && !b.is_eliminated) return 1;
        if (!a.is_eliminated && b.is_eliminated) return -1;
        if (!a.is_eliminated && !b.is_eliminated) return b.points - a.points;
        // Both eliminated — most recent first
        return (b.elimination_round || 0) - (a.elimination_round || 0);
    });

    let rank = 0;

    return (
        <div className="player-list glass">
            {sortedPlayers.map((p) => {
                if (!p.is_eliminated) rank++;

                const pointsClass = `points ${
                    p.points <= 2 ? 'critical' : p.points <= 5 ? 'low' : ''
                }`;

                const rankClass = `rank-badge ${
                    !p.is_eliminated && rank <= 3 ? `rank-${rank}` : ''
                }`;

                return (
                    <div
                        key={p.id}
                        id={`player-${p.id}`}
                        className={`player-card ${p.id === 'human' ? 'human' : ''} ${
                            p.is_eliminated ? 'eliminated' : ''
                        }`}
                    >
                        <div className={rankClass}>
                            {p.is_eliminated ? '✕' : rank}
                        </div>

                        <div className="player-info" style={{ flex: 1 }}>
                            <span className="player-name">
                                {p.name}
                                {p.id === 'human' && <span style={{ color: 'var(--accent-light)', marginLeft: '0.3rem' }}>(You)</span>}
                            </span>
                            {p.archetype && !p.is_eliminated && (
                                <span className="archetype-tag">{p.archetype}</span>
                            )}
                            {p.current_choice !== null && p.id === 'human' && !p.is_eliminated && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }}>
                                    Chose: {p.current_choice}
                                </span>
                            )}
                        </div>

                        {p.is_eliminated ? (
                            <span className="player-status-tag">ELIMINATED</span>
                        ) : (
                            <div className={pointsClass}>
                                {p.points}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default PlayerStatus;
