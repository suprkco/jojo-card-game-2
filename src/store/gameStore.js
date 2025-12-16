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

    inspectingPlayer: null, // Index of player whose pile is being inspected
    setInspectingPlayer: (index) => set({ inspectingPlayer: index }),

    turnCount: 0,

    // ... (existing state)

    startGame: async (playerNames = []) => {
        try {
            const response = await fetch('/cards.csv');
            const csvText = await response.text();
            const initialDeck = await parseDeck(csvText);

            // Setup Players from Names
            let players = [];
            const createPlayer = (i, name) => ({
                id: i,
                name: name,
                avatar: AVATARS[i % AVATARS.length],
                discardPile: [],
                curseSlot: null // Special slot for Scolippi
            });

            if (typeof playerNames === 'number') {
                players = Array.from({ length: playerNames }).map((_, i) => createPlayer(i, `Jojo ${i + 1}`));
            } else {
                players = playerNames.map((name, i) =>
                    createPlayer(i, name || (i === 0 ? "Jotaro" : i === 1 ? "Dio" : i === 2 ? "Giorno" : "Jolyne"))
                );
            }

            // Shuffle
            const shuffledDeck = initialDeck.sort(() => Math.random() - 0.5);

            set({
                deck: shuffledDeck,
                players: players,
                currentPlayerIndex: 0,
                phase: GAME_PHASES.IDLE,
                turnCount: 0
            });
        } catch (error) {
            console.error("Failed to start game:", error);
        }
    },

    drawCard: () => {
        const { deck, phase, extraDraws, players, currentPlayerIndex } = get();
        // Only allow drawing in IDLE
        if (phase !== GAME_PHASES.IDLE && extraDraws === 0) return;
        if (deck.length === 0) return;

        set((state) => {
            const newDeck = [...state.deck];
            const card = newDeck.shift();
            const newExtraDraws = state.extraDraws > 0 ? state.extraDraws - 1 : 0;

            // Scolippi Transfer Logic (Bucciarati)
            let newPlayers = [...state.players];
            if (card.name.toLowerCase().includes("bucciarati")) {
                // Check if anyone holds Scolippi
                let scolippiHolderIndex = newPlayers.findIndex(p => p.curseSlot && p.curseSlot.name.toLowerCase().includes("scolippi"));
                if (scolippiHolderIndex !== -1 && scolippiHolderIndex !== state.currentPlayerIndex) {
                    // Transfer to current player
                    const curseCard = newPlayers[scolippiHolderIndex].curseSlot;
                    newPlayers[scolippiHolderIndex] = { ...newPlayers[scolippiHolderIndex], curseSlot: null };
                    newPlayers[state.currentPlayerIndex] = { ...newPlayers[state.currentPlayerIndex], curseSlot: curseCard };
                }
            }

            return {
                currentCard: card,
                deck: newDeck,
                phase: GAME_PHASES.DRAWING,
                extraDraws: newExtraDraws,
                players: newPlayers,
                currentCardIsHidden: false // Reset
            };
        });
    },

    finishDrawAnimation: () => {
        set({ phase: GAME_PHASES.READING });
    },

    validateCard: (isFaceDown = false) => {
        const { currentCard } = get();
        if (!currentCard) return;

        set({ currentCardIsHidden: isFaceDown });

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

            // Hidden Logic
            const cardToAdd = { ...state.currentCard, hidden: state.currentCardIsHidden };
            const isScolippi = cardToAdd.name.toLowerCase().includes("scolippi");

            // Add to CURRENT PLAYER'S discard pile OR Curse Slot
            const playerIndex = state.currentPlayerIndex;
            const newPlayers = [...state.players];

            if (isScolippi) {
                newPlayers[playerIndex] = {
                    ...newPlayers[playerIndex],
                    curseSlot: cardToAdd
                };
            } else {
                newPlayers[playerIndex] = {
                    ...newPlayers[playerIndex],
                    discardPile: [cardToAdd, ...newPlayers[playerIndex].discardPile]
                };
            }

            // Turn Count & Reveal Logic
            let newTurnCount = state.turnCount + 1;
            // A "Round" ends when turnCount % playerCount == 0? 
            // The prompt says "un tour = chaque joueur à tiré une carte"
            // So yes, after N turns (where N is player count).

            if (newTurnCount % state.players.length === 0) {
                // Reveal all hidden cards
                newPlayers.forEach((p, i) => {
                    newPlayers[i] = {
                        ...p,
                        discardPile: p.discardPile.map(c => c.hidden ? { ...c, hidden: false } : c)
                    };
                });
            }

            // Next Turn Logic (Round Robin)
            // If extraDraws > 0 (Bras Droit), same player continues.
            let nextPlayerIndex = state.currentPlayerIndex;
            if (state.extraDraws === 0 && !wasFleche) {
                nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
            }

            // ... (rest is same)

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

    currentCard: keptCard,
    phase: GAME_PHASES.READING
};
        });
    },

moveCard: (cardId, fromPlayerIndex, toPlayerIndex) => {
    set((state) => {
        const newPlayers = [...state.players];
        const fromPlayer = newPlayers[fromPlayerIndex];
        const toPlayer = newPlayers[toPlayerIndex];

        const cardIndex = fromPlayer.discardPile.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return {}; // Failed

        const [card] = fromPlayer.discardPile.splice(cardIndex, 1);
        toPlayer.discardPile = [card, ...toPlayer.discardPile];

        return { players: newPlayers };
    });
}
}));

export default useGameStore;
