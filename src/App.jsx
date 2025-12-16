import { Canvas } from '@react-three/fiber'
import { Suspense, Component } from 'react'
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
    const { players, inspectingPlayer, setInspectingPlayer } = useGameStore();

    if (inspectingPlayer === null || !players[inspectingPlayer]) return null;

    const player = players[inspectingPlayer];
    const cards = player.discardPile;

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
        }} onClick={() => setInspectingPlayer(null)}>

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

            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '20px',
                maxWidth: '1000px',
                width: '100%'
            }}>
                {cards.length === 0 ? (
                    <p style={{ color: '#666', fontSize: '1.2em' }}>No cards discard yet.</p>
                ) : (
                    cards.map((card, i) => (
                        <div key={i} style={{
                            width: '150px',
                            height: '225px',
                            perspective: '1000px',
                            cursor: 'pointer',
                            transition: 'transform 0.2s'
                        }} className="card-inspector-item">
                            <img
                                src={card.texture}
                                alt={card.name}
                                style={{ width: '100%', height: '100%', borderRadius: '10px', boxShadow: '0 5px 15px black' }}
                            />
                        </div>
                    ))
                )}
            </div>

            <p style={{ marginTop: 'auto', color: '#888', paddingTop: '20px' }}>(Tap anywhere to close)</p>
        </div>
    );
};

export default App
