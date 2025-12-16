import React from 'react';
import useGameStore, { GAME_PHASES } from '../store/gameStore';

const GameSetup = () => {
    const { phase, startGame } = useGameStore();

    if (phase !== GAME_PHASES.SETUP) return null;

    const btnStyle = {
        background: 'linear-gradient(45deg, #442a8b, #a73c9f)',
        border: '3px solid white',
        color: 'white',
        padding: '15px 30px',
        margin: '10px',
        fontSize: '1.5em',
        fontWeight: 'bold',
        cursor: 'pointer',
        borderRadius: '50px',
        fontFamily: 'Impact, sans-serif',
        textTransform: 'uppercase',
        transition: 'transform 0.1s'
    };

    return (
        <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(20,20,20,0.95)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100
        }}>
            <h1 style={{
                color: '#d4af37',
                fontSize: '4em',
                fontFamily: 'Impact',
                marginBottom: '50px',
                textShadow: '0 0 20px rgba(212, 175, 55, 0.5)'
            }}>
                JOJO CARD GAME
            </h1>

            <h2 style={{ color: 'white', marginBottom: '30px' }}>SELECT PLAYERS</h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button style={btnStyle} onClick={() => startGame(2)}>2 PLAYERS</button>
                <button style={btnStyle} onClick={() => startGame(3)}>3 PLAYERS</button>
                <button style={btnStyle} onClick={() => startGame(4)}>4 PLAYERS</button>
            </div>
        </div>
    );
};

export default GameSetup;
