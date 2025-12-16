import React from 'react';
import useGameStore, { GAME_PHASES } from '../store/gameStore';

const CardInfo = () => {
    const { currentCard, phase } = useGameStore();

    if (phase !== GAME_PHASES.READING || !currentCard) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: '15%', // Raised to avoid bottom cut-off
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.6)', // More transparency for better visibility
            border: '1px solid #d4af37',
            padding: '15px',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center',
            width: '85%',
            maxWidth: '350px',
            pointerEvents: 'auto' // Allow clicks on buttons
        }}>
            <h2 style={{
                margin: '0 0 5px 0',
                fontFamily: 'Impact, sans-serif',
                letterSpacing: '1px',
                color: '#d4af37',
                textTransform: 'uppercase',
                fontSize: '1.4em'
            }}>
                {currentCard.name}
            </h2>
            {currentCard.standName && (
                <h4 style={{ margin: '0 0 8px 0', color: '#a0a0a0', fontSize: '0.9em' }}>
                    Stand: {currentCard.standName}
                </h4>
            )}
            <p style={{ margin: 0, fontSize: '0.95em', lineHeight: '1.3' }}>
                {currentCard.description}
            </p>
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center', pointerEvents: 'auto' }}>
                <button
                    onClick={() => useGameStore.getState().validateCard(false)}
                    style={{
                        padding: '8px 16px',
                        background: '#d4af37',
                        color: 'black',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    Visible 👁️
                </button>
                <button
                    onClick={() => useGameStore.getState().validateCard(true)}
                    style={{
                        padding: '8px 16px',
                        background: '#444',
                        color: 'white',
                        border: '1px solid #666',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    Cachée 🕵️
                </button>
            </div>
        </div>
    );
};

export default CardInfo;
