import { PAYLINES, PAYTABLE, CONFIG } from './config';

export interface WinResult {
    lineIndex: number;          
    amount: number;             
    // 🛑 ФІКС: додаємо actualSym, щоб пам'ятати, ким насправді є символ
    positions: { c: number, r: number, actualSym: string }[]; 
    symbol: string;             
}

export function calculateWins(grid: string[][], totalBet: number): WinResult[] {
    const wins: WinResult[] = [];

    for (let i = 0; i < PAYLINES.length; i++) {
        const line = PAYLINES[i];
        
        const lineSymbols = [
            grid[0][line[0]], grid[1][line[1]], grid[2][line[2]], 
            grid[3][line[3]], grid[4][line[4]]
        ];
        
        const firstSymbol = lineSymbols.find(s => s !== '/assets/wild.png' && s !== '/assets/bonus.png');
        if (!firstSymbol) continue; 

        let matchCount = 0;
        const positions = [];

        for (let col = 0; col < CONFIG.REEL_COUNT; col++) {
            const sym = lineSymbols[col];
            if (sym === firstSymbol || sym === '/assets/wild.png') {
                matchCount++;
                // 🛑 ФІКС: записуємо справжню картинку (sym) у пам'ять
                positions.push({ c: col, r: line[col], actualSym: sym });
            } else {
                break; 
            }
        }

        if (matchCount >= 3) {
            const pay = PAYTABLE[firstSymbol];
            if (pay && pay[matchCount as 3 | 4 | 5]) {
                let amount = totalBet * pay[matchCount as 3 | 4 | 5]; 
                wins.push({ lineIndex: i, amount, positions, symbol: firstSymbol });
            }
        }
    }

    let bonusCount = 0;
    const bonusPositions = [];
    for (let c = 0; c < CONFIG.REEL_COUNT; c++) {
        for (let r = 0; r < CONFIG.ROW_COUNT; r++) {
            if (grid[c][r] === '/assets/bonus.png') {
                bonusCount++;
                bonusPositions.push({ c, r, actualSym: '/assets/bonus.png' });
            }
        }
    }

    if (bonusCount >= 3) {
        wins.push({
            lineIndex: -1, 
            amount: totalBet * 5, 
            positions: bonusPositions,
            symbol: '/assets/bonus.png'
        });
    }

    return wins;
}