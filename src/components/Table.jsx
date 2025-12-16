import React, { useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { useThree, useLoader, useFrame } from '@react-three/fiber';
import useGameStore from '../store/gameStore';
import Card from './Card';
import gsap from 'gsap';
import * as THREE from 'three';

// Player Position Utilities
const TABLE_RADIUS = 2.5; // Tighter circle for better visibility
const getPlayerPos = (index, total) => {
    // Index 0 = Bottom (Player), 1 = Left, 2 = Top, 3 = Right (Clockwise)
    // Angle 0 is Right. Angle PI/2 is Bottom.
    // Start at PI/2, add index * (2PI/total) ?
    // 0 -> PI/2 (Bottom)
    // 1 -> PI/2 + PI/2 = PI (Left) -- Wait, PI is Left? Cos(PI)=-1. Yes.
    // 2 -> 3PI/2 (Top)
    // 3 -> 2PI (Right)
    const angle = Math.PI / 2 + (index * (Math.PI * 2) / total);
    return [Math.cos(angle) * TABLE_RADIUS, 0, Math.sin(angle) * TABLE_RADIUS];
};

const Table = () => {
    const {
        deck, phase, currentCard,
        drawCard, finishDrawAnimation, validateCard, finishDiscardAnimation,
        players, currentPlayerIndex, choices, chooseCard,
        inspectingPlayer, setInspectingPlayer
    } = useGameStore();

    // Calculate reading rotation to face camera at [0, 8, 6]
    // Card at [0, 4, 0]. Vector to Cam: [0, 4, 6].
    // Pitch (X-axis) needs to be negative to look "up" at the camera
    const readingRotation = useMemo(() => [-Math.atan2(4, 6), 0, 0], []);

    // Get position of current player to send card to
    const targetDiscardPos = useMemo(() => {
        if (!players.length) return [0, 0, 2.5];
        const pos = getPlayerPos(currentPlayerIndex, players.length);
        // Discard pile is at 0.7 radius
        return [pos[0] * 0.7, 0, pos[2] * 0.7];
    }, [currentPlayerIndex, players.length]);

    return (
        <group>
            {/* Table Surface / Mat - Visual Grounding */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
                <circleGeometry args={[5, 64]} />
                <meshStandardMaterial color="#222" roughness={0.8} />
            </mesh>
            <gridHelper args={[10, 10, "#444", "#222"]} position={[0, -0.04, 0]} />

            {/* The Deck (Center) */}
            <group position={[0, 0, 0]}>
                <Card
                    texturePath="/textures/verso/Back Artwork.png"
                    position={[0, 0, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    scale={1}
                    active={false}
                    onClick={() => {
                        if (phase === 'IDLE') drawCard();
                    }}
                />
                {/* Visual Stack Thickness */}
                {deck.length > 0 && Array.from({ length: Math.min(deck.length, 5) }).map((_, i) => (
                    <mesh key={i} position={[0, -0.02 * (i + 1), 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[2, 3]} />
                        <meshBasicMaterial color="#0a0a0a" />
                    </mesh>
                ))}
            </group>

            {/* Pile Inspector is now handled in App.jsx via HTML overlay */}

            {/* Players & Discards */}
            {players.map((player, index) => {
                const pos = getPlayerPos(index, players.length);
                const isCurrent = index === currentPlayerIndex;

                return (
                    <group key={player.id} position={pos} lookAt={new THREE.Vector3(0, 0, 0)}>
                        {/* Avatar Billboard */}
                        <mesh position={[0, 1.5, 0]} rotation={[0, Math.PI, 0]}> {/* Face center */}
                            <planeGeometry args={[1.2, 1.2]} />
                            <meshBasicMaterial
                                map={useLoader(THREE.TextureLoader, player.avatar)}
                                transparent
                                opacity={isCurrent ? 1 : 0.6}
                                color={isCurrent ? "white" : "#888"}
                            />
                            {isCurrent && (
                                <lineSegments>
                                    <edgesGeometry args={[new THREE.PlaneGeometry(1.2, 1.2)]} />
                                    <lineBasicMaterial color="#ffd700" linewidth={2} />
                                </lineSegments>
                            )}
                        </mesh>

                        {/* Discard Slot Marker (Clickable) */}
                        <mesh
                            position={[0, 0.01, 1.5]}
                            rotation={[-Math.PI / 2, 0, 0]}
                            onClick={(e) => {
                                e.stopPropagation();
                                setInspectingPlayer(index);
                            }}
                        >
                            <planeGeometry args={[1.1, 1.6]} />
                            <meshBasicMaterial color="white" opacity={0.1} transparent side={THREE.DoubleSide} />
                            <lineSegments>
                                <edgesGeometry args={[new THREE.PlaneGeometry(1.1, 1.6)]} />
                                <lineBasicMaterial color={isCurrent ? "#ffd700" : "#444"} linewidth={1} />
                            </lineSegments>
                        </mesh>

                        {/* Player's Discard Pile (Top Card) */}
                        {player.discardPile.length > 0 && (
                            <Card
                                key={player.discardPile[0].id}
                                texturePath={player.discardPile[0].texture}
                                position={[0, 0.1, 1.5]}
                                rotation={[-Math.PI / 2, 0, Math.random() * 0.1 - 0.05]}
                                scale={0.8}
                                active={false}
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent drawing if clicking pile
                                    setInspectingPlayer(index);
                                }}
                            />
                        )}
                    </group>
                );
            })}

            {/* Active Moving Card */}
            {currentCard && (
                <AnimatedCard
                    key={currentCard.id}
                    card={currentCard}
                    phase={phase}
                    targetPos={targetDiscardPos}
                    readingRotation={readingRotation}
                    onDrawComplete={finishDrawAnimation}
                    onDiscardComplete={finishDiscardAnimation}
                    onValidate={validateCard}
                />
            )}

            {/* Choices for La Flèche */}
            {choices.length > 0 && phase === 'CHOOSING_KEEP' && (
                <Choices
                    cards={choices}
                    onChoose={chooseCard}
                />
            )}
        </group>
    );
};

// Simple Overlay for Pile Inspection
const PileInspector = ({ cards, onClose, playerName }) => {
    // Show grid of cards in 3D space overlay
    // Or just a 2D HTML overlay? 2D is easier for scrolling. But user wants 3D vibe.
    // Let's stick to 2D HTML overlay for clarity as requested "consult pile".
    return (
        <group>
            {/* Dim background */}
            <mesh position={[0, 2, 0]} onClick={onClose}>
                <planeGeometry args={[20, 20]} />
                <meshBasicMaterial color="black" transparent opacity={0.8} />
            </mesh>

            {/* Title removed to avoid external dependency */}
            {/* <Text position={[0, 4, 0]} fontSize={0.5} color="#d4af37" anchorX="center">
                 {playerName}'s Discard Pile
            </Text> */}

            {/* Grid of Cards (Visual Only) */}
            <group position={[-3, 3, 0]}>
                {cards.map((card, i) => {
                    const row = Math.floor(i / 5);
                    const col = i % 5;
                    return (
                        <Card
                            key={i}
                            texturePath={card.texture}
                            position={[col * 1.5, -row * 2, 0]}
                            scale={1}
                            active={true} // High res
                            rotation={[0, 0, 0]}
                        />
                    )
                })}
            </group>
        </group>
    );
};

// Text helper removed to avoid dependency bloat
// import { Text } from '@react-three/drei';

const Choices = ({ cards, onChoose }) => {
    return (
        <group position={[0, 2, 3]} rotation={[-0.5, 0, 0]}>
            {cards.map((card, index) => (
                <Card
                    key={card.id}
                    texturePath={card.texture}
                    position={[index === 0 ? -1.5 : 1.5, 0, 0]}
                    rotation={[0, 0, 0]}
                    scale={1.2}
                    active={true}
                    onClick={() => onChoose(card)}
                    direction={1.0}
                />
            ))}
        </group>
    );
};

// Animated Card Logic 
const AnimatedCard = ({ card, phase, targetPos, readingRotation, onDrawComplete, onDiscardComplete, onValidate }) => {
    const groupRef = useRef();
    const uniqueSeed = useMemo(() => Math.random() * 1000, []);

    // Dynamic Tilt Effect
    useThree((state) => {
        // We use useFrame inside useThree or just import useFrame?
        // Wait, useThree is a hook getting context. useFrame is the loop hook.
        // It's safer to use useFrame from the import. 
    });

    useLoader(THREE.TextureLoader, card.texture); // Preload

    // Tilt Logic
    const { pointer } = useThree();

    // Animate Tilt
    useFrame((state, delta) => {
        if (phase === 'READING' && groupRef.current) {
            // Softly interpolate rotation towards pointer direction
            // Base rotation: readingRotation
            // Add tilt: pointer.x * factor

            const targetRotX = readingRotation[0] - (state.pointer.y * 0.2); // Look up/down
            const targetRotY = readingRotation[1] + (state.pointer.x * 0.2); // Look left/right

            // Smooth damping
            // We can't use dampE for pure values easily, manual lerp is fine
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, delta * 5);
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 5);
        }
    });

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // Kill active tweens
            gsap.killTweensOf(groupRef.current);
            gsap.killTweensOf(groupRef.current.position);
            gsap.killTweensOf(groupRef.current.rotation);
            gsap.killTweensOf(groupRef.current.scale);

            if (phase === 'DRAWING') {
                gsap.set(groupRef.current.position, { x: 0, y: 0, z: 0 });
                gsap.set(groupRef.current.rotation, { x: -Math.PI / 2, y: 0, z: Math.PI });
                gsap.set(groupRef.current.scale, { x: 0.1, y: 0.1, z: 0.1 });

                const tl = gsap.timeline({ onComplete: onDrawComplete });

                tl.to(groupRef.current.position, {
                    y: 0.9, // Fixed to 0.9
                    z: 0,
                    duration: 0.4,
                    ease: "back.out(1.4)"
                });
                tl.to(groupRef.current.scale, {
                    x: 2, y: 2, z: 2,
                    duration: 0.3
                }, "<");
                // For rotation, we animate to BASE rotation, useFrame handles tilt
                tl.to(groupRef.current.rotation, {
                    x: readingRotation[0],
                    y: readingRotation[1],
                    z: readingRotation[2],
                    duration: 0.4,
                    ease: "back.out(1.2)"
                }, "<0.05");

            } else if (phase === 'READING') {
                // Hold Position
                gsap.to(groupRef.current.position, { x: 0, y: 0.9, z: 0, duration: 0.2, overwrite: true });
                // Rotation is now handled by useFrame mostly, but we set base here
                // actually gsap might fight useFrame. 
                // Fix: In READING, we let useFrame take control of rotation. 
                // but we need to ensure we don't snap.
                // The draw animation ends at readingRotation.
                // useFrame starts blending from there.

                // We just set scale and position here.
                gsap.to(groupRef.current.scale, { x: 2, y: 2, z: 2, duration: 0.2, overwrite: true });

            } else if (phase === 'DISCARDING') {
                const tl = gsap.timeline({ onComplete: onDiscardComplete });

                // DISCARD ANIMATION (Fast swoop from current pos)
                tl.to(groupRef.current.position, {
                    x: targetPos[0],
                    y: 0.02, // Land slightly above table/pile
                    z: targetPos[2],
                    duration: 0.4,
                    ease: "power3.in"
                });
                // Simultaneous rotation to flat
                tl.to(groupRef.current.rotation, {
                    x: -Math.PI / 2,
                    y: Math.random() * Math.PI, // Random spin
                    z: 0,
                    duration: 0.35
                }, "<");
                tl.to(groupRef.current.scale, {
                    x: 0.8, y: 0.8, z: 0.8,
                    duration: 0.35
                }, "<");
            }
        }, groupRef);

        // DO NOT REVERT - just kill. Persists visual state between phases.
        return () => ctx.kill();
    }, [phase, targetPos, readingRotation]);

    return (
        <group ref={groupRef}>
            <Card
                texturePath={card.texture}
                // Allow clicking anywhere on card to close reading
                onClick={() => { if (phase === 'READING') onValidate(); }}
                active={phase === 'READING'}
                seed={uniqueSeed}
                direction={1.0}
            />
            {/* Back Face (Synchronized) */}
            <Card
                texturePath="/textures/verso/Back Artwork.png"
                rotation={[0, Math.PI, 0]}
                position={[0, 0, -0.01]}
                seed={uniqueSeed}
                direction={-1.0}
            />
        </group>
    );
};

export default Table;
