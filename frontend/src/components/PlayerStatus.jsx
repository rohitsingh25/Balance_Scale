import React from 'react';
import '../index.css';

const PlayerStatus = ({ players }) => {
    // Sort: Active (score desc) -> Eliminated
    const sortedPlayers = [...players].sort((a, b) => {
        if (a.is_eliminated && !b.is_eliminated) return 1;
        if (!a.is_eliminated && b.is_eliminated) return -1;
        return b.points - a.points;
    });

    return (
        <div className="player-list glass" style={{ padding: '1rem' }}>

            {sortedPlayers.map((p) => (
                <div
                    key={p.id}
                    className={`player-card ${p.id === 'human' ? 'human' : ''} ${p.is_eliminated ? 'eliminated' : ''}`}
                >
                    <div className="player-info">
                        <span className="player-name">{p.name} {p.id === 'human' ? '(You)' : ''}</span>
                        {p.current_choice !== null && p.id === 'human' && !p.is_eliminated && (
                            <span style={{ fontSize: '0.75rem', color: '#8b5cf6' }}>Selected: {p.current_choice}</span>
                        )}
                    </div>

                    {p.is_eliminated ? (
                        <span className="player-status-tag">ELIMINATED</span>
                    ) : (
                        <div className={`points ${p.points <= 3 ? 'critical' : p.points <= 6 ? 'low' : ''}`}>
                            {p.points}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default PlayerStatus;
