import React from 'react';
import useGameStore, { GAME_PHASES } from '../store/gameStore';

const GameSetup = () => {
    const { phase, startGame } = useGameStore();

    if (phase !== GAME_PHASES.SETUP) return null;

    const [names, setNames] = React.useState([]);
    const [inputValue, setInputValue] = React.useState('');

    const addPlayer = () => {
        if (inputValue.trim()) {
            setNames([...names, inputValue.trim()]);
            setInputValue('');
        }
    };

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

                {/* Player List */}
                <div style={{ marginBottom: '20px', minHeight: '50px' }}>
                    {names.length === 0 ? (
                        <p style={{ color: '#888' }}>Add players to start...</p>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
                            {names.map((name, i) => (
                                <span key={i} style={{
                                    background: '#d4af37', color: 'black',
                                    padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold'
                                }}>
                                    {name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', justifyContent: 'center' }}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                        placeholder="Player Name"
                        style={{
                            padding: '10px',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid #d4af37',
                            color: 'white',
                            borderRadius: '5px',
                            outline: 'none'
                        }}
                    />
                    <button onClick={addPlayer} style={{
                        background: '#d4af37', border: 'none', borderRadius: '5px',
                        cursor: 'pointer', fontWeight: 'bold', padding: '0 15px'
                    }}>
                        +
                    </button>
                </div>

                {/* Start Button */}
                <button
                    onClick={() => names.length >= 2 && startGame(names)}
                    disabled={names.length < 2}
                    style={{
                        background: names.length >= 2 ? 'linear-gradient(45deg, #442a8b, #a73c9f)' : '#333',
                        border: '2px solid white',
                        color: names.length >= 2 ? 'white' : '#666',
                        padding: '10px 40px',
                        fontSize: '1.2em',
                        fontWeight: 'bold',
                        cursor: names.length >= 2 ? 'pointer' : 'not-allowed',
                        borderRadius: '30px',
                        fontFamily: 'Impact',
                        textTransform: 'uppercase',
                        opacity: names.length >= 2 ? 1 : 0.5
                    }}
                >
                    START GAME
                </button>
            </div>
        </div>
    );
};

export default GameSetup;
