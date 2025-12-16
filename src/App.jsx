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
            <div className="ui-layer">
                <GameSetup />
                <CardInfo />
                {/* Remove old simple header, use setup screen instead */}
            </div>
        </div>
    )
}

export default App
