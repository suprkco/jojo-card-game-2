import { Canvas } from '@react-three/fiber'
import React, { Suspense, Component } from 'react'
import Table from './components/Table'
import CameraController from './components/CameraController'
import GameSetup from './components/GameSetup'
import CardInfo from './components/CardInfo'
import './index.css'

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ color: 'red', padding: '20px', zIndex: 9999, position: 'relative' }}>
                    <h1>Something went wrong.</h1>
                    <pre>{this.state.error?.toString()}</pre>
                </div>
            );
        }

        return this.props.children;
    }
}

function App() {
    return (
        <div id="canvas-container">
            {/* 3D Scene */}
            <ErrorBoundary>
                <Canvas camera={{ position: [0, 8, 6], fov: 60 }}>
                    <color attach="background" args={['#1a1a1a']} />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} />
                    <Suspense fallback={null}>
                        <CameraController />
                        <Table />
                    </Suspense>
                </Canvas>
            </ErrorBoundary>

            {/* UI Overlays */}
            <GameSetup />
            <CardInfo />
            <PileInspectorOverlay />
        </div>
    )
}

import useGameStore from './store/gameStore';

const PileInspectorOverlay = () => {
    const { players, inspectingPlayer, setInspectingPlayer, currentPlayerIndex, moveCard } = useGameStore();
    const [selectedMilagro, setSelectedMilagro] = React.useState(null);

    if (inspectingPlayer === null || !players[inspectingPlayer]) return null;

    const player = players[inspectingPlayer];
    const cards = player.discardPile;
    const isMyPile = inspectingPlayer === currentPlayerIndex;

    const handleCardClick = (e, card) => {
        e.stopPropagation();
        // Only allow moving Milagro Man from OWN pile
        if (isMyPile && card.name.toLowerCase().includes("milagro")) {
            setSelectedMilagro(card);
        }
    };

    const handleTransfer = (targetIndex) => {
        if (selectedMilagro) {
            moveCard(selectedMilagro.id, inspectingPlayer, targetIndex);
            setSelectedMilagro(null);
            setInspectingPlayer(null); // Close inspector after move
        }
    };

    return (
        <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.9)',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px',
            boxSizing: 'border-box',
            overflowY: 'auto'
        }} onClick={() => {
            if (selectedMilagro) setSelectedMilagro(null);
            else setInspectingPlayer(null);
        }}>

            <h2 style={{
                color: '#d4af37',
                fontFamily: 'Impact',
                fontSize: '2em',
                marginBottom: '30px',
                textTransform: 'uppercase',
                letterSpacing: '2px'
            }}>
                {player.name}'s Discard Pile
            </h2>

            {/* Milagro Selection Modal */}
            {selectedMilagro && (
                <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    background: '#222', border: '2px solid #d4af37', padding: '20px',
                    zIndex: 300, borderRadius: '10px', textAlign: 'center'
                }} onClick={(e) => e.stopPropagation()}>
                    <h3 style={{ color: 'white' }}>Give {selectedMilagro.name} to:</h3>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        {players.map((p, i) => (
                            i !== inspectingPlayer && (
                                <button key={i} onClick={() => handleTransfer(i)} style={{
                                    padding: '10px', cursor: 'pointer', background: '#444', color: 'white', border: '1px solid #666'
                                }}>
                                    {p.name}
                                </button>
                            )
                        ))}
                    </div>
                    <button onClick={() => setSelectedMilagro(null)} style={{ marginTop: '15px', background: 'transparent', color: '#888', border: 'none', cursor: 'pointer' }}>
                        Cancel
                    </button>
                </div>
            )}

            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '20px',
                maxWidth: '1000px',
                width: '100%'
            }}>
                {cards.length === 0 ? (
                    <p style={{ color: '#666', fontSize: '1.2em' }}>No cards discarded yet.</p>
                ) : (
                    cards.map((card, i) => (
                        <div key={i} style={{
                            width: '150px',
                            height: '225px',
                            perspective: '1000px',
                            cursor: isMyPile && card.name.toLowerCase().includes("milagro") ? 'pointer' : 'default',
                            transition: 'transform 0.2s',
                            position: 'relative'
                        }} className="card-inspector-item" onClick={(e) => handleCardClick(e, card)}>
                            <img
                                src={card.hidden ? "/textures/verso/Back Artwork.png" : card.texture}
                                alt={card.name}
                                style={{
                                    width: '100%', height: '100%', borderRadius: '10px', boxShadow: '0 5px 15px black',
                                    border: selectedMilagro?.id === card.id ? '3px solid #d4af37' : 'none'
                                }}
                            />
                            {isMyPile && card.name.toLowerCase().includes("milagro") && (
                                <div style={{
                                    position: 'absolute', bottom: '5px', left: '50%', transform: 'translateX(-50%)',
                                    background: '#d4af37', color: 'black', padding: '2px 8px', borderRadius: '4px',
                                    fontSize: '0.8em', fontWeight: 'bold'
                                }}>
                                    GIVE
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <p style={{ marginTop: 'auto', color: '#888', paddingTop: '20px' }}>(Tap background to close)</p>
        </div>
    );
};

export default App
