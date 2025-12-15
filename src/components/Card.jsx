import React, { useRef, useMemo, useState } from 'react';
import { useFrame, extend, useLoader } from '@react-three/fiber';
// Wait, user said "Interdiction d'utiliser @react-three/drei (trop lourd, on code nos propres matériaux)."
// So I must implement shaderMaterial manually or use Three.ShaderMaterial directly.

import * as THREE from 'three';
import vertexShader from '../shaders/CardVertexShader.glsl?raw';
import fragmentShader from '../shaders/CardFragmentShader.glsl?raw';

// Manual ShaderMaterial implementation to avoid drei dependency for this core part
class CardMaterialImpl extends THREE.ShaderMaterial {
    constructor() {
        super({
            uniforms: {
                uTime: { value: 0 },
                uTexture: { value: null },
                uRandom: { value: 0 },
                uFoilIntensity: { value: 0.0 }
            },
            vertexShader,
            fragmentShader,
            side: THREE.DoubleSide
        });
    }

    get uTime() { return this.uniforms.uTime.value; }
    set uTime(v) { this.uniforms.uTime.value = v; }

    get uTexture() { return this.uniforms.uTexture.value; }
    set uTexture(v) { this.uniforms.uTexture.value = v; }

    get uRandom() { return this.uniforms.uRandom.value; }
    set uRandom(v) { this.uniforms.uRandom.value = v; }

    get uFoilIntensity() { return this.uniforms.uFoilIntensity.value; }
    set uFoilIntensity(v) { this.uniforms.uFoilIntensity.value = v; }
}

extend({ CardMaterialImpl });

const Card = ({ texturePath, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, isFoil = false, active = false, onClick, seed }) => {
    const mesh = useRef();
    const material = useRef();

    // Load texture
    const texture = useLoader(THREE.TextureLoader, texturePath);

    // Random offset for this instance (or use provided seed for sync)
    const randomOffset = useMemo(() => seed !== undefined ? seed : Math.random() * 100, [seed]);

    useFrame((state, delta) => {
        if (material.current) {
            material.current.uniforms.uTime.value += delta;

            // If active (hovered or being viewed), maybe increase breathing?
            // For now, steady breathing.
        }
    });

    return (
        <mesh
            ref={mesh}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={onClick}
        >
            <planeGeometry args={[2, 3, 32, 32]} /> {/* High segment count for vertex shader deformation */}
            <cardMaterialImpl
                ref={material}
                uTexture={texture}
                uRandom={randomOffset}
                uFoilIntensity={isFoil || active ? 1.0 : 0.0}
            />
        </mesh>
    );
};

export default Card;
