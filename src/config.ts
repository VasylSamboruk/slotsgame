export const SYMBOL_TEXTURES = [
    '/assets/10.png', '/assets/J.png', '/assets/Q.png', '/assets/K.png', '/assets/A.png',
    '/assets/sunduk.png', '/assets/svitok.png',
    '/assets/d1.png', '/assets/d2.png', '/assets/d3.png', '/assets/d4.png',
    '/assets/bonus.png', '/assets/wild.png'
];

export const LETTERS = ['/assets/10.png', '/assets/J.png', '/assets/Q.png', '/assets/K.png', '/assets/A.png'];

export const CONFIG = {
    GAME_WIDTH: 2680,
    GAME_HEIGHT: 1568,
    BG_WIDTH: 1986,
    REEL_COUNT: 5,
    ROW_COUNT: 3,
    ROW_SPACING: 320,
    GLOBAL_Y_OFFSET: -35,
    DRAGON_SIZE: 295,
    LETTER_SIZE: 220,
    MASK_HEIGHT: 930,
    SYMBOLS_PER_REEL: 25 
};

// ТАБЛИЦЯ ВИПЛАТ (Чистий множник від ЗАГАЛЬНОЇ ставки)
export const PAYTABLE: Record<string, { 3: number, 4: number, 5: number }> = {
    '/assets/d1.png': { 3: 25, 4: 75, 5: 375 },       
    '/assets/d2.png': { 3: 17.5, 4: 50, 5: 250 },     
    '/assets/d3.png': { 3: 12.5, 4: 30, 5: 150 },     
    '/assets/d4.png': { 3: 10, 4: 20, 5: 100 },       
    '/assets/sunduk.png': { 3: 6, 4: 12.5, 5: 75 },   
    '/assets/svitok.png': { 3: 4, 4: 10, 5: 50 },     
    '/assets/A.png': { 3: 2.5, 4: 5, 5: 25 },         
    '/assets/K.png': { 3: 2.5, 4: 5, 5: 25 },         
    '/assets/Q.png': { 3: 1, 4: 2.5, 5: 12.5 },       
    '/assets/J.png': { 3: 1, 4: 2.5, 5: 12.5 },       
    '/assets/10.png': { 3: 1, 4: 2.5, 5: 12.5 }       
};

// ==========================================
// 20 ЛІНІЙ (ТОЧНА КОПІЯ З ТВОГО СКРІНШОТУ)
// 0 - Верхній ряд, 1 - Середній ряд, 2 - Нижній ряд
// ==========================================
export const PAYLINES = [
    [1, 1, 1, 1, 1], // 1 (Пряма по центру)
    [0, 0, 0, 0, 0], // 2 (Пряма зверху)
    [2, 2, 2, 2, 2], // 3 (Пряма знизу)
    [0, 1, 2, 1, 0], // 4 (V-подібна вниз)
    [2, 1, 0, 1, 2], // 5 (V-подібна вгору)
    [1, 0, 0, 0, 1], // 6
    [1, 2, 2, 2, 1], // 7
    [0, 0, 1, 2, 2], // 8
    [2, 2, 1, 0, 0], // 9
    [1, 2, 1, 0, 1], // 10
    [1, 0, 1, 2, 1], // 11
    [0, 1, 1, 1, 0], // 12
    [2, 1, 1, 1, 2], // 13
    [0, 1, 0, 1, 0], // 14
    [2, 1, 2, 1, 2], // 15
    [1, 1, 0, 1, 1], // 16
    [1, 1, 2, 1, 1], // 17
    [0, 0, 2, 0, 0], // 18 (Ось він, стрибок на 3-му барабані!)
    [2, 2, 0, 2, 2], // 19 (Стрибок вгору на 3-му барабані)
    [0, 2, 2, 2, 0]  // 20generateSpinResult
];

const BASE_SYMBOLS_WEIGHTS = [
    ...Array(15).fill('/assets/10.png'), ...Array(15).fill('/assets/J.png'),
    ...Array(12).fill('/assets/Q.png'), ...Array(10).fill('/assets/K.png'),
    ...Array(10).fill('/assets/A.png'), ...Array(8).fill('/assets/svitok.png'),
    ...Array(7).fill('/assets/sunduk.png'), ...Array(5).fill('/assets/d4.png'),
    ...Array(45).fill('/assets/d3.png'), ...Array(43).fill('/assets/d2.png'),
    ...Array(2).fill('/assets/d1.png') 
];

const REELS = [
    [...BASE_SYMBOLS_WEIGHTS, ...Array(5).fill('/assets/bonus.png')],
    [...BASE_SYMBOLS_WEIGHTS, ...Array(8).fill('/assets/wild.png')],
    [...BASE_SYMBOLS_WEIGHTS, ...Array(8).fill('/assets/wild.png'), ...Array(5).fill('/assets/bonus.png')],
    [...BASE_SYMBOLS_WEIGHTS, ...Array(8).fill('/assets/wild.png')],
    [...BASE_SYMBOLS_WEIGHTS, ...Array(5).fill('/assets/bonus.png')]
];

export function generateSpinResult(): string[][] {
    const grid: string[][] = [];
    for (let col = 0; col < CONFIG.REEL_COUNT; col++) {
        const reelStrip = REELS[col];
        const reelResult: string[] = [];
        let hasBonusInColumn = false; 

        for (let row = 0; row < CONFIG.ROW_COUNT; row++) {
            let selectedTexture = '';
            let isValid = false;
            while (!isValid) {
                const randomIndex = Math.floor(Math.random() * reelStrip.length);
                selectedTexture = reelStrip[randomIndex];
                if (selectedTexture === '/assets/bonus.png') {
                    if (hasBonusInColumn) continue; 
                    else hasBonusInColumn = true;
                }
                isValid = true;
            }
            reelResult.push(selectedTexture);
        }
        grid.push(reelResult);
    }

  // 🔥 ГАРАНТОВАНИЙ БОНУС ПРИ КОЖНОМУ СПІНІ (ДЛЯ ТЕСТІВ) 🔥
    // Примусово ставимо бонус по центру на 1, 3 і 5 барабанах:
 // grid[0][1] = '/assets/bonus.png'; 
   // grid[2][1] = '/assets/bonus.png'; 
   // grid[4][1] = '/assets/bonus.png';

    return grid;
}