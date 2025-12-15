import Papa from 'papaparse';

export const MECHANICS = {
    STANDARD: 'STANDARD',
    BRAS_DROIT: 'BRAS_DROIT',
    FLECHE: 'FLECHE',
};

export const parseDeck = (csvText) => {
    return new Promise((resolve) => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const deck = results.data.map((row) => {
                    let mechanic = MECHANICS.STANDARD;
                    const cardName = row.card_name || '';

                    if (cardName.includes('Bras Droit') || row.frame?.includes('Bras Droit')) {
                        mechanic = MECHANICS.BRAS_DROIT;
                    } else if (cardName.includes('La Flèche') || row.frame?.includes('La flèche')) {
                        mechanic = MECHANICS.FLECHE;
                    }

                    return {
                        id: row.frame,
                        name: row.card_name,
                        texture: `/textures/${row.frame}.png`,
                        description: row.description,
                        mechanic: mechanic,
                        standName: row.stand_name,
                        cardNumber: row.card_number
                    };
                });
                resolve(deck);
            },
            error: (err) => {
                console.error("CSV Parsing Error:", err);
                resolve([]);
            }
        });
    });
};

export const loadDeckFromPath = async (path = '/cards.csv') => {
    try {
        const response = await fetch(path);
        const text = await response.text();
        // Since the CSV is at root, we might need to handle path issues? 
        // In Vite, public assets are served at root.
        return parseDeck(text);
    } catch (e) {
        console.error("Failed to load deck:", e);
        return [];
    }
}
