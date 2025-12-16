import React from 'react';
import useGameStore, { GAME_PHASES } from '../store/gameStore';

const CardInfo = () => {
    const { currentCard, phase } = useGameStore();

    if (phase !== GAME_PHASES.READING || !currentCard) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.85)',
            border: '2px solid #d4af37',
            padding: '20px',
            borderRadius: '10px',
            color: 'white',
            textAlign: 'center',
            maxWidth: '80%',
            backdropFilter: 'blur(5px)',
            pointerEvents: 'none' // Let clicks pass through to validating tap
        }}>
            <h2 style={{
                margin: '0 0 10px 0',
                fontFamily: 'Impact, sans-serif',
                letterSpacing: '2px',
                color: '#d4af37',
                textTransform: 'uppercase'
            }}>
                {currentCard.name}
            </h2>
            {currentCard.standName && (
                <h4 style={{ margin: '0 0 10px 0', color: '#a0a0a0' }}>
                    Stand: {currentCard.standName}
                </h4>
            )}
            <p style={{ margin: 0, fontSize: '1.1em', lineHeight: '1.4' }}>
                {currentCard.description}
            </p>
            <div style={{ marginTop: '10px', fontSize: '0.8em', color: '#666' }}>
                (Tap text or card to continue)
            </div>
        </div>
    );
};

export default CardInfo;
