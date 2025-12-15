import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import useGameStore from '../store/gameStore';
import Card from './Card';
import gsap from 'gsap';

// Main scene manager
const Table = () => {
    const { deck, initializeDeck, phase, currentCard, drawCard, finishDrawAnimation, validateCard, finishDiscardAnimation, discardPile, choices, chooseCard } = useGameStore();

    // Refs for animation targets
    const activeCardRef = useRef();

    useEffect(() => {
        console.log("Table Mounted, initiating deck...");
        initializeDeck().then(() => console.log("Deck initialized"));
    }, []);

    // Handle Draw Animation
    useEffect(() => {
        if (phase === 'DRAWING' && activeCardRef.current && currentCard) {
            // Starting position is deck position
            const el = activeCardRef.current; // access mesh via Card forwardRef? Actually Card currently doesn't forward ref. 
            // We need to change Card to forwardRef or wrap it.
            // Or just standard ref on a group wrapping it.
            // Let's use a group wrapper for simplicity in this replacement.
        }
    }, [phase, currentCard]);

    // Simplified logic for this step, we will use a key-based re-mount or similar for now, 
    // but GSAP is best with refs. 
    // I'll rewrite the component to use a helper for the Active Card.

    return (
        <group>
            {/* Deck Pile */}
            <Card
                texturePath="/textures/verso/Back Artwork.png"
                position={[0, -1, -5]}
                scale={1}
                active={false}
                onClick={() => {
                    if (phase === 'IDLE') {
                        drawCard();
                    }
                }}
            />

            {/* Discard Visual (Just top card) */}
            {discardPile.length > 0 && (
                <Card
                    texturePath={discardPile[0].texture}
                    position={[2.5, -1, -5]} // Right side
                    rotation={[0, 0, Math.random() * 0.2]}
                    scale={1}
                    active={false}
                />
            )}

            {/* Active Moving Card */}
            {currentCard && (
                <AnimatedCard
                    key={currentCard.id} // Re-mounts on new card, fresh animation
                    card={currentCard}
                    phase={phase}
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
    // Simple side-by-side layout
    return (
        <group>
            {cards.map((card, index) => (
                <Card
                    key={card.id}
                    texturePath={card.texture}
                    position={[index === 0 ? -1.5 : 1.5, 0, 0]} // Left and Right
                    rotation={[0, 0, 0]} // Already flipped up for selection?
                    scale={1}
                    active={true} // Breathing
                    onClick={() => onChoose(card)}
                />
            ))}
        </group>
    );
};

const AnimatedCard = ({ card, phase, onDrawComplete, onDiscardComplete, onValidate }) => {
    const groupRef = useRef();

    useEffect(() => {
        if (phase === 'DRAWING') {
            const tl = gsap.timeline({ onComplete: onDrawComplete });

            // Initial state (at Deck)
            gsap.set(groupRef.current.position, { x: 0, y: -1, z: -5 });
            gsap.set(groupRef.current.rotation, { y: Math.PI }); // Face down (Back visible? No, texture is Front)
            // Wait, if texture is Front, Face Down means we see the back? 
            // Our Card shader takes ONE texture.
            // So if we want to show Back then Front, we need two textures or flip mesh?
            // "Le Flip : Rotation 180° sur l'axe Y à mi-parcours pour révéler la texture Recto."
            // This implies the card has a back face.
            // My Card shader is DoubleSide but uses one texture.

            // FIX: Card should probably render Back Texture if rotation is specific?
            // Or simpler: The Card mesh has two sides?
            // Since "No-Bloat", maybe just start with Back Texture and swap texture at 90deg?
            // Or use two planes back-to-back?

            // Let's assume for now we animate position and deal with flip later or assume back is black.
            // For true 3D flip, we need a back face.

            tl.to(groupRef.current.position, {
                x: 0, y: 0, z: 0,
                duration: 1.5,
                ease: "power2.out"
            });

            // Flip logic (stubbed for visual consistency with current shader)
            tl.to(groupRef.current.rotation, {
                y: 0,
                duration: 1,
                ease: "power1.out"
            }, "<0.2"); // Start shortly after move

        } else if (phase === 'DISCARDING') {
            const tl = gsap.timeline({ onComplete: onDiscardComplete });
            tl.to(groupRef.current.position, {
                x: 2.5, y: -1, z: -5,
                duration: 0.8,
                ease: "power2.in"
            });
        }
    }, [phase]);

    return (
        <group ref={groupRef}>
            <Card
                texturePath={card.texture}
                active={phase === 'READING'} // Activate breathing only when reading
                onClick={() => {
                    if (phase === 'READING') onValidate();
                }}
            />
            {/* Back Face Hack: Another card rotated 180 behind it? */}
            <Card
                texturePath="/textures/verso/Back Artwork.png"
                rotation={[0, Math.PI, 0]}
                position={[0, 0, -0.01]} // Slight offset to prevent z-fighting
            />
        </group>
    );
}

export default Table;
