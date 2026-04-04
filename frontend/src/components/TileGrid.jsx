import React from 'react';

const TileGrid = ({ selectedNumber, onSelect, disabled, revealedNumbers, onRestart }) => {
    const numbers = Array.from({ length: 101 }, (_, i) => i);

    return (
        <div className="glass tile-grid-container">
            <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: '#94a3b8' }}>
                Select a Number (0-100)
            </h3>
            <div className="tile-grid">
                {numbers.map((num) => {
                    const isSelected = selectedNumber === num;
                    // Check if this number was chosen by anyone in reveal phase
                    const isRevealed = revealedNumbers && revealedNumbers.includes(num);

                    return (
                        <button
                            key={num}
                            className={`tile ${isSelected ? 'selected' : ''}`}
                            onClick={() => onSelect(num)}
                            disabled={disabled}
                            style={isRevealed ? { borderColor: '#f59e0b', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' } : {}}
                        >
                            {num}
                        </button>
                    );
                })}

                {/* Restart Tile - Spans remaining 4 columns */}
                <button
                    className="tile"
                    onClick={onRestart}
                    style={{
                        gridColumn: 'span 4',
                        aspectRatio: 'unset', // Prevent it from trying to be a 4x4 square
                        height: '100%', // Match rule of other tiles in the row
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        display: 'flex',
                        flexDirection: 'row', // Horizontal layout for wide button
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        lineHeight: 1,
                        padding: '0'
                    }}
                >
                    <span style={{ fontSize: '1.2rem' }}>↺</span>
                    Restart
                </button>
            </div>
        </div>
    );
};

export default TileGrid;
