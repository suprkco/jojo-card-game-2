import { create } from 'zustand';
import { loadDeckFromPath, MECHANICS } from '../utils/csvParser';

export const GAME_PHASES = {
    IDLE: 'IDLE',
    DRAWING: 'DRAWING',
    READING: 'READING',
    DISCARDING: 'DISCARDING',
    CHOOSING_KEEP: 'CHOOSING_KEEP' // For "La Flèche"
};

const useGameStore = create((set, get) => ({
    deck: [],
    discardPile: [],
    currentCard: null,
    extraCards: [], // For multi-draw mechanics
    choices: [], // For "La Flèche" choices
    extraDraws: 0, // For "Bras Droit"
    pendingChoices: [], // For "La Flèche" temporary storage
    phase: GAME_PHASES.IDLE,
    loading: true,

    initializeDeck: async () => {
        const deck = await loadDeckFromPath();
        // Shuffle deck
        const shuffled = [...deck].sort(() => Math.random() - 0.5);
        set({ deck: shuffled, loading: false });
    },

    drawCard: () => {
        const { deck, discardPile, extraDraws } = get();
        if (deck.length === 0) {
            if (discardPile.length === 0) return; // Empty deck
            // Reshuffle discard into deck
            const newDeck = [...discardPile].sort(() => Math.random() - 0.5);
            set({ deck: newDeck, discardPile: [] });
            // Proceed to draw
        }

        set((state) => {
            // Check if this is a "La Flèche" choice draw (handled separately usually but let's keep it simple)
            if (state.deck.length === 0) return {};
            const newDeck = [...state.deck];
            const card = newDeck.shift(); // Take from top

            // If we had extra draws, decrement?
            // "Bras Droit": "UI réactive le Deck immédiatement pour autoriser une 2ème pioche forcée"
            // So drawing consumes the "permission".
            const newExtraDraws = state.extraDraws > 0 ? state.extraDraws - 1 : 0;

            return {
                deck: newDeck,
                currentCard: card,
                extraDraws: newExtraDraws,
                phase: GAME_PHASES.DRAWING
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
            // Trigger Bras Droit: Extra Draw
            set({
                phase: GAME_PHASES.DISCARDING,
                extraDraws: 1 // Allow 1 extra draw (Total 2 drawn implies previous + this? No "Tire 2 cartes". Standard is 1. "Bras Droit" -> Tire 2. So +1 extra.)
            });
        } else if (currentCard.mechanic === MECHANICS.FLECHE) {
            // Trigger La Flèche: Draw 2, Keep 1
            // Flow: Discard Flèche (or move aside) -> Draw 2 cards into "choices" state -> Phase CHOOSING_KEEP
            // For simplicity/No-Bloat, we can treat Flèche resolution as "Drawing 2 cards immediately"
            set((state) => {
                // Draw 2 cards from deck
                const newDeck = [...state.deck];
                const c1 = newDeck.shift();
                const c2 = newDeck.shift();
                // Handle empty deck edge case if needed... ignoring for brevity

                return {
                    phase: GAME_PHASES.DISCARDING,
                    // We need to queue the choices AFTER discard animation of Flèche?
                    // Or do we transition to CHOOSING_KEEP immediately?
                    // Prompt: "La carte 'Flèche' se range sur le côté... L'app déclenche... 2 nouvelles cartes"
                    // Let's use a temporary state or effect.
                    // We'll store choices and transit to CHOOSING_KEEP inside finishDiscardAnimation if Mechanic was FLECHE
                    pendingChoices: [c1, c2].filter(Boolean),
                    deck: newDeck
                };
            });
        } else {
            // Standard
            set({ phase: GAME_PHASES.DISCARDING });
        }
    },

    finishDiscardAnimation: () => {
        set((state) => {
            if (!state.currentCard) return { phase: GAME_PHASES.IDLE };

            const pendingChoices = state.pendingChoices || [];
            const wasFleche = state.currentCard.mechanic === MECHANICS.FLECHE;

            // Discard current
            const newDiscard = [state.currentCard, ...state.discardPile];

            if (wasFleche && pendingChoices.length > 0) {
                return {
                    discardPile: newDiscard,
                    currentCard: null,
                    choices: pendingChoices,
                    phase: GAME_PHASES.CHOOSING_KEEP,
                    pendingChoices: []
                };
            }

            // If extraDraws > 0, we go to IDLE but user knows they MUST draw
            // Prompt says "UI réactive le Deck". So IDLE is fine, user clicks deck.

            return {
                discardPile: newDiscard,
                currentCard: null,
                phase: GAME_PHASES.IDLE
            };
        });
    },

    chooseCard: (keptCard) => {
        set((state) => {
            // Choices are [c1, c2]. User chose keptCard.
            // Other card goes to bottom of deck?
            // Prompt: "La carte non-choisie... retourne sous le Deck."
            // Kept card stays active.

            const other = state.choices.find(c => c.id !== keptCard.id);
            const newDeck = [...state.deck];
            if (other) newDeck.push(other); // Add to bottom

            return {
                choices: [],
                deck: newDeck,
                currentCard: keptCard,
                phase: GAME_PHASES.READING // Becomes the active card
            };
        });
    }
}));

export default useGameStore;
