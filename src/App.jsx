import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Table from './components/Table'
import './index.css'

function App() {
    return (
        <div id="canvas-container">
            <Canvas camera={{ position: [0, 5, 2], fov: 50 }}>
                <color attach="background" args={['#1a1a1a']} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <Suspense fallback={null}>
                    {/* Scene content */}
                    <Table />
                </Suspense>
            </Canvas>
            <div className="ui-layer">
                {/* UI overlay will go here */}
                <h1 style={{ position: 'absolute', top: 20, left: 20, color: 'white' }}>JoJo Card Game</h1>
            </div>
        </div>
    )
}

export default App
