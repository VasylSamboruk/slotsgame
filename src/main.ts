import { Application, Container, Assets, Sprite, TextureSource } from 'pixi.js';
import { GAME_CONFIG } from './constants';
import { Grid } from './components/Grid';
import { UI } from './components/UI';
import { GameLogic } from './logic/GameLogic';

// Вмикаємо лінійну фільтрацію для всіх текстур (прибирає піксельні кубики на смартфонах)
TextureSource.defaultOptions.scaleMode = 'linear';

(async () => {
    const app = new Application();
    
    // Вмикаємо підтримку Retina-екранів (2x / 3x) та згладжування
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
        grid.syncGoldenSquares(logic.goldenSquares);
        
        await grid.animateSpin(logic.gridState);
        
        while (true) {
            const clusters = logic.findClusters();
            
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
                
                while (true) {
                    const { revealedPositions } = logic.processRainbowReveal();
                    if (revealedPositions.length === 0) break;
                    
                    await grid.animateRainbowReveal(revealedPositions);
                    await delay(400); 

                    const cloverActions = logic.applyClovers();
                    if (cloverActions.length > 0) {
                        await grid.animateClovers(cloverActions); 
                        await delay(500);
                    }

                    const potData = logic.collectPots();
                    if (potData.events.length > 0) {
                        await grid.animatePots(potData);
                        await delay(800); 
                    } else {
                        break; 
                    }
                }
                
                const { newState: postRainbowState, winAmount, clearedPositions } = logic.endRainbowPhase();
                updateFullUI();
                
                await grid.showTotalPhaseWin(winAmount); 
                await grid.hideRainbowSymbols(clearedPositions); 
                grid.syncGoldenSquares(logic.goldenSquares);
                
                await grid.dropCascadedSymbols(postRainbowState);
                continue; 
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

        // Динамічно підганяємо resolution при ресайзі чи повороті екрана
        app.renderer.resolution = Math.min(window.devicePixelRatio || 1, 2);
        app.renderer.resize(w, h);

        bgSprite.width = w;
        bgSprite.height = h;

        const isMobile = w < h;

        // Виділяємо місце під нижню панель
        const uiHeight = isMobile ? 180 : 100;
        const availableHeight = h - uiHeight;

        if (isMobile) {
            // МОБІЛКА: Сітка на всю ширину
            const scale = (w - 20) / GAME_CONFIG.LOGICAL_WIDTH;
            gameContainer.scale.set(scale);
            gameContainer.x = (w - GAME_CONFIG.LOGICAL_WIDTH * scale) / 2;
            gameContainer.y = Math.max(10, (availableHeight - GAME_CONFIG.LOGICAL_HEIGHT * scale) / 2);
        } else {
            // ПК: Велике поле
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