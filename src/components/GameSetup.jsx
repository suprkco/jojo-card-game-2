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
            background: '#111',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
            overflow: 'hidden'
        }}>
            {/* Scrolling Background */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, width: '200%', height: '100%',
                display: 'flex',
                flexWrap: 'wrap',
                opacity: 0.2,
                transform: 'rotate(-15deg) scale(1.5)',
                zIndex: -1,
                pointerEvents: 'none'
            }}>
                {/* Just a grid of placeholders or textures if we had a list */}
                {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} style={{
                        width: '100px', height: '150px',
                        margin: '10px',
                        background: i % 2 === 0 ? '#442a8b' : '#a73c9f',
                        borderRadius: '5px'
                    }}></div>
                ))}
            </div>

            <div style={{
                textAlign: 'center',
                zIndex: 2,
                background: 'rgba(0,0,0,0.6)',
                padding: '40px',
                borderRadius: '20px',
                backdropFilter: 'blur(10px)'
            }}>
                <h1 style={{
                    color: '#d4af37',
                    fontSize: '3em',
                    fontFamily: 'Impact',
                    marginBottom: '20px',
                    letterSpacing: '3px'
                }}>
                    JOJO CARD
                </h1>

                <p style={{ color: '#ccc', marginBottom: '30px', fontFamily: 'Arial' }}>Select Players</p>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                    {[2, 3, 4].map(num => (
                        <button key={num} onClick={() => startGame(num)} style={{
                            background: 'transparent',
                            border: '2px solid #d4af37',
                            color: '#d4af37',
                            width: '60px',
                            height: '60px',
                            fontSize: '1.5em',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            borderRadius: '50%',
                            transition: 'all 0.2s'
                        }}>
                            {num}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GameSetup;
