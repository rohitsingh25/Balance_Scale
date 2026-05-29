import React from 'react';

const TileGrid = ({ selectedNumber, onSelect, disabled, revealedNumbers, onRestart }) => {
    const numbers = Array.from({ length: 101 }, (_, i) => i);

    return (
        <div className="glass tile-grid-container">
            <h3 className="tile-grid-label">
                Select a Number (0–100)
            </h3>
            <div className="tile-grid">
                {numbers.map((num) => {
                    const isSelected = selectedNumber === num;
                    const isRevealed = revealedNumbers && revealedNumbers.includes(num);

                    let className = 'tile';
                    if (isSelected) className += ' selected';
                    if (isRevealed && !isSelected) className += ' revealed';

                    return (
                        <button
                            key={num}
                            id={`tile-${num}`}
                            className={className}
                            onClick={() => onSelect(num)}
                            disabled={disabled}
                        >
                            {num}
                        </button>
                    );
                })}

                {/* Restart tile spans the remaining columns */}
                <button
                    id="tile-restart"
                    className="tile restart-tile"
                    onClick={onRestart}
                >
                    <span style={{ fontSize: '1.1rem' }}>↺</span>
                    Restart
                </button>
            </div>
        </div>
    );
};

export default TileGrid;
