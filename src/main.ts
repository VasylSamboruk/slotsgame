import { Application, Container, Assets, Sprite, TextureSource } from 'pixi.js';
import { GAME_CONFIG } from './constants';
import { Grid } from './components/Grid';
import { UI } from './components/UI';
import { GameLogic } from './logic/GameLogic';

TextureSource.defaultOptions.scaleMode = 'linear';

(async () => {
    const app = new Application();
    
    await app.init({ 
        resizeTo: window, 
        backgroundColor: GAME_CONFIG.COLORS.BACKGROUND,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        antialias: true
    });
    
    document.body.appendChild(app.canvas);

    const imageUrls = [...GAME_CONFIG.SYMBOLS.map(sym => sym.view), 'symbols/fonn.jpg'];
    await Assets.load(imageUrls);

    const bgSprite = new Sprite(Assets.get('symbols/fonn.jpg'));
    app.stage.addChild(bgSprite);

    const gameContainer = new Container();
    app.stage.addChild(gameContainer);

    const logic = new GameLogic();
    const grid = new Grid();
    const ui = new UI();

    gameContainer.addChild(grid);
    app.stage.addChild(ui);

    const updateFullUI = () => {
        let status = '';
        if (logic.bonusMode === 1) status = `LUCK OF BANDIT: ${logic.freeSpins} SPINS`;
        else if (logic.bonusMode === 2) status = `GLITTERS IS GOLD: ${logic.freeSpins} SPINS`;
        else if (logic.bonusMode === 3) status = `TREASURE AT RAINBOW: ${logic.freeSpins} SPINS`;
        else if (logic.featureSpinMode === 1) status = `BONUSHUNT ACTIVE (3x BET)`;
        else if (logic.featureSpinMode === 2) status = `RAINBOW SPINS ACTIVE (50x BET)`;
        
        ui.updateStats(logic.balance, logic.currentBet, logic.currentWin, status);
        ui.updateFeatureSpinButtons(logic.featureSpinMode);
    };

    updateFullUI();
    grid.populateInitial(logic.gridState);

    let isSpinning = false;
    let pendingCascadeState: any = null; 
    
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    ui.onBetChange = (dir: 1 | -1) => {
        if (isSpinning) return;
        logic.changeBet(dir);
        updateFullUI();
    };

    ui.onToggleFeatureSpins = (mode: number) => {
        if (!isSpinning && logic.freeSpins === 0) {
            logic.toggleFeatureSpins(mode);
            updateFullUI();
        }
    };

    ui.onBuyBonus = async (type: number) => {
        if (isSpinning || logic.freeSpins > 0) return;
        if (logic.buyBonusSpin(type)) {
            runSpinSequence();
        }
    };

    const runSpinSequence = async () => {
        isSpinning = true;
        updateFullUI();

        if (pendingCascadeState) {
            // Плавний перехід: фінальний казанок і залишки старих символів провалюються
            // вниз за екран, і тільки там міняються на символи нового спіну - без "стрибка"
            grid.syncGoldenSquares(logic.goldenSquares);
            await grid.animateRainbowExitToSpin(pendingCascadeState);
            pendingCascadeState = null;
        } else {
            grid.syncGoldenSquares(logic.goldenSquares);
            // Звичайний новий спін (усі символи падають/крутяться зверху)
            await grid.animateSpin(logic.gridState);
        }
        
        while (true) {
            const clusters = logic.findClusters();
            
            // Звичайні каскади працюють як завжди — символи вибухають і красиво падають!
            if (clusters.length > 0) {
                const { winEvents, newState } = logic.processCascade(clusters);
                grid.syncGoldenSquares(logic.goldenSquares);
                updateFullUI();
                await grid.animateSequentialCascade(winEvents, newState);
                continue; 
            } 
            
            if (logic.hasPendingRainbow()) {
                const rainbowPos = logic.getRainbowPosition();
                if (rainbowPos) {
                    await delay(300);
                    await grid.animateRainbowTrigger(rainbowPos);
                    await delay(300);
                }
                
                // КРОК 1: початкове розкриття всіх ще незайманих золотих квадратів
                const { revealedPositions } = logic.processRainbowReveal();
                if (revealedPositions.length > 0) {
                    await grid.animateRainbowReveal(revealedPositions);
                    await delay(400);
                }

                // КРОК 2: перший прохід конюшин по щойно розкритих монетах
                const initialCloverActions = logic.applyClovers();
                if (initialCloverActions.length > 0) {
                    await grid.animateClovers(initialCloverActions);
                    await delay(500);
                }

                // КРОК 3: СПРАВЖНІЙ ПОСЛІДОВНИЙ КАСКАД КАЗАНКІВ
                // Казанок А збирає все поточне -> звільнені клітинки одразу заповнюються
                // новими монетами/конюшинами (внутрішній каскад) -> конюшини знову спрацьовують ->
                // Казанок Б збирає нові монети ТА суму Казанка А (який після цього зникає) -> і так,
                // доки на полі не залишиться лише один фінальний казанок.
                while (true) {
                    const potData = logic.collectPots();
                    if (!potData.collectedSomething) break;

                    await grid.animatePots(potData);
                    await delay(600);

                    if (potData.clearedForCascade.length > 0) {
                        const innerReveal = logic.fillInnerCascade(potData.clearedForCascade);
                        if (innerReveal.length > 0) {
                            await grid.animateRainbowReveal(innerReveal);
                            await delay(350);

                            const innerCloverActions = logic.applyClovers();
                            if (innerCloverActions.length > 0) {
                                await grid.animateClovers(innerCloverActions);
                                await delay(450);
                            }
                        }
                    }
                }
                
                const { newState, winAmount } = logic.endRainbowPhase();
                pendingCascadeState = newState;
                
                updateFullUI();
                await grid.showTotalPhaseWin(winAmount); 
                
                break; 
            } 
            break; 
        }

        const scatterData = logic.checkScatters();
        if (scatterData.triggered) {
            await grid.showPopupMessage(scatterData.message);
            await grid.dropCascadedSymbols(logic.gridState); 
            updateFullUI();
        }

        if (logic.freeSpins > 0) {
            await delay(1000);
            logic.spin(); 
            runSpinSequence(); 
        } else {
            if (logic.bonusMode > 0) {
                await grid.showPopupMessage(`BONUS COMPLETED\nTOTAL WON: €${logic.totalBonusWin.toFixed(2)}`);
                logic.bonusMode = 0; 
                logic.totalBonusWin = 0;
                logic.resetGoldenSquares();
                grid.syncGoldenSquares(logic.goldenSquares);
                updateFullUI();
            }
            isSpinning = false;
        }
    };

    ui.onSpinClick = async () => {
        if (isSpinning || !logic.spin()) return;
        runSpinSequence();
    };

    function resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        app.renderer.resolution = Math.min(window.devicePixelRatio || 1, 2);
        app.renderer.resize(w, h);

        bgSprite.width = w;
        bgSprite.height = h;

        const isMobile = w < h;

        const uiHeight = isMobile ? 180 : 100;
        const availableHeight = h - uiHeight;

        if (isMobile) {
            const scale = (w - 20) / GAME_CONFIG.LOGICAL_WIDTH;
            gameContainer.scale.set(scale);
            gameContainer.x = (w - GAME_CONFIG.LOGICAL_WIDTH * scale) / 2;
            gameContainer.y = Math.max(10, (availableHeight - GAME_CONFIG.LOGICAL_HEIGHT * scale) / 2);
        } else {
            const scale = (availableHeight * 0.92) / GAME_CONFIG.LOGICAL_HEIGHT;
            gameContainer.scale.set(scale);
            gameContainer.x = (w - GAME_CONFIG.LOGICAL_WIDTH * scale) / 2;
            gameContainer.y = (availableHeight - GAME_CONFIG.LOGICAL_HEIGHT * scale) / 2;
        }

        ui.updateLayout(w, h, isMobile, 1);
    }
    
    window.addEventListener('resize', resize);
    resize();
})();