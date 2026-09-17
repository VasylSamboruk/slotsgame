import { GAME_CONFIG } from '../constants';

export class GameLogic {
    public balance: number = 5000.00;
    public currentBet: number = 1.00;
    public currentWin: number = 0;
    public totalBonusWin: number = 0;
    public gridState: string[][] = [];
    
    public goldenSquares: boolean[][] = [];
    public coinValues: (number | null)[][] = [];
    public potCollected: boolean[][] = []; 

    public freeSpins: number = 0;
    public bonusMode: number = 0; 
    public featureSpinMode: number = 0; 

    private betSteps = [0.10, 0.20, 0.40, 0.60, 0.80, 1.00, 1.20, 1.40, 1.60, 1.80, 2.00, 3.00, 4.00, 5.00, 6.00, 7.00, 8.00, 10.00, 15.00, 20.00, 25.00, 30.00, 35.00, 40.00, 45.00, 50.00, 75.00, 100.00];

    constructor() {
        this.resetGoldenSquares();
        this.generateGrid();
    }

    public resetGoldenSquares() {
        this.goldenSquares = Array.from({ length: GAME_CONFIG.COLS }, () => Array(GAME_CONFIG.ROWS).fill(false));
        this.coinValues = Array.from({ length: GAME_CONFIG.COLS }, () => Array(GAME_CONFIG.ROWS).fill(null));
        this.potCollected = Array.from({ length: GAME_CONFIG.COLS }, () => Array(GAME_CONFIG.ROWS).fill(false));
    }

    public changeBet(direction: 1 | -1) {
        const index = this.betSteps.indexOf(this.currentBet);
        let newIndex = index + direction;
        if (newIndex < 0) newIndex = 0;
        if (newIndex >= this.betSteps.length) newIndex = this.betSteps.length - 1;
        this.currentBet = this.betSteps[newIndex];
    }

    public toggleFeatureSpins(mode: number) {
        if (this.featureSpinMode === mode) {
            this.featureSpinMode = 0; 
        } else {
            this.featureSpinMode = mode;
        }
    }

    public buyBonusSpin(type: number): boolean {
        let cost = type === 1 ? this.currentBet * 100 : this.currentBet * 250;
        if (this.balance < cost) return false;
        
        this.balance = parseFloat((this.balance - cost).toFixed(2));
        this.currentWin = 0;
        this.bonusMode = 0; 
        this.totalBonusWin = 0;
        this.freeSpins = 0;
        this.resetGoldenSquares();
        
        this.generateGrid();
        
        const fsCount = type === 1 ? 3 : 4;
        
        // Вибираємо випадкові унікальні стовпчики, щоб в 1 стовпчик ніколи не упало 2 скатери
        const availableCols = Array.from({ length: GAME_CONFIG.COLS }, (_, i) => i);
        availableCols.sort(() => Math.random() - 0.5);

        for (let i = 0; i < fsCount && i < availableCols.length; i++) {
            const col = availableCols[i];
            const row = Math.floor(Math.random() * GAME_CONFIG.ROWS);
            
            // Гарантовано ставимо по 1 скатеру на вибраний унікальний стовпчик
            this.gridState[col][row] = 'FS';
        }

        return true;
    }

    public spin(): boolean {
        let cost = this.currentBet;
        if (this.featureSpinMode === 1) cost = this.currentBet * 3;
        if (this.featureSpinMode === 2) cost = this.currentBet * 50;

        if (this.freeSpins > 0) cost = 0; 

        if (this.balance < cost) return false;

        if (this.freeSpins === 0) {
            this.balance = parseFloat((this.balance - cost).toFixed(2));
            this.currentWin = 0;
            this.bonusMode = 0;
            this.totalBonusWin = 0;
            this.resetGoldenSquares(); 
        } else {
            this.freeSpins--;
            this.currentWin = 0;
        }
        
        this.generateGrid();
        return true;
    }

    private getRandomSymbolId(): string {
        const totalWeight = GAME_CONFIG.SYMBOLS.reduce((sum, sym) => {
            let weight = sym.weight;
            if (sym.id === 'FS' && this.featureSpinMode === 1) weight *= 5; 
            return sum + weight;
        }, 0);

        let randomNum = Math.random() * totalWeight;
        for (const sym of GAME_CONFIG.SYMBOLS) {
            let weight = sym.id === 'FS' && this.featureSpinMode === 1 ? sym.weight * 5 : sym.weight;
            if (randomNum < weight) return sym.id;
            randomNum -= weight;
        }
        return GAME_CONFIG.SYMBOLS[0].id;
    }

    private countSymbolOnGrid(symbolId: string): number {
        let count = 0;
        for (let col = 0; col < this.gridState.length; col++) {
            if (!this.gridState[col]) continue;
            for (let row = 0; row < this.gridState[col].length; row++) {
                if (this.gridState[col][row] === symbolId) count++;
            }
        }
        return count;
    }

    private generateGrid() {
        this.gridState = [];
        let rainbowGenerated = false;

        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            const column: string[] = [];
            let colHasSpecial = false; // Рівно 1 спецсимвол (FS або veselka) на 1 стовпчик

            for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                let sym = this.getRandomSymbolId();

                // Якщо на всій сітці ВЖЕ є 1 сонце (veselka), забороняємо випадіння нових
                if (sym === 'veselka' && rainbowGenerated) {
                    sym = '10';
                }

                if (sym === 'FS' || sym === 'veselka') {
                    if (colHasSpecial) {
                        sym = '10'; // Якщо в цьому стовпчику вже є спецсимвол, замінюємо на звичайний
                    } else {
                        colHasSpecial = true;
                    }
                }

                if (sym === 'veselka') {
                    rainbowGenerated = true;
                }
                
                column.push(sym);
            }
            this.gridState.push(column);
        }

        const needsRainbow = this.bonusMode === 3 || (this.featureSpinMode === 2 && this.freeSpins === 0);
        if (needsRainbow && !rainbowGenerated) {
            const rCol = Math.floor(Math.random() * GAME_CONFIG.COLS);
            const rRow = Math.floor(Math.random() * GAME_CONFIG.ROWS);
            this.gridState[rCol][rRow] = 'veselka';
        }
    }

    public findClusters(): { col: number, row: number }[][] {
        const clusters: { col: number, row: number }[][] = [];
        const visited = Array.from({ length: GAME_CONFIG.COLS }, () => Array(GAME_CONFIG.ROWS).fill(false));

        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                const targetSymbol = this.gridState[col][row];
                if (targetSymbol === 'FS' || targetSymbol === 'veselka' || targetSymbol === 'wild' || visited[col][row] || targetSymbol === '') continue;

                const currentCluster: { col: number, row: number }[] = [];
                const wildVisited = new Set<string>(); 

                const dfs = (c: number, r: number, symbol: string) => {
                    if (c < 0 || c >= GAME_CONFIG.COLS || r < 0 || r >= GAME_CONFIG.ROWS) return;
                    const currentSym = this.gridState[c][r];
                    if (currentSym !== symbol && currentSym !== 'wild') return;

                    if (currentSym === 'wild') {
                        if (wildVisited.has(`${c},${r}`)) return;
                        wildVisited.add(`${c},${r}`);
                    } else {
                        if (visited[c][r]) return;
                        visited[c][r] = true;
                    }
                    currentCluster.push({ col: c, row: r });
                    dfs(c + 1, r, symbol); dfs(c - 1, r, symbol); dfs(c, r + 1, symbol); dfs(c, r - 1, symbol);
                };

                dfs(col, row, targetSymbol);
                if (currentCluster.length >= 5) clusters.push(currentCluster);
            }
        }
        return clusters;
    }

    public processCascade(clusters: { col: number, row: number }[][]) {
        const removedPositionsGlobal = new Set<string>();
        const winEvents: {
            positions: { col: number, row: number, isWinner: boolean }[],
            clusterCenter: { col: number, row: number }[],
            winAmount: number,
            symbol: string
        }[] = [];

        // ВАЖЛИВО: групуємо кластери по типу символу. Якщо на полі трапляються
        // ДВА окремі непов'язані кластери одного й того ж символу (рідкісний,
        // але можливий випадок), вони раніше рахувались як 2 окремі виграші і
        // ПЛАТИЛИ ДВІЧІ за один і той самий тип, хоча символи фізично зникають
        // одним "змахом" (правило "matching types visible on reels will vanish").
        // Тепер на символ - лише ОДНА подія, розмір виплати - по найбільшому кластеру.
        const groups = new Map<string, { col: number, row: number }[][]>();
        clusters.forEach(cluster => {
            const targetPos = cluster.find(pos => this.gridState[pos.col][pos.row] !== 'wild');
            if (!targetPos) return; // кластер із самих вайлдів без жодного реального символу не платить
            const symbol = this.gridState[targetPos.col][targetPos.row];
            if (!groups.has(symbol)) groups.set(symbol, []);
            groups.get(symbol)!.push(cluster);
        });

        groups.forEach((symbolClusters, targetSymbol) => {
            const biggestCluster = symbolClusters.reduce((a, b) => a.length >= b.length ? a : b);
            const winAmount = parseFloat((GAME_CONFIG.getMultiplier(targetSymbol, biggestCluster.length) * this.currentBet).toFixed(2));

            // Клітинки, що ДІЙСНО були частиною виграшного кластера (для яскравої анімації)
            const winnerPositionsSet = new Set<string>();
            symbolClusters.forEach(cl => cl.forEach(pos => winnerPositionsSet.add(`${pos.col},${pos.row}`)));

            const symbolsToRemoveForThisEvent: { col: number, row: number, isWinner: boolean }[] = [];

            // Прибираємо АБСОЛЮТНО всі символи цього типу на полі (навіть ті, що поза кластером)
            for (let c = 0; c < GAME_CONFIG.COLS; c++) {
                for (let r = 0; r < GAME_CONFIG.ROWS; r++) {
                    if (this.gridState[c][r] === targetSymbol && !removedPositionsGlobal.has(`${c},${r}`)) {
                        symbolsToRemoveForThisEvent.push({ col: c, row: r, isWinner: winnerPositionsSet.has(`${c},${r}`) });
                        removedPositionsGlobal.add(`${c},${r}`);
                    }
                }
            }

            // Вайлди, що входили до кластера, теж мають зникнути і підсвітитись як переможні
            symbolClusters.forEach(cl => cl.forEach(pos => {
                const key = `${pos.col},${pos.row}`;
                if (!removedPositionsGlobal.has(key)) {
                    symbolsToRemoveForThisEvent.push({ col: pos.col, row: pos.row, isWinner: true });
                    removedPositionsGlobal.add(key);
                }
                this.goldenSquares[pos.col][pos.row] = true;
            }));

            if (winAmount > 0) {
                winEvents.push({ positions: symbolsToRemoveForThisEvent, clusterCenter: biggestCluster, winAmount, symbol: targetSymbol });
                this.currentWin = parseFloat((this.currentWin + winAmount).toFixed(2));
                if (this.bonusMode > 0) this.totalBonusWin = parseFloat((this.totalBonusWin + winAmount).toFixed(2));
                this.balance = parseFloat((this.balance + winAmount).toFixed(2));
            }
        });

        removedPositionsGlobal.forEach(posStr => {
            const [c, r] = posStr.split(',').map(Number);
            this.gridState[c][r] = ''; 
        });

        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            const remaining = [];
            for (let row = GAME_CONFIG.ROWS - 1; row >= 0; row--) {
                if (this.gridState[col][row] !== '') remaining.push(this.gridState[col][row]);
            }
            for (let row = GAME_CONFIG.ROWS - 1; row >= 0; row--) {
                if (remaining.length > 0) {
                    this.gridState[col][row] = remaining.shift()!;
                } else {
                    let newSym = this.getRandomSymbolId();
                    // Контроль при каскадному падінні: максимум 1 сонце на полі
                    if (newSym === 'veselka' && this.countSymbolOnGrid('veselka') >= 1) {
                        newSym = '10';
                    }
                    this.gridState[col][row] = newSym;
                }
            }
        }
        return { winEvents, newState: this.gridState };
    }


    public hasPendingRainbow(): boolean {
        let hasGolden = false;
        let hasRainbow = false;
        for (let c = 0; c < GAME_CONFIG.COLS; c++) {
            for (let r = 0; r < GAME_CONFIG.ROWS; r++) {
                if (this.goldenSquares[c][r] && this.gridState[c][r] !== 'gorshok' && this.gridState[c][r] !== 'klever') hasGolden = true;
                if (this.gridState[c][r] === 'veselka') hasRainbow = true;
            }
        }
        return hasGolden && hasRainbow;
    }

    public getRainbowPosition() {
        for (let c = 0; c < GAME_CONFIG.COLS; c++) {
            for (let r = 0; r < GAME_CONFIG.ROWS; r++) {
                if (this.gridState[c][r] === 'veselka') return { col: c, row: r };
            }
        }
        return null;
    }

    public processRainbowReveal() {
        const revealedPositions: {col: number, row: number, type: string, value: number}[] = [];

        for (let c = 0; c < GAME_CONFIG.COLS; c++) {
            for (let r = 0; r < GAME_CONFIG.ROWS; r++) {
                if (this.goldenSquares[c][r] && this.gridState[c][r] !== 'gorshok' && this.gridState[c][r] !== 'klever') {
                    const rand = Math.random();
                    let type = '';
                    let value = 0;

                    // ЙМОВІРНІСТЬ ВИПАДАННЯ ГОРЩИКІВ (5%) ТА КОНЮШИНИ/СОНЦЯ (5%)
                    if (rand < 0.05) { 
                        type = 'gorshok'; 
                    } 
                    else if (rand < 0.10) { 
                        type = 'klever'; 
                        value = GAME_CONFIG.RAINBOW_VALUES.CLOVER[Math.floor(Math.random() * GAME_CONFIG.RAINBOW_VALUES.CLOVER.length)]; 
                    } 
                    else if (rand < 0.25) { 
                        type = 'gold'; 
                        value = GAME_CONFIG.RAINBOW_VALUES.GOLD[Math.floor(Math.random() * GAME_CONFIG.RAINBOW_VALUES.GOLD.length)]; 
                    } 
                    else if (rand < 0.60) { 
                        type = 'silver'; 
                        value = GAME_CONFIG.RAINBOW_VALUES.SILVER[Math.floor(Math.random() * GAME_CONFIG.RAINBOW_VALUES.SILVER.length)]; 
                    } 
                    else { 
                        type = 'bronz'; 
                        value = GAME_CONFIG.RAINBOW_VALUES.BRONZE[Math.floor(Math.random() * GAME_CONFIG.RAINBOW_VALUES.BRONZE.length)]; 
                    }

                    this.gridState[c][r] = type;
                    this.coinValues[c][r] = value;
                    revealedPositions.push({ col: c, row: r, type, value });
                }
            }
        }
        return { newState: this.gridState, revealedPositions };
    }

    // --- ДИНАМІЧНА ЕВОЛЮЦІЯ МОНЕТ ---
    // Визначає новий "колір"/тип монети виходячи з її поточної (помноженої) суми:
    // 1-4 = бронза, 5-24 = срібло, 25+ = золото.
    private getCoinTypeForValue(value: number): 'bronz' | 'silver' | 'gold' {
        if (value >= 25) return 'gold';
        if (value >= 5) return 'silver';
        return 'bronz';
    }

    public applyClovers() {
        const actions: { clover: any, multipliedCoins: any[] }[] = [];
        for (let c = 0; c < GAME_CONFIG.COLS; c++) {
            for (let r = 0; r < GAME_CONFIG.ROWS; r++) {
                if (this.gridState[c][r] === 'klever') {
                    const multiplier = this.coinValues[c][r] || 2;
                    const affected: any[] = [];
                    
                    // Усі 8 напрямків (боки та кути) для сонечка/конюшини
                    const dirs = [
                        [-1, 0], [1, 0], [0, -1], [0, 1],
                        [-1, -1], [-1, 1], [1, -1], [1, 1]
                    ];
                    
                    dirs.forEach(([dc, dr]) => {
                        const nc = c + dc, nr = r + dr;
                        if (nc >= 0 && nc < GAME_CONFIG.COLS && nr >= 0 && nr < GAME_CONFIG.ROWS) {
                            const targetSym = this.gridState[nc][nr];
                            // Множимо ТІЛЬКИ якщо клітинка ЖОВТА (золотий квадрат)
                            if (this.goldenSquares[nc][nr] && ['bronz', 'silver', 'gold', 'gorshok'].includes(targetSym)) {
                                const val = this.coinValues[nc][nr] || 0;
                                if (val > 0) {
                                    const newVal = parseFloat((val * multiplier).toFixed(2));
                                    this.coinValues[nc][nr] = newVal;

                                    // Казанок (gorshok) не має "кольору" монети - лишається казанком.
                                    // А от бронза/срібло/золото можуть "еволюціонувати" по нашій новій сумі.
                                    let newType: 'bronz' | 'silver' | 'gold' | null = null;
                                    if (targetSym !== 'gorshok') {
                                        newType = this.getCoinTypeForValue(newVal);
                                        this.gridState[nc][nr] = newType;
                                    }

                                    affected.push({ col: nc, row: nr, newVal, newType });
                                }
                            }
                        }
                    });
                    actions.push({ clover: { col: c, row: r }, multipliedCoins: affected });
                }
            }
        }
        return actions;
    }

    // --- ПОСЛІДОВНИЙ ЗБІР КАЗАНКІВ (справжній каскад) ---
    // Обробляє РІВНО ОДИН "новий" (ще не активований) казанок за виклик:
    // - Він забирає всі поточні монети на полі ПЛЮС суму з уже активного казанка (якщо такий є).
    // - Активний казанок після цього зникає, звільняючи місце.
    // - Викликач (main.ts) має після цього викликати fillInnerCascade() для звільнених клітинок,
    //   застосувати конюшини ще раз, а потім знову викликати collectPots() - і так по колу,
    //   доки не залишиться лише один фінальний казанок.
    public collectPots() {
        let activePot: { col: number, row: number } | null = null;
        const newPots: { col: number, row: number }[] = [];
        const coins: { col: number, row: number }[] = [];

        for (let c = 0; c < GAME_CONFIG.COLS; c++) {
            for (let r = 0; r < GAME_CONFIG.ROWS; r++) {
                const sym = this.gridState[c][r];
                if (sym === 'gorshok') {
                    if (this.potCollected[c][r]) {
                        activePot = { col: c, row: r }; // вже накопичує суму
                    } else {
                        newPots.push({ col: c, row: r }); // ще не активований
                    }
                } else if (['bronz', 'silver', 'gold', 'klever'].includes(sym)) {
                    coins.push({ col: c, row: r });
                }
            }
        }

        newPots.sort((a, b) => a.row === b.row ? a.col - b.col : a.row - b.row);

        if (newPots.length === 0) {
            return { events: [] as any[], collectedSomething: false, clearedForCascade: [] as { col: number, row: number }[] };
        }

        // Беремо тільки ПЕРШИЙ (найвищий/найлівіший) новий казанок за цей виклик
        const pot = newPots[0];
        const sources = [...coins];
        if (activePot) sources.push(activePot); // всмоктуємо суму попереднього казанка

        let sum = 0;
        sources.forEach(src => { sum += (this.coinValues[src.col][src.row] || 0); });

        this.coinValues[pot.col][pot.row] = parseFloat(sum.toFixed(2));
        this.potCollected[pot.col][pot.row] = true;

        const clearedForCascade: { col: number, row: number }[] = [];

        coins.forEach(c => {
            this.gridState[c.col][c.row] = '';
            this.coinValues[c.col][c.row] = null;
            clearedForCascade.push(c);
        });

        if (activePot) {
            this.gridState[activePot.col][activePot.row] = '';
            this.coinValues[activePot.col][activePot.row] = null;
            this.potCollected[activePot.col][activePot.row] = false;
            clearedForCascade.push(activePot);
        }

        const event = { pot, sources, newPotValue: this.coinValues[pot.col][pot.row], consumedPot: activePot };

        return { events: [event], collectedSomething: true, clearedForCascade };
    }

    // Внутрішній каскад: заповнює щойно звільнені (золоті) клітинки новими символами -
    // монетами чи конюшиною (казанки навмисно виключені, щоб уникнути нескінченного ланцюга).
    public fillInnerCascade(positions: { col: number, row: number }[]) {
        const revealed: { col: number, row: number, type: string, value: number }[] = [];

        positions.forEach(({ col: c, row: r }) => {
            if (!this.goldenSquares[c][r]) return; // заповнюємо лише золоті квадрати

            const rand = Math.random();
            let type = '';
            let value = 0;

            if (rand < 0.05) {
                type = 'klever';
                value = GAME_CONFIG.RAINBOW_VALUES.CLOVER[Math.floor(Math.random() * GAME_CONFIG.RAINBOW_VALUES.CLOVER.length)];
            } else if (rand < 0.25) {
                type = 'gold';
                value = GAME_CONFIG.RAINBOW_VALUES.GOLD[Math.floor(Math.random() * GAME_CONFIG.RAINBOW_VALUES.GOLD.length)];
            } else if (rand < 0.62) {
                type = 'silver';
                value = GAME_CONFIG.RAINBOW_VALUES.SILVER[Math.floor(Math.random() * GAME_CONFIG.RAINBOW_VALUES.SILVER.length)];
            } else {
                type = 'bronz';
                value = GAME_CONFIG.RAINBOW_VALUES.BRONZE[Math.floor(Math.random() * GAME_CONFIG.RAINBOW_VALUES.BRONZE.length)];
            }

            this.gridState[c][r] = type;
            this.coinValues[c][r] = value;
            revealed.push({ col: c, row: r, type, value });
        });

        return revealed;
    }

    public endRainbowPhase() {
        let totalMultiplier = 0;
        const clearedPositions: {col: number, row: number}[] = [];

        for (let c = 0; c < GAME_CONFIG.COLS; c++) {
            for (let r = 0; r < GAME_CONFIG.ROWS; r++) {
                if (this.goldenSquares[c][r] || this.gridState[c][r] === 'veselka') {
                    if (this.coinValues[c][r] !== null && this.gridState[c][r] !== 'klever') {
                        totalMultiplier += this.coinValues[c][r]!;
                    }
                    clearedPositions.push({ col: c, row: r });
                    
                    if (this.bonusMode === 0 || this.bonusMode === 1) {
                        this.goldenSquares[c][r] = false;
                    }

                    this.gridState[c][r] = '';
                    this.coinValues[c][r] = null;
                    this.potCollected[c][r] = false;
                }
            }
        }

        const winAmount = parseFloat((totalMultiplier * this.currentBet).toFixed(2));
        this.currentWin = parseFloat((this.currentWin + winAmount).toFixed(2));
        if (this.bonusMode > 0) this.totalBonusWin = parseFloat((this.totalBonusWin + winAmount).toFixed(2));
        this.balance = parseFloat((this.balance + winAmount).toFixed(2));
        
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            const remaining = [];
            for (let row = GAME_CONFIG.ROWS - 1; row >= 0; row--) {
                if (this.gridState[col][row] !== '') remaining.push(this.gridState[col][row]);
            }
            for (let row = GAME_CONFIG.ROWS - 1; row >= 0; row--) {
                if (remaining.length > 0) {
                    this.gridState[col][row] = remaining.shift()!;
                } else {
                    let newSym = this.getRandomSymbolId();
                    if (newSym === 'veselka' && this.countSymbolOnGrid('veselka') >= 1) {
                        newSym = '10';
                    }
                    this.gridState[col][row] = newSym;
                }
            }
        }
        return { newState: this.gridState, winAmount, clearedPositions };
    }

    public checkScatters(): { triggered: boolean, message: string } {
        let fsCount = 0;
        for (let c = 0; c < GAME_CONFIG.COLS; c++) {
            for (let r = 0; r < GAME_CONFIG.ROWS; r++) {
                if (this.gridState[c][r] === 'FS') {
                    fsCount++;
                    this.gridState[c][r] = '';
                }
            }
        }

        if (fsCount === 0) return { triggered: false, message: '' };

        if (this.bonusMode === 0) {
            if (fsCount >= 5) { this.bonusMode = 3; this.freeSpins = 12; return { triggered: true, message: "TREASURE AT RAINBOW'S END!\n12 FREE SPINS" }; }
            if (fsCount === 4) { this.bonusMode = 2; this.freeSpins = 12; return { triggered: true, message: "ALL THAT GLITTERS IS GOLD!\n12 FREE SPINS" }; }
            if (fsCount === 3) { this.bonusMode = 1; this.freeSpins = 8; return { triggered: true, message: "LUCK OF THE BANDIT!\n8 FREE SPINS" }; }
        } else {
            if (fsCount === 2) { this.freeSpins += 2; return { triggered: true, message: "+2 FREE SPINS!" }; }
            if (fsCount === 3) { this.freeSpins += 3; return { triggered: true, message: "+3 FREE SPINS!" }; }
            if (fsCount >= 4 && this.bonusMode === 1) { 
                this.bonusMode = 2; 
                this.freeSpins += 4; 
                return { triggered: true, message: "UPGRADED: GLITTERS IS GOLD!\n+4 FREE SPINS" }; 
            }
        }
        return { triggered: false, message: '' };
    }
}