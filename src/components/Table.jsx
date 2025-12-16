import React, { useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { useThree, useLoader } from '@react-three/fiber';
import useGameStore from '../store/gameStore';
import Card from './Card';
import gsap from 'gsap';
import * as THREE from 'three';

// Player Position Utilities
const TABLE_RADIUS = 3.5;
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
        players, currentPlayerIndex, choices, chooseCard
    } = useGameStore();

    // Calculate reading rotation to face camera at [0, 8, 6]
    // Card at [0, 4, 0]. Vector to Cam: [0, 4, 6].
    // Pitch (X-axis) = atan2(4, 6) ~= 0.588 rads
    const readingRotation = useMemo(() => [Math.atan2(4, 6), 0, 0], []);

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

                        {/* Discard Slot Marker (Visual Only) */}
                        <mesh position={[0, 0.01, 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
                            <planeGeometry args={[1.6, 2.4]} />
                            <meshBasicMaterial color="white" opacity={0.1} transparent side={THREE.DoubleSide} />
                            <lineSegments>
                                <edgesGeometry args={[new THREE.PlaneGeometry(1.6, 2.4)]} />
                                <lineBasicMaterial color={isCurrent ? "#ffd700" : "#444"} linewidth={1} />
                            </lineSegments>
                        </mesh>

                        {/* Player's Discard Pile */}
                        {player.discardPile.map((card, i) => (
                            i === 0 && ( // Only render top card
                                <Card
                                    key={card.id || i}
                                    texturePath={card.texture}
                                    position={[0, 0.1, 1.5]} // Should match slot marker
                                    rotation={[-Math.PI / 2, 0, Math.random() * 0.1 - 0.05]}
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

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            if (phase === 'DRAWING') {
                // START
                gsap.set(groupRef.current.position, { x: 0, y: 0, z: 0 });
                gsap.set(groupRef.current.rotation, { x: -Math.PI / 2, y: 0, z: Math.PI });
                gsap.set(groupRef.current.scale, { x: 0.1, y: 0.1, z: 0.1 });

                const tl = gsap.timeline({ onComplete: onDrawComplete });

                // DRAW ANIMATION
                tl.to(groupRef.current.position, {
                    y: 4,
                    z: 0,
                    duration: 0.7,
                    ease: "back.out(1.2)"
                });
                tl.to(groupRef.current.scale, {
                    x: 2, y: 2, z: 2,
                    duration: 0.5
                }, "<");
                tl.to(groupRef.current.rotation, {
                    x: readingRotation[0],
                    y: readingRotation[1],
                    z: readingRotation[2],
                    duration: 0.6,
                    ease: "power2.out"
                }, "<0.1");

            } else if (phase === 'READING') {
                // EXPLICITLY HOLD READING POSITION
                // Snaps to perfect reading angle if it drifted or was reset
                gsap.to(groupRef.current.position, { x: 0, y: 4, z: 0, duration: 0.1 });
                gsap.to(groupRef.current.rotation, {
                    x: readingRotation[0],
                    y: readingRotation[1],
                    z: readingRotation[2],
                    duration: 0.1
                });
                gsap.to(groupRef.current.scale, { x: 2, y: 2, z: 2, duration: 0.1 });

            } else if (phase === 'DISCARDING') {
                const tl = gsap.timeline({ onComplete: onDiscardComplete });

                // DISCARD ANIMATION
                tl.to(groupRef.current.position, {
                    x: targetPos[0],
                    y: 0.1,
                    z: targetPos[2],
                    duration: 0.6,
                    ease: "power2.in"
                });
                tl.to(groupRef.current.rotation, {
                    x: -Math.PI / 2,
                    y: Math.random() * Math.PI,
                    z: 0,
                    duration: 0.5
                }, "<");
                tl.to(groupRef.current.scale, {
                    x: 0.8, y: 0.8, z: 0.8,
                    duration: 0.6
                }, "<");
            }
        }, groupRef);

        return () => ctx.revert();
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
