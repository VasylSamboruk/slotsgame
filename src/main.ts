import { Application, Container, Assets, Sprite, Graphics, Text } from 'pixi.js';
import { SYMBOL_TEXTURES, LETTERS, CONFIG, generateSpinResult } from './config';
import { calculateWins } from './winLogic';
import { SlotUI } from './ui';
import { tweenTo, lerp, backout, animateSpinButton, killTweensOf } from './animations';
import { playWinAnimation, stopWinAnimations } from './winAnimation';
import { showBigWinOverlay } from './bigWin';
import { animateFon } from './fonAnimation';

const app = new Application();

async function init() {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden'; 
    document.body.style.backgroundColor = '#1a1a24';

    // ==========================================
    // БЕЗВІДМОВНИЙ СПОСІБ ЗАВАНТАЖЕННЯ ШРИФТУ
    // ==========================================
    const customFont = new FontFace('Skranji', 'url(/assets/fonts/Skranji-Bold.ttf)');
    await customFont.load();
    document.fonts.add(customFont);

    await app.init({ 
        resizeTo: window, 
        backgroundColor: 0x1a1a24,
        resolution: window.devicePixelRatio || 1, // 👈 Рендеримо під реальну щільність пікселів екрана телефона
        autoDensity: true                         // 👈 Автоматично масштабує полотно під Retina-екрани
    });
    document.body.appendChild(app.canvas);

    await Assets.load([
        '/assets/bg.png', '/assets/fon.png', 
        '/assets/pidkladka.png', '/assets/pidkladka2.png',
        '/assets/minusBTN.png', '/assets/plusBTN.png', '/assets/spinBTN.png',
        '/assets/infoBtn.png', '/assets/volumeAdd.png', '/assets/volumeMin.png',

        // --- КАДРИ АНІМАЦІЇ ФОНУ (РАМКИ) ---
        '/assets/animation/fon2.png',
        '/assets/animation/fon3.png',
        '/assets/animation/fon3.png',
        '/assets/animation/fon4.png',
        '/assets/animation/fon5.png',
        '/assets/animation/fon6.png',
        '/assets/animation/fon7.png',
        '/assets/animation/fon8.png',
        '/assets/animation/fon9.png',

        // --- КАДРИ АНІМАЦІЇ СКРИНІ ---
        '/assets/animation/sunduk1.png',
        '/assets/animation/sunduk2.png',
        '/assets/animation/sunduk3.png',

        // --- КАДРИ АНІМАЦІЇ Свитку ---
        '/assets/animation/svitok1.png',
        '/assets/animation/svitok2.png',
        '/assets/animation/svitok3.png',

        // --- КАДРИ АНІМАЦІЇ РОЖЕВОГО ДРАКОНА (d2) ---
        '/assets/animation/d2_1.png',
        '/assets/animation/d2_2.png',
        '/assets/animation/d2_3.png',
        '/assets/animation/d2_4.png',

        // --- КАДРИ АНІМАЦІЇ СИНЬОГО ДРАКОНА (d3) ---
        '/assets/animation/d3_2.png',
        '/assets/animation/d3_3.png',
        '/assets/animation/d3_4.png',
        '/assets/animation/d3_5.png',
        '/assets/animation/d3_6.png',

        // --- КАДРИ АНІМАЦІЇ WILD ---
        '/assets/animation/wild1.png',
        '/assets/animation/wild2.png',
        '/assets/animation/wild3.png',

        // --- КАДРИ АНІМАЦІЇ ДРАКОНА 1 (d1) ---
        '/assets/animation/d1_1.png',
        '/assets/animation/d1_2.png',
        '/assets/animation/d1_3.png',
        '/assets/animation/d1_4.png',
        '/assets/animation/d1_5.png',

        // --- КАДРИ АНІМАЦІЇ ЧЕРВОНОГО ДРАКОНА (d4) ---
        '/assets/animation/d4_1.png',
        '/assets/animation/d4_2.png',
        '/assets/animation/d4_3.png',
        '/assets/animation/d4_4.png',
        '/assets/animation/d4_5.png',

        // --- КАДРИ АНІМАЦІЇ БОНУСА (bonus) ---
        '/assets/animation/bonus1.png',
        '/assets/animation/bonus2.png',
        '/assets/animation/bonus3.png',
        '/assets/animation/bonus4.png',
        '/assets/animation/bonus5.png',

        // --- БАНЕРИ ВИГРАШІВ ---
        '/assets/bigWin.png',
        '/assets/niceWin.png',
        '/assets/megaWin.png',
        
        '/assets/speed.png',
        '/assets/avtospin.png',

        ...SYMBOL_TEXTURES
    ]);

    
    const mainContainer = new Container();
    app.stage.addChild(mainContainer);

    function resize() {
        const scaleX = window.innerWidth / CONFIG.GAME_WIDTH;
        const scaleY = window.innerHeight / CONFIG.GAME_HEIGHT;
        const scale = Math.min(scaleX, scaleY); 
        mainContainer.scale.set(scale);
        mainContainer.x = window.innerWidth / 2;
        mainContainer.y = window.innerHeight / 2;
    }
    window.addEventListener('resize', resize);
    resize();

    const bg = Sprite.from('/assets/bg.png');
    bg.anchor.set(0.5);
    mainContainer.addChild(bg);

    const reelsContainer = new Container();
    reelsContainer.x = 15;
    reelsContainer.y = CONFIG.GLOBAL_Y_OFFSET;
    mainContainer.addChild(reelsContainer);

    const mask = new Graphics();
    mask.rect((-CONFIG.BG_WIDTH / 2) + 15, -CONFIG.MASK_HEIGHT / 2 + CONFIG.GLOBAL_Y_OFFSET, CONFIG.BG_WIDTH, CONFIG.MASK_HEIGHT);
    mask.fill(0xff0000);
    mainContainer.addChild(mask);
    reelsContainer.mask = mask;

    const REEL_WIDTH = CONFIG.BG_WIDTH / CONFIG.REEL_COUNT; 
    const START_Y = - ((CONFIG.SYMBOLS_PER_REEL - 3) * CONFIG.ROW_SPACING);

    const reels: { container: Container, symbols: Sprite[] }[] = [];

    function applySymbolSize(symbol: Sprite, texturePath: string) {
        const isLetter = LETTERS.some(letter => texturePath.includes(letter));
        if (isLetter) {
            symbol.width = CONFIG.LETTER_SIZE;  
            symbol.height = CONFIG.LETTER_SIZE;
        } else {
            symbol.width = CONFIG.DRAGON_SIZE;  
            symbol.height = CONFIG.DRAGON_SIZE;
        }
    }

    for (let i = 0; i < CONFIG.REEL_COUNT; i++) {
        const reelContainer = new Container();
        reelContainer.x = (-CONFIG.BG_WIDTH / 2) + (REEL_WIDTH / 2) + (i * REEL_WIDTH);
        reelContainer.y = START_Y;

        const reel = { container: reelContainer, symbols: [] as Sprite[] };

        for (let j = 0; j < CONFIG.SYMBOLS_PER_REEL; j++) {
            const randomTexture = SYMBOL_TEXTURES[Math.floor(Math.random() * SYMBOL_TEXTURES.length)];
            const symbol = Sprite.from(randomTexture);
            symbol.anchor.set(0.5);
            symbol.x = 0; 
            symbol.y = (j - 1) * CONFIG.ROW_SPACING; 
            applySymbolSize(symbol, randomTexture);
            reel.symbols.push(symbol);
            reelContainer.addChild(symbol);
        }
        reels.push(reel);
        reelsContainer.addChild(reelContainer);
    }

    const winLinesGraphic = new Graphics();
    reelsContainer.addChild(winLinesGraphic);

    const fon = Sprite.from('/assets/fon.png');
    fon.anchor.set(0.5);
    mainContainer.addChild(fon);

    animateFon(fon);

    let running = false;
    let quickStopping = false;
    let reelDone: boolean[] = [];

    const ui = new SlotUI(10000);
    ui.isSpinning = () => running; 
    mainContainer.addChild(ui.container);

    let reelsFinished = 0;
    let currentResultGrid: string[][] = [];

    function startPlay() {
        if (running) {
            if (!quickStopping && reelsFinished < CONFIG.REEL_COUNT) {
                quickStopping = true;
                for (let i = 0; i < reels.length; i++) {
                    if (!reelDone[i]) {
                        killTweensOf(reels[i].container);
                        killTweensOf(reels[i].container.position); 
                        reels[i].container.y = 0; 
                        onReelComplete(i);
                    }
                }
            }
            return;
        }

        if (!ui.deductBet()) {
            // Якщо закінчилися гроші — вимикаємо автоспін автоматично
            (window as any).isAutoSpinActive = false;
            tweenTo(ui.winText, 'alpha', 1, 300, lerp, null, () => {
                setTimeout(() => { tweenTo(ui.winText, 'alpha', 0, 500, lerp, null, null); }, 1500);
            });
            return;
        }

        running = true;
        
        stopWinAnimations(reels);
        
        quickStopping = false;
        reelsFinished = 0;
        reelDone = [false, false, false, false, false];
        winLinesGraphic.clear();
        
        reels.forEach(reel => {
            killTweensOf(reel.container);
            killTweensOf(reel.container.position);
            reel.container.y = START_Y; 

            reel.symbols.forEach((symbol, j) => {
                symbol.alpha = 1; 
                symbol.x = 0; 
                symbol.y = (j - 1) * CONFIG.ROW_SPACING; 
            });
        });
        
        currentResultGrid = generateSpinResult();

        for (let i = 0; i < reels.length; i++) {
            const reel = reels[i];
            
            for (let r = 0; r < CONFIG.ROW_COUNT; r++) {
                const targetTexture = currentResultGrid[i][r];
                const symbol = reel.symbols[r];
                symbol.texture = Assets.get(targetTexture);
                applySymbolSize(symbol, targetTexture);
            }
            
            for (let j = 3; j < CONFIG.SYMBOLS_PER_REEL - 3; j++) {
                const randomTexture = SYMBOL_TEXTURES[Math.floor(Math.random() * Math.min(11, SYMBOL_TEXTURES.length))];
                reel.symbols[j].texture = Assets.get(randomTexture);
                applySymbolSize(reel.symbols[j], randomTexture);
            }
            
            let baseTime = 1500;      
            let delayPerReel = 500;   
            let easeFunc = backout(0.4); 

            if ((window as any).currentSpeed === 2) {
                baseTime = 500;
                delayPerReel = 150;
                easeFunc = backout(0.2); 
            } else if ((window as any).currentSpeed === 3) {
                baseTime = 200;
                delayPerReel = 50;
                easeFunc = lerp; 
            }

            const time = baseTime + (i * delayPerReel);
            tweenTo(reel.container, 'y', 0, time, easeFunc, null, () => onReelComplete(i));
        }
    }

    function onReelComplete(reelIndex: number) {
        if (reelDone[reelIndex]) return;
        reelDone[reelIndex] = true;
        
        const reel = reels[reelIndex];
        
        for (let r = 0; r < CONFIG.ROW_COUNT; r++) {
            const targetTexture = currentResultGrid[reelIndex][r];
            const topSymbol = reel.symbols[r];
            const bottomSymbol = reel.symbols[CONFIG.SYMBOLS_PER_REEL - 3 + r];
            
            topSymbol.texture = Assets.get(targetTexture);
            bottomSymbol.texture = Assets.get(targetTexture);
            
            applySymbolSize(topSymbol, targetTexture);
            applySymbolSize(bottomSymbol, targetTexture);
        }
        
        reel.container.y = START_Y;
        reelsFinished++;

        if (reelsFinished === CONFIG.REEL_COUNT) {
            const wins = calculateWins(currentResultGrid, ui.currentBet);
            
            if (wins.length > 0) {
                const totalWinAmount = wins.reduce((sum, win) => sum + win.amount, 0);

                playWinAnimation(wins, reels, winLinesGraphic, ui, () => {
                    // Це спрацьовує КОЛИ ЦИФРИ ПОВНІСТЮ ДОБІГЛИ ДО КІНЦЯ
                    showBigWinOverlay(mainContainer, totalWinAmount, ui.currentBet, () => {
                        // Якщо вилазив великий банер (Big/Mega Win) — закрили його, 
                        // ставимо running = false і даємо паузу 2 секунди перед новим спіном
                        running = false; 
                        if ((window as any).isAutoSpinActive) {
                            (window as any).triggerAutoSpin(2000); // 👈 2 секунди паузи після банера
                        }
                    });
                });

                // Якщо це звичайний виграш (без великого банера, менше x10), 
                // цифри накрутилися і зупинилися. Чекаємо 2 секунди і запускаємо автоспін!
                if (totalWinAmount / ui.currentBet < 10) {
                    // Тривалість накрутки для звичайного виграшу у нас 2000мс, 
                    // тому ставимо перевірку / таймаут після завершення накрутки:
                    setTimeout(() => {
                        running = false;
                        if ((window as any).isAutoSpinActive) {
                            (window as any).triggerAutoSpin(2000); // 👈 рівно 2 секунди паузи після того, як цифри зупинилися
                        }
                    }, 2000); // Час накрутки Nice Win
                }

            } else {
                // Виграшу немає — запускаємо новий прокрут одразу (без затримки)
                running = false;
                if ((window as any).isAutoSpinActive) {
                    (window as any).triggerAutoSpin(0); // 👈 без затримки для пустих спінів
                }
            }
        }
    }

    // ==========================================
    // 🎵 ФОНОВА МУЗИКА
    // ==========================================
    const bgMusic = new Audio('/assets/music/fonmusic.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.4; 
    
    let isMutedLocally = false;
    let musicStarted = false;
    
    const startMusicOnFirstInteraction = () => {
        if (!musicStarted && !isMutedLocally) {
            musicStarted = true;
            bgMusic.play().catch(() => console.log("Браузер блокує автоплей"));
        }
        window.removeEventListener('click', startMusicOnFirstInteraction);
        window.removeEventListener('pointerdown', startMusicOnFirstInteraction);
        app.stage.off('pointerdown', startMusicOnFirstInteraction);
    };
    
    window.addEventListener('click', startMusicOnFirstInteraction);
    window.addEventListener('pointerdown', startMusicOnFirstInteraction);
    
    app.stage.eventMode = 'static';
    app.stage.on('pointerdown', startMusicOnFirstInteraction);
    
    ui.btnVolume.on('pointerdown', () => {
        isMutedLocally = !isMutedLocally;
        bgMusic.muted = isMutedLocally;
        
        if (isMutedLocally) {
            ui.btnVolume.texture = Assets.get('/assets/volumeMin.png'); 
        } else {
            ui.btnVolume.texture = Assets.get('/assets/volumeAdd.png'); 
            if (!musicStarted) {
                musicStarted = true;
                bgMusic.play().catch(() => console.log("Чекаємо кліку"));
            }
        }
    });

    // ==========================================
    // ⚡ КНОПКА ШВИДКОСТІ
    // ==========================================
    (window as any).currentSpeed = 1; 

    const speedContainer = new Container();
    speedContainer.x = 230; 
    speedContainer.y = 670;  
    speedContainer.eventMode = 'static';
    speedContainer.cursor = 'pointer';
    ui.container.addChild(speedContainer);

    const speedBg = Sprite.from('/assets/speed.png'); 
    speedBg.anchor.set(0.5);
    speedBg.height = 220; 
    speedBg.scale.x = speedBg.scale.y; 
    speedContainer.addChild(speedBg);

    const speedText = new Text({
        text: 'x1',
        style: {
            fontFamily: 'Skranji', 
            fontSize: 40,
            fill: 0xc4b584, 
        }
    });
    speedText.anchor.set(0.5);
    speedText.y = 0; 
    speedContainer.addChild(speedText);

    speedContainer.on('pointerdown', () => {
        (window as any).currentSpeed++;
        if ((window as any).currentSpeed > 3) (window as any).currentSpeed = 1;

        speedText.text = `x${(window as any).currentSpeed}`;
        
        speedContainer.scale.set(0.9);
        setTimeout(() => speedContainer.scale.set(1), 100);
    });

    // ==========================================
    // КЛІК ПО КНОПЦІ SPIN
    // ==========================================
    ui.btnSpin.on('pointerdown', () => {
        if (!musicStarted && !isMutedLocally) {
            musicStarted = true;
            bgMusic.play().catch(e => console.log("Помилка звуку:", e));
        }

        animateSpinButton(ui.btnSpin, 290);
        startPlay(); 
    });

    // ==========================================
    // 🔄 КНОПКА АВТОСПІНУ (ЛОГІКА + ІНТЕГРАЦІЯ)
    // ==========================================
    (window as any).isAutoSpinActive = false; 

    const autoContainer = new Container();
    autoContainer.x = -240; 
    autoContainer.y = 670;  
    autoContainer.eventMode = 'static';
    autoContainer.cursor = 'pointer';
    ui.container.addChild(autoContainer);

    const autoBg = Sprite.from('/assets/avtospin.png'); 
    autoBg.anchor.set(0.5);
    autoBg.height = 220; 
    autoBg.scale.x = autoBg.scale.y; 
    autoContainer.addChild(autoBg);

    const autoText = new Text({
        text: 'OFF', 
        style: {
            fontFamily: 'Skranji', 
            fontSize: 30, 
            fill: 0xa69568, 
        }
    });
    autoText.anchor.set(0.5);
    autoText.y = 0; 
    autoContainer.addChild(autoText);

    // Функція запуску наступного спіну в режимі авто (ЧЕКАЄ ДОКІВ ЦИФРИ ЗУПИНЯТЬСЯ)
    // Проста і надійна функція запуску наступного автоспіну з паузою
    const checkAndTriggerAutoSpin = (delay: number = 0) => {
        if (!(window as any).isAutoSpinActive) return;

        // Перевіряємо гроші
        if (ui.balance < ui.currentBet) {
            (window as any).isAutoSpinActive = false;
            autoText.text = 'OFF';
            autoText.style.fill = 0xa69568;
            return;
        }

        setTimeout(() => {
            if ((window as any).isAutoSpinActive && !running) {
                startPlay();
            }
        }, delay);
    };

    (window as any).triggerAutoSpin = checkAndTriggerAutoSpin;

    autoContainer.on('pointerdown', () => {
        const isActive = (window as any).isAutoSpinActive;
        (window as any).isAutoSpinActive = !isActive;

        if ((window as any).isAutoSpinActive) {
            autoText.text = 'ON';
            autoText.style.fill = 0xebdcb8; 
            
            if (!running) {
                startPlay();
            }
        } else {
            autoText.text = 'OFF';
            autoText.style.fill = 0xa69568; 
        }

        autoContainer.scale.set(0.9);
        setTimeout(() => autoContainer.scale.set(1), 100);
    });
}

init();