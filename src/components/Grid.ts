import { Container, Graphics, Sprite, Assets, Text, TextStyle } from 'pixi.js';
import { GAME_CONFIG } from '../constants';
import gsap from 'gsap';

const formatValue = (v: number) => Number.isInteger(v) ? v.toString() : v.toFixed(2).replace(/\.?0+$/, '');

export class Grid extends Container {
    private symbols: any[][] = [];
    private coinTexts: Text[][] = []; 
    private cellBackgrounds: Graphics[][] = [];
    private bgContainer = new Container();
    private symbolsContainer = new Container();

    constructor() {
        super();
        this.buildCells();
    }

    private buildCells() {
        const boardWidth = GAME_CONFIG.COLS * GAME_CONFIG.SYMBOL_SIZE + (GAME_CONFIG.COLS + 1) * GAME_CONFIG.GAP;
        const boardHeight = GAME_CONFIG.ROWS * GAME_CONFIG.SYMBOL_SIZE + (GAME_CONFIG.ROWS + 1) * GAME_CONFIG.GAP;
        
        const frame = new Graphics();
        frame.roundRect(0, 0, boardWidth, boardHeight, 15);
        frame.fill(GAME_CONFIG.COLORS.BOARD_BG);
        frame.stroke({ width: 4, color: GAME_CONFIG.COLORS.BOARD_BORDER });
        this.addChild(frame);
        this.addChild(this.bgContainer);

        const mask = new Graphics();
        mask.roundRect(0, 0, boardWidth, boardHeight, 15);
        mask.fill(0xffffff);
        this.addChild(mask);
        
        this.symbolsContainer.mask = mask;
        this.addChild(this.symbolsContainer);

        const coinTextStyle = new TextStyle({
            fontFamily: 'Arial', fontSize: 40, fill: 0xffffff, fontWeight: 'bold',
            stroke: { color: 0x000000, width: 6, join: 'round' }
        });

        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            this.symbols[col] = [];
            this.coinTexts[col] = [];
            this.cellBackgrounds[col] = [];
            
            for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                const xPos = GAME_CONFIG.GAP + col * (GAME_CONFIG.SYMBOL_SIZE + GAME_CONFIG.GAP);
                const yPos = GAME_CONFIG.GAP + row * (GAME_CONFIG.SYMBOL_SIZE + GAME_CONFIG.GAP);

                const cellBg = new Graphics();
                cellBg.roundRect(0, 0, GAME_CONFIG.SYMBOL_SIZE, GAME_CONFIG.SYMBOL_SIZE, 10);
                cellBg.fill(GAME_CONFIG.COLORS.CELL_BG);
                cellBg.x = xPos;
                cellBg.y = yPos;
                this.cellBackgrounds[col][row] = cellBg;
                this.bgContainer.addChild(cellBg);

                const spriteContainer = new Container();
                spriteContainer.x = xPos + GAME_CONFIG.SYMBOL_SIZE / 2;
                spriteContainer.y = yPos + GAME_CONFIG.SYMBOL_SIZE / 2;

                const sprite = new Sprite();
                sprite.anchor.set(0.5);
                sprite.width = GAME_CONFIG.SYMBOL_SIZE * 0.85;
                sprite.height = GAME_CONFIG.SYMBOL_SIZE * 0.85;
                
                const text = new Text({ text: '', style: coinTextStyle });
                text.anchor.set(0.5);
                text.y = 20; 
                text.alpha = 0;

                spriteContainer.addChild(sprite, text);
                this.symbolsContainer.addChild(spriteContainer);

                this.symbols[col][row] = spriteContainer; 
                (this.symbols[col][row] as any).sprite = sprite;
                this.coinTexts[col][row] = text;
            }
        }
    }

    private updateSpriteTexture(col: number, row: number, symbolId: string) {
        if (!symbolId) return;
        const symbolConfig = GAME_CONFIG.SYMBOLS.find(s => s.id === symbolId);
        if (symbolConfig) {
            (this.symbols[col][row] as any).sprite.texture = Assets.get(symbolConfig.view);
        }
    }

    public populateInitial(gridState: string[][]) {
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                this.updateSpriteTexture(col, row, gridState[col][row]);
                this.symbols[col][row].scale.set(1); 
                this.symbols[col][row].alpha = 1;
                this.coinTexts[col][row].alpha = 0; 
                this.cellBackgrounds[col][row].clear();
                this.cellBackgrounds[col][row].roundRect(0, 0, GAME_CONFIG.SYMBOL_SIZE, GAME_CONFIG.SYMBOL_SIZE, 10);
                this.cellBackgrounds[col][row].fill(GAME_CONFIG.COLORS.CELL_BG);
            }
        }
    }

    public syncGoldenSquares(goldenSquares: boolean[][]) {
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                const cellBg = this.cellBackgrounds[col][row];
                cellBg.clear();
                cellBg.roundRect(0, 0, GAME_CONFIG.SYMBOL_SIZE, GAME_CONFIG.SYMBOL_SIZE, 10);
                if (goldenSquares[col][row]) {
                    cellBg.fill(0xf1c40f); 
                    cellBg.stroke({ width: 3, color: 0xe67e22 });
                } else {
                    cellBg.fill(GAME_CONFIG.COLORS.CELL_BG);
                }
            }
        }
    }

    public async animateSpin(newGridState: string[][]): Promise<void> {
        return new Promise(resolve => {
            // ФІКС: Більше НЕ стираємо золоті квадрати на старті спіну! 
            let completedCols = 0;
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                    const symbol = this.symbols[col][row];
                    const finalY = GAME_CONFIG.GAP + row * (GAME_CONFIG.SYMBOL_SIZE + GAME_CONFIG.GAP) + GAME_CONFIG.SYMBOL_SIZE / 2;
                    gsap.to(symbol, {
                        y: finalY + 800, duration: 0.25, delay: col * 0.1, ease: "power1.in",
                        onComplete: () => {
                            this.updateSpriteTexture(col, row, newGridState[col][row]);
                            symbol.y = finalY - 800; 
                            gsap.to(symbol, {
                                y: finalY, duration: 0.35, ease: "back.out(1.2)",
                                onComplete: () => {
                                    if (row === GAME_CONFIG.ROWS - 1) {
                                        completedCols++;
                                        if (completedCols === GAME_CONFIG.COLS) resolve();
                                    }
                                }
                            });
                        }
                    });
                }
            }
        });
    }

    public async animateSequentialCascade(winEvents: any[], newGridState: string[][]): Promise<void> {
        if (winEvents.length === 0) {
            await this.dropCascadedSymbols(newGridState);
            return;
        }

        for (const event of winEvents) {
            await new Promise<void>(resolve => {
                let sumX = 0, sumY = 0;
                event.clusterCenter.forEach((pos: any) => {
                    sumX += GAME_CONFIG.GAP + pos.col * (GAME_CONFIG.SYMBOL_SIZE + GAME_CONFIG.GAP) + GAME_CONFIG.SYMBOL_SIZE / 2;
                    sumY += GAME_CONFIG.GAP + pos.row * (GAME_CONFIG.SYMBOL_SIZE + GAME_CONFIG.GAP) + GAME_CONFIG.SYMBOL_SIZE / 2;
                });
                
                const winText = new Text({ text: `€${event.winAmount.toFixed(2)}`, style: new TextStyle({ fontFamily: 'Arial', fontSize: 75, fill: 0xf1c40f, fontWeight: 'bold', stroke: { color: 0x000000, width: 9, join: 'round' }}) });
                winText.anchor.set(0.5);
                winText.position.set(sumX / event.clusterCenter.length, sumY / event.clusterCenter.length);
                winText.scale.set(0); 
                this.addChild(winText);

                gsap.to(winText.scale, { x: 1, y: 1, duration: 0.3, ease: "back.out(1.5)" });
                gsap.to(winText, { y: winText.y - 120, duration: 0.9, ease: "power2.out" }); 
                gsap.to(winText, { alpha: 0, duration: 0.3, delay: 0.6, onComplete: () => winText.destroy() });

                let symbolsToPop = event.positions.length;
                if (symbolsToPop === 0) return resolve();

                event.positions.forEach((pos: any) => {
                    const symbol = this.symbols[pos.col][pos.row];
                    gsap.to(symbol, { alpha: 0, duration: 0.15, yoyo: true, repeat: 3, onComplete: () => {
                        gsap.to(symbol.scale, { x: 0, y: 0, duration: 0.25 }); 
                        gsap.to(symbol, { alpha: 0, duration: 0.25, onComplete: () => {
                            symbolsToPop--;
                            if (symbolsToPop === 0) setTimeout(resolve, 250);
                        }});
                    }});
                });
            });
        }
        await this.dropCascadedSymbols(newGridState);
    }

    public async hideRainbowSymbols(clearedPositions: {col: number, row: number}[]): Promise<void> {
        return new Promise(resolve => {
            if (clearedPositions.length === 0) return resolve();
            let animationsLeft = clearedPositions.length;

            clearedPositions.forEach(pos => {
                const container = this.symbols[pos.col][pos.row];
                const text = this.coinTexts[pos.col][pos.row];

                gsap.killTweensOf(container); 
                gsap.killTweensOf(container.scale);
                gsap.killTweensOf(text);

                gsap.to(text, { alpha: 0, duration: 0.2 });
                gsap.to(container.scale, { x: 0, y: 0, duration: 0.3, ease: "back.in(1.2)", onComplete: () => {
                    container.alpha = 0; 
                    animationsLeft--;
                    if (animationsLeft === 0) resolve();
                }});
            });
        });
    }

    public async dropCascadedSymbols(newGridState: string[][]): Promise<void> {
        return new Promise(resolve => {
            let colsCompleted = 0;
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                const surviving = [];
                const destroyed = [];

                for (let row = GAME_CONFIG.ROWS - 1; row >= 0; row--) {
                    const container = this.symbols[col][row];
                    if (container.alpha > 0 && container.scale.x > 0) surviving.push(container);
                    else destroyed.push(container);
                }

                const newCol = [...surviving, ...destroyed]; 
                for (let row = GAME_CONFIG.ROWS - 1; row >= 0; row--) {
                    const container = newCol[GAME_CONFIG.ROWS - 1 - row];
                    this.symbols[col][row] = container; 
                    this.coinTexts[col][row] = container.getChildAt(1) as Text; 
                    this.updateSpriteTexture(col, row, newGridState[col][row]);
                    
                    const finalX = GAME_CONFIG.GAP + col * (GAME_CONFIG.SYMBOL_SIZE + GAME_CONFIG.GAP) + GAME_CONFIG.SYMBOL_SIZE / 2;
                    const finalY = GAME_CONFIG.GAP + row * (GAME_CONFIG.SYMBOL_SIZE + GAME_CONFIG.GAP) + GAME_CONFIG.SYMBOL_SIZE / 2;
                    container.x = finalX;

                    const isNewSymbol = destroyed.includes(container);
                    if (isNewSymbol) {
                        container.y = finalY - (GAME_CONFIG.ROWS * GAME_CONFIG.SYMBOL_SIZE) - 200;
                        container.scale.set(1);
                        container.alpha = 1; 
                        this.coinTexts[col][row].alpha = 0; 
                    }

                    gsap.to(container, {
                        y: finalY, duration: 0.4, delay: isNewSymbol ? 0.2 + (GAME_CONFIG.ROWS - 1 - row) * 0.05 : 0, 
                        ease: "bounce.out",
                        onComplete: () => {
                            if (row === 0) {
                                colsCompleted++;
                                if (colsCompleted === GAME_CONFIG.COLS) resolve();
                            }
                        }
                    });
                }
            }
        });
    }

    public async showPopupMessage(msg: string): Promise<void> {
        return new Promise(resolve => {
            const centerX = (GAME_CONFIG.COLS * GAME_CONFIG.SYMBOL_SIZE + (GAME_CONFIG.COLS + 1) * GAME_CONFIG.GAP) / 2;
            const centerY = (GAME_CONFIG.ROWS * GAME_CONFIG.SYMBOL_SIZE + (GAME_CONFIG.ROWS + 1) * GAME_CONFIG.GAP) / 2;

            const text = new Text({
                text: msg,
                style: new TextStyle({
                    fontFamily: 'Arial', fontSize: 60, fill: 0x2ecc71, fontWeight: 'bold', align: 'center',
                    stroke: { color: 0x000000, width: 8, join: 'round' },
                    dropShadow: { alpha: 0.8, angle: Math.PI / 4, blur: 10, color: 0x000000, distance: 5 }
                })
            });
            text.anchor.set(0.5);
            text.position.set(centerX, centerY);
            text.scale.set(0);
            this.addChild(text);

            gsap.to(text.scale, { x: 1, y: 1, duration: 0.5, ease: "back.out(1.5)" });
            gsap.to(text, {
                y: text.y - 100, duration: 2.0, ease: "power1.inOut",
                onComplete: () => {
                    gsap.to(text, { alpha: 0, duration: 0.3, onComplete: () => {
                        text.destroy();
                        resolve();
                    }});
                }
            });
        });
    }

    public async showTotalPhaseWin(amount: number): Promise<void> {
        return new Promise(resolve => {
            if (amount <= 0) return resolve();
            const centerX = (GAME_CONFIG.COLS * GAME_CONFIG.SYMBOL_SIZE + (GAME_CONFIG.COLS + 1) * GAME_CONFIG.GAP) / 2;
            const centerY = (GAME_CONFIG.ROWS * GAME_CONFIG.SYMBOL_SIZE + (GAME_CONFIG.ROWS + 1) * GAME_CONFIG.GAP) / 2;

            const winText = new Text({
                text: `RAINBOW WIN\n€${amount.toFixed(2)}`,
                style: new TextStyle({
                    fontFamily: 'Arial', fontSize: 90, fill: 0xf1c40f, fontWeight: 'bold', align: 'center',
                    stroke: { color: 0x000000, width: 12, join: 'round' },
                    dropShadow: { alpha: 0.6, angle: Math.PI / 4, blur: 15, color: 0x000000, distance: 10 }
                })
            });
            winText.anchor.set(0.5);
            winText.position.set(centerX, centerY);
            winText.scale.set(0);
            this.addChild(winText);

            gsap.to(winText.scale, { x: 1, y: 1, duration: 0.5, ease: "back.out(1.5)" });
            gsap.to(winText, {
                y: winText.y - 60, duration: 2.5, ease: "power1.inOut",
                onComplete: () => {
                    gsap.to(winText, { alpha: 0, duration: 0.4, onComplete: () => {
                        winText.destroy();
                        resolve();
                    }});
                }
            });
        });
    }

    public async animateRainbowTrigger(pos: {col: number, row: number}): Promise<void> {
        return new Promise(resolve => {
            const symbol = this.symbols[pos.col][pos.row];
            gsap.to(symbol.scale, { x: 1.5, y: 1.5, duration: 0.4, yoyo: true, repeat: 1 });
            gsap.to(symbol, { rotation: Math.PI * 2, duration: 0.8, onComplete: () => {
                symbol.rotation = 0;
                resolve();
            }});
        });
    }

    public async animateRainbowReveal(revealedPositions: any[]): Promise<void> {
        return new Promise(resolve => {
            if (revealedPositions.length === 0) return resolve();
            
            revealedPositions.sort((a, b) => a.row === b.row ? a.col - b.col : a.row - b.row);
            let animationsLeft = revealedPositions.length;

            revealedPositions.forEach(pos => {
                const container = this.symbols[pos.col][pos.row];
                const text = this.coinTexts[pos.col][pos.row];
                
                const finalX = GAME_CONFIG.GAP + pos.col * (GAME_CONFIG.SYMBOL_SIZE + GAME_CONFIG.GAP) + GAME_CONFIG.SYMBOL_SIZE / 2;
                const finalY = GAME_CONFIG.GAP + pos.row * (GAME_CONFIG.SYMBOL_SIZE + GAME_CONFIG.GAP) + GAME_CONFIG.SYMBOL_SIZE / 2;
                container.x = finalX;
                container.y = finalY;

                const dropDelay = pos.row * 0.1 + pos.col * 0.05;

                gsap.to(container.scale, {
                    x: 0, duration: 0.2, delay: dropDelay, ease: "power1.in",
                    onComplete: () => {
                        container.alpha = 1;
                        container.scale.y = 1;
                        this.updateSpriteTexture(pos.col, pos.row, pos.type);
                        
                        if (pos.type === 'gorshok') {
                            text.alpha = 0;
                            text.text = '';
                        } else if (pos.value > 0) {
                            text.text = pos.type === 'klever' ? `x${formatValue(pos.value)}` : formatValue(pos.value);
                            text.scale.set(1);
                            if (text.width > GAME_CONFIG.SYMBOL_SIZE * 0.75) {
                                text.width = GAME_CONFIG.SYMBOL_SIZE * 0.75;
                                text.scale.y = text.scale.x;
                            }
                            text.alpha = 1;
                        }

                        gsap.to(container.scale, {
                            x: 1, duration: 0.3, ease: "back.out(1.5)",
                            onComplete: () => {
                                animationsLeft--;
                                if (animationsLeft === 0) resolve();
                            }
                        });
                    }
                });
            });
        });
    }

    public async animateClovers(cloverActions: any[]): Promise<void> {
        for (const action of cloverActions) {
            await new Promise<void>(resolve => {
                const clover = this.symbols[action.clover.col][action.clover.row];
                gsap.to(clover.scale, { x: 1.3, y: 1.3, duration: 0.2, yoyo: true, repeat: 1, onComplete: () => {
                    if (action.multipliedCoins.length === 0) {
                        return setTimeout(resolve, 300);
                    }
                    let actionsLeft = action.multipliedCoins.length;
                    action.multipliedCoins.forEach((coin: any) => {
                        const text = this.coinTexts[coin.col][coin.row];
                        const coinSprite = this.symbols[coin.col][coin.row];
                        text.text = formatValue(coin.newVal);
                        
                        text.scale.set(1);
                        if (text.width > GAME_CONFIG.SYMBOL_SIZE * 0.75) {
                            text.width = GAME_CONFIG.SYMBOL_SIZE * 0.75;
                            text.scale.y = text.scale.x;
                        }

                        gsap.to(text.scale, { x: 1.5 * text.scale.x, y: 1.5 * text.scale.y, duration: 0.15, yoyo: true, repeat: 1 });
                        gsap.to(coinSprite.scale, { x: 1.2, y: 1.2, duration: 0.15, yoyo: true, repeat: 1, onComplete: () => {
                            actionsLeft--;
                            if (actionsLeft === 0) resolve();
                        }});
                    });
                }});
            });
            await new Promise(r => setTimeout(r, 200)); 
        }
    }

    public async animatePots(potData: any): Promise<void> {
        for (const event of potData.events) {
            await new Promise<void>(resolve => {
                const targetPot = this.symbols[event.pot.col][event.pot.row];
                const targetText = this.coinTexts[event.pot.col][event.pot.row];
                
                gsap.killTweensOf(targetPot.scale);
                gsap.to(targetPot.scale, { x: 1.25, y: 1.25, duration: 0.3, yoyo: true, repeat: -1 });

                if (event.sources.length === 0) {
                    gsap.killTweensOf(targetPot.scale);
                    gsap.to(targetPot.scale, { x: 1, y: 1, duration: 0.2, onComplete: () => resolve() });
                    return;
                }

                let animationsLeft = event.sources.length;
                event.sources.forEach((coin: any, index: number) => {
                    const coinContainer = this.symbols[coin.col][coin.row];
                    this.symbolsContainer.addChild(coinContainer); 

                    gsap.to(coinContainer, {
                        x: targetPot.x, y: targetPot.y, scaleX: 0.2, scaleY: 0.2, alpha: 0,
                        duration: 0.5, delay: index * 0.1, ease: "power2.in",
                        onComplete: () => {
                            animationsLeft--;
                            if (animationsLeft === 0) {
                                gsap.killTweensOf(targetPot.scale); 
                                gsap.to(targetPot.scale, { x: 1.4, y: 1.4, duration: 0.15, yoyo: true, repeat: 1, onComplete: () => {
                                    gsap.to(targetPot.scale, { x: 1, y: 1, duration: 0.2 });
                                    
                                    targetText.text = formatValue(event.newPotValue);
                                    targetText.scale.set(1);
                                    if (targetText.width > GAME_CONFIG.SYMBOL_SIZE * 0.75) {
                                        targetText.width = GAME_CONFIG.SYMBOL_SIZE * 0.75;
                                        targetText.scale.y = targetText.scale.x;
                                    }
                                    targetText.alpha = 1;
                                    resolve();
                                }});
                            }
                        }
                    });
                });
            });
            await new Promise(r => setTimeout(r, 400));
        }
    }
}