import React, { useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { useThree, useLoader } from '@react-three/fiber';
import useGameStore from '../store/gameStore';
import Card from './Card';
import gsap from 'gsap';
import * as THREE from 'three';

// Player Position Utilities
const TABLE_RADIUS = 3.5;
const getPlayerPos = (index, total) => {
    // Start from "Bottom" side (Close to camera) or top?
    // Let's create a circle. Camera is at +Z.
    // Index 0 should probably be "Bottom" (closest to player view) if local mp?
    // Or just spread evenly.
    const angle = (index / total) * Math.PI * 2;
    return [Math.cos(angle) * TABLE_RADIUS, 0, Math.sin(angle) * TABLE_RADIUS];
};

const Table = () => {
    const {
        deck, phase, currentCard,
        drawCard, finishDrawAnimation, validateCard, finishDiscardAnimation,
        players, currentPlayerIndex, choices, chooseCard
    } = useGameStore();

    // Get position of current player to send card to
    const targetDiscardPos = useMemo(() => {
        if (!players.length) return [2.5, 0, 0]; // Default fallback
        const pos = getPlayerPos(currentPlayerIndex, players.length);
        // Offset slightly in front of player
        return [pos[0] * 0.8, 0, pos[2] * 0.8];
    }, [currentPlayerIndex, players.length]);

    return (
        <group>
            {/* The Deck (Center) */}
            <group position={[0, 0, 0]}>
                <Card
                    texturePath="/textures/verso/Back Artwork.png"
                    position={[0, 0, 0]}
                    rotation={[-Math.PI / 2, 0, Math.PI]} // Face down
                    scale={1}
                    active={false}
                    onClick={() => {
                        if (phase === 'IDLE') drawCard();
                    }}
                />
                {/* Visual Stack Thickness */}
                {deck.length > 0 && Array.from({ length: Math.min(deck.length, 5) }).map((_, i) => (
                    <mesh key={i} position={[0, -0.02 * (i + 1), 0]} rotation={[-Math.PI / 2, 0, Math.PI]}>
                        <planeGeometry args={[2, 3]} />
                        <meshBasicMaterial color="#111" />
                    </mesh>
                ))}
            </group>

            {/* Players & Discards */}
            {players.map((player, index) => {
                const pos = getPlayerPos(index, players.length);
                const isCurrent = index === currentPlayerIndex;

                return (
                    <group key={player.id} position={pos} lookAt={new THREE.Vector3(0, 0, 0)}>
                        {/* Avatar Billboard */}
                        <mesh position={[0, 1.5, 0]} rotation={[0, Math.PI, 0]}>
                            <planeGeometry args={[1.2, 1.2]} />
                            <meshBasicMaterial
                                map={useLoader(THREE.TextureLoader, player.avatar)}
                                transparent
                                opacity={isCurrent ? 1 : 0.5}
                                color={isCurrent ? "white" : "#666"}
                            />
                            {isCurrent && (
                                <lineSegments>
                                    <edgesGeometry args={[new THREE.PlaneGeometry(1.2, 1.2)]} />
                                    <lineBasicMaterial color="#d4af37" linewidth={2} />
                                </lineSegments>
                            )}
                        </mesh>

                        {/* Player's Discard Pile */}
                        {player.discardPile.map((card, i) => (
                            i === 0 && ( // Only render top card to save draw calls
                                <Card
                                    key={card.id || i}
                                    texturePath={card.texture}
                                    position={[0, 0.1, 1.5]} // Front of avatar
                                    rotation={[-Math.PI / 2, 0, Math.random() * 0.2]}
                                    scale={0.8}
                                    active={false}
                                />
                            )
                        ))}
                    </group>
                );
            })}

            {/* Active Moving Card */}
            {currentCard && (
                <AnimatedCard
                    key={currentCard.id} // Ensure fresh mount on new card
                    card={currentCard}
                    phase={phase}
                    targetPos={targetDiscardPos}
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

// Animated Card Logic with useLayoutEffect for stability
const AnimatedCard = ({ card, phase, targetPos, onDrawComplete, onDiscardComplete, onValidate }) => {
    const groupRef = useRef();
    const uniqueSeed = useMemo(() => Math.random() * 1000, []);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            if (phase === 'DRAWING') {
                // INSTANTLY Set start position (Deck Center)
                gsap.set(groupRef.current.position, { x: 0, y: 0, z: 0 });
                gsap.set(groupRef.current.rotation, { x: -Math.PI / 2, y: 0, z: Math.PI }); // Face Down
                gsap.set(groupRef.current.scale, { x: 0.1, y: 0.1, z: 0.1 });

                const tl = gsap.timeline({ onComplete: onDrawComplete });

                // Pop Up & Flip
                tl.to(groupRef.current.position, {
                    y: 4, // High up
                    z: 0,
                    duration: 0.8,
                    ease: "elastic.out(1, 0.5)"
                });
                tl.to(groupRef.current.scale, {
                    x: 2, y: 2, z: 2, // Big for reading
                    duration: 0.5
                }, "<");
                tl.to(groupRef.current.rotation, {
                    x: -0.1, // Facing camera directly (if Cam is at [0,8,6] with LookAt(0,0,0), this tilt correction is vital)
                    y: 0,
                    z: 0,
                    duration: 0.6,
                    ease: "power2.out"
                }, "<0.1");

            } else if (phase === 'DISCARDING') {
                const tl = gsap.timeline({ onComplete: onDiscardComplete });

                // Fly to Target Discard
                tl.to(groupRef.current.position, {
                    x: targetPos[0],
                    y: 0.1,
                    z: targetPos[2],
                    duration: 0.7,
                    ease: "power2.in"
                });
                tl.to(groupRef.current.rotation, {
                    x: -Math.PI / 2,
                    y: Math.random() * Math.PI,
                    z: 0,
                    duration: 0.6
                }, "<");
                tl.to(groupRef.current.scale, {
                    x: 0.8, y: 0.8, z: 0.8,
                    duration: 0.7
                }, "<");
            }
        }, groupRef);
        return () => ctx.revert();
    }, [phase]); // Dependency on phase ensures it triggers exactly when state changes

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
