import { create } from 'zustand';
import { loadDeckFromPath, parseDeck, MECHANICS } from '../utils/csvParser';

export const GAME_PHASES = {
    IDLE: 'IDLE',
    DRAWING: 'DRAWING',
    READING: 'READING',
    DISCARDING: 'DISCARDING',
    CHOOSING_KEEP: 'CHOOSING_KEEP' // For "La Flèche"
};

const AVATARS = [
    '/avatars/avatar_1.png',
    '/avatars/avatar_2.png',
    '/avatars/avatar_3.png',
    '/avatars/avatar_4.png',
    '/avatars/avatar_5.png',
    '/avatars/avatar_6.png'
];


const useGameStore = create((set, get) => ({
    deck: [],
    players: [], // { id, name, avatar, discardPile: [] }
    currentPlayerIndex: 0,
    phase: GAME_PHASES.SETUP,
    currentCard: null,

    // La Flèche specifics
    pendingChoices: [],
    choices: [],

    // Bras Droit specifics
    extraDraws: 0,

    startGame: async (playerCount = 4) => {
        try {
            const response = await fetch('/cards.csv');
            const csvText = await response.text();
            const initialDeck = await parseDeck(csvText);

            // Setup Players
            const players = Array.from({ length: playerCount }).map((_, i) => ({
                id: i,
                name: `Jojo ${i + 1}`,
                avatar: AVATARS[i % AVATARS.length],
                discardPile: []
            }));

            // Shuffle
            const shuffledDeck = initialDeck.sort(() => Math.random() - 0.5);

            set({
                deck: shuffledDeck,
                players: players,
                currentPlayerIndex: 0,
                phase: GAME_PHASES.IDLE
            });
        } catch (error) {
            console.error("Failed to start game:", error);
        }
    },

    drawCard: () => {
        const { deck, phase, extraDraws } = get();
        // Only allow drawing in IDLE
        if (phase !== GAME_PHASES.IDLE && extraDraws === 0) return;
        if (deck.length === 0) return;

        set((state) => {
            const newDeck = [...state.deck];
            const card = newDeck.shift();
            const newExtraDraws = state.extraDraws > 0 ? state.extraDraws - 1 : 0;

            return {
                currentCard: card,
                deck: newDeck,
                phase: GAME_PHASES.DRAWING,
                extraDraws: newExtraDraws
            };
        });
    },

    finishDrawAnimation: () => {
        set({ phase: GAME_PHASES.READING });
    },

    validateCard: () => {
        const { currentCard } = get();
        if (!currentCard) return;

        if (currentCard.mechanic === MECHANICS.BRAS_DROIT) {
            set({
                phase: GAME_PHASES.DISCARDING,
                extraDraws: 1 // Bras Droit grants 1 extra draw immediately
            });
        } else if (currentCard.mechanic === MECHANICS.FLECHE) {
            set((state) => {
                const newDeck = [...state.deck];
                const c1 = newDeck.shift();
                const c2 = newDeck.shift();

                return {
                    phase: GAME_PHASES.DISCARDING,
                    pendingChoices: [c1, c2].filter(Boolean),
                    deck: newDeck
                };
            });
        } else {
            set({ phase: GAME_PHASES.DISCARDING });
        }
    },

    finishDiscardAnimation: () => {
        set((state) => {
            if (!state.currentCard) return { phase: GAME_PHASES.IDLE };

            const pendingChoices = state.pendingChoices || [];
            const wasFleche = state.currentCard.mechanic === MECHANICS.FLECHE;

            // Add to CURRENT PLAYER'S discard pile
            const playerIndex = state.currentPlayerIndex;
            const newPlayers = [...state.players];
            newPlayers[playerIndex] = {
                ...newPlayers[playerIndex],
                discardPile: [state.currentCard, ...newPlayers[playerIndex].discardPile]
            };

            // Next Turn Logic (Round Robin)
            // If extraDraws > 0 (Bras Droit), same player continues.
            let nextPlayerIndex = state.currentPlayerIndex;
            if (state.extraDraws === 0 && !wasFleche) {
                nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
            }

            if (wasFleche && pendingChoices.length > 0) {
                return {
                    players: newPlayers,
                    currentCard: null,
                    choices: pendingChoices,
                    phase: GAME_PHASES.CHOOSING_KEEP,
                    pendingChoices: []
                };
            }

            return {
                players: newPlayers,
                currentPlayerIndex: nextPlayerIndex,
                currentCard: null,
                phase: GAME_PHASES.IDLE
            };
        });
    },

    chooseCard: (keptCard) => {
        set((state) => {
            const other = state.choices.find(c => c.id !== keptCard.id);
            const newDeck = [...state.deck];
            if (other) newDeck.push(other);

            return {
                choices: [],
                deck: newDeck,
                currentCard: keptCard,
                phase: GAME_PHASES.READING
            };
        });
    }
}));

export default useGameStore;
