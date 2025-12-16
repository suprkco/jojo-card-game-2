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

                    const cleanText = (text) => text ? text.replace(/_x000d_/g, '\n').replace(/_x000D_/g, '\n').trim() : '';

                    // Sanitize filename: Replace apostrophes with underscores to match file system
                    const textureFilename = row.frame ? row.frame.replace(/'/g, '_') : '';

                    return {
                        id: row.frame,
                        name: cleanText(row.card_name),
                        texture: `/textures/${textureFilename}.png`,
                        description: cleanText(row.description),
                        mechanic: mechanic,
                        standName: cleanText(row.stand_name),
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
