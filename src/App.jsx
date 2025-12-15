import { Canvas } from '@react-three/fiber'
import { Suspense, Component } from 'react'
import Table from './components/Table'
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
            <ErrorBoundary>
                <Canvas camera={{ position: [0, 5, 2], fov: 50 }}>
                    <color attach="background" args={['#1a1a1a']} />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} />
                    <Suspense fallback={null}>
                        {/* Scene content */}
                        <Table />
                    </Suspense>
                </Canvas>
            </ErrorBoundary>
            <div className="ui-layer">
                {/* UI overlay will go here */}
                <h1 style={{ position: 'absolute', top: 20, left: 20, color: 'white' }}>JoJo Card Game</h1>
            </div>
        </div>
    )
}

export default App
