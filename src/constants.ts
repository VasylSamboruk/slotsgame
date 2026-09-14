export const GAME_CONFIG = {
    LOGICAL_WIDTH: 880,   // Зменшено з 1080 (6 cols * 130 + 7 gaps)
    LOGICAL_HEIGHT: 740,  // Зменшено з 1200 під реальну висоту 5 рядків
    COLS: 6,
    ROWS: 5,
    SYMBOL_SIZE: 130,
    GAP: 12,
    
    SYMBOLS: [
        // Збалансована частота: символи грають регулярно, але не занадто часто
        { id: '10', view: '/symbols/10.png', weight: 350 },
        { id: 'J', view: '/symbols/J.png', weight: 350 },
        { id: 'Q', view: '/symbols/Q.png', weight: 350 },
        { id: 'K', view: '/symbols/K.png', weight: 220 },
        { id: 'A', view: '/symbols/A.png', weight: 220 },
        { id: 'X1', view: '/symbols/X1.png', weight: 130 },
        { id: 'X2', view: '/symbols/X2.png', weight: 130 },
        { id: 'X3', view: '/symbols/X3.png', weight: 90 },
        { id: 'X4', view: '/symbols/X4.png', weight: 70 },
        { id: 'X5', view: '/symbols/X5.png', weight: 50 },
        
        { id: 'wild', view: '/symbols/wild.png', weight: 65 },   
        { id: 'FS', view: '/symbols/FS.png', weight: 10 },         
        { id: 'veselka', view: '/symbols/veselka.png', weight: 15 }, 
        
        { id: 'bronz', view: '/symbols/bronz.png', weight: 0 },
        { id: 'silver', view: '/symbols/silver.png', weight: 0 },
        { id: 'gold', view: '/symbols/gold.png', weight: 0 },
        { id: 'klever', view: '/symbols/klever.png', weight: 0 },
        { id: 'gorshok', view: '/symbols/gorshok.png', weight: 0 }
    ],

    RAINBOW_VALUES: {
        BRONZE: [1, 2, 3, 4], 
        SILVER: [5, 10, 15, 20],
        GOLD: [25, 50, 100, 250, 500],
        CLOVER: [2, 3, 4, 5, 10]
    },
    
    COLORS: {
        BACKGROUND: 0x1a1a1a,
        BOARD_BG: 0x1a252f,
        CELL_BG: 0x34495e,
        BOARD_BORDER: 0xf39c12,
        UI_PANEL: 0x2c3e50,
        TEXT: 0xffffff,
        WIN_TEXT: 0xf1c40f
    },

    getMultiplier: (symbolId: string, count: number): number => {
        if (count < 5) return 0;
        let c = count;
        if (c >= 9 && c <= 10) c = 9;
        if (c >= 11 && c <= 12) c = 11;
        if (c >= 13) c = 13;

        const paytable: Record<string, Record<number, number>> = {
            '10': { 5: 0.1, 6: 0.2, 7: 0.3, 8: 0.5, 9: 1.5, 11: 5.0, 13: 15.0 },
            'J':  { 5: 0.1, 6: 0.2, 7: 0.3, 8: 0.5, 9: 1.5, 11: 5.0, 13: 15.0 },
            'Q':  { 5: 0.1, 6: 0.2, 7: 0.3, 8: 0.5, 9: 1.5, 11: 5.0, 13: 15.0 },
            'K':  { 5: 0.1, 6: 0.2, 7: 0.3, 8: 0.5, 9: 1.5, 11: 5.0, 13: 15.0 },
            'A':  { 5: 0.1, 6: 0.2, 7: 0.3, 8: 0.5, 9: 1.5, 11: 5.0, 13: 15.0 },
            'X1': { 5: 0.3, 6: 0.4, 7: 0.5, 8: 0.7, 9: 2.5, 11: 7.5, 13: 25.0 },
            'X2': { 5: 0.3, 6: 0.4, 7: 0.5, 8: 0.7, 9: 2.5, 11: 7.5, 13: 25.0 },
            'X3': { 5: 0.5, 6: 0.7, 7: 1.0, 8: 1.5, 9: 5.0, 11: 15.0, 13: 50.0 },
            'X4': { 5: 0.5, 6: 0.7, 7: 1.0, 8: 1.5, 9: 5.0, 11: 15.0, 13: 50.0 },
            'X5': { 5: 1.0, 6: 1.5, 7: 2.0, 8: 3.0, 9: 10.0, 11: 30.0, 13: 100.0 }
        };
        return paytable[symbolId]?.[c] || 0;
    }
};