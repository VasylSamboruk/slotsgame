import { Application, Container, Assets, Sprite, Graphics } from 'pixi.js';
import { SYMBOL_TEXTURES, LETTERS, CONFIG, generateSpinResult } from './config';
import { calculateWins } from './winLogic';
import { SlotUI } from './ui';
import { tweenTo, lerp, backout, animateSpinButton, killTweensOf } from './animations';
import { playWinAnimation, stopWinAnimations } from './winAnimation';

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

    await app.init({ resizeTo: window, backgroundColor: 0x1a1a24 });
    document.body.appendChild(app.canvas);

    await Assets.load([
        '/assets/bg.png', '/assets/fon.png', 
        '/assets/pidkladka.png', '/assets/pidkladka2.png',
        '/assets/minusBTN.png', '/assets/plusBTN.png', '/assets/spinBTN.png',
        '/assets/infoBtn.png', '/assets/volumeAdd.png', '/assets/volumeMin.png', // <--- ДОДАЙ ОЦІ ДВІ КАРТИНКИ

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

    let running = false;
    let quickStopping = false; // ПРАПОРЕЦЬ ДЛЯ ШВИДКОЇ ЗУПИНКИ
    let reelDone: boolean[] = [];

    const ui = new SlotUI(10000); 
    ui.isSpinning = () => running; 
    mainContainer.addChild(ui.container);

    let reelsFinished = 0;
    let currentResultGrid: string[][] = [];

    function startPlay() {
        // ЯКЩО ВЖЕ КРУТИТЬСЯ - МИТТЄВА ЗУПИНКА!
        if (running) {
            if (!quickStopping && reelsFinished < CONFIG.REEL_COUNT) {
                quickStopping = true;
                for (let i = 0; i < reels.length; i++) {
                    if (!reelDone[i]) {
                        // 🛑 ДОДАТКОВА ОЧИСТКА: Вбиваємо рух і самого контейнера, і його координат
                        killTweensOf(reels[i].container); 
                        killTweensOf(reels[i].container.position); 
                        reels[i].container.y = 0; // Примусово ставимо барабан у кінець
                        onReelComplete(i); // Завершуємо логіку
                    }
                }
            }
            return;
        }

        if (!ui.deductBet()) {
            tweenTo(ui.winText, 'alpha', 1, 300, lerp, null, () => {
                setTimeout(() => { tweenTo(ui.winText, 'alpha', 0, 500, lerp, null, null); }, 1500);
            });
            return;
        }

        running = true;
        
        // ==========================================
        // ЗУПИНЯЄМО АНІМАЦІЮ МИНУЛОГО ВИГРАШУ
        // ==========================================
        stopWinAnimations(reels);
        
        quickStopping = false;
        reelsFinished = 0;
        reelDone = [false, false, false, false, false];
        winLinesGraphic.clear(); 
        
        reels.forEach(reel => {
            // ==========================================
            // 🛑 НАЙГОЛОВНІШИЙ ФІКС ДЛЯ ШВИДКОГО КЛІКУ
            // Завжди жорстко скидаємо всі залишкові рухи 
            // і повертаємо барабан на початкову точку (START_Y)
            // ==========================================
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
            const time = 1000 + i * 250; 
            tweenTo(reel.container, 'y', 0, time, backout(0.4), null, () => onReelComplete(i));
        }
    }

    function onReelComplete(reelIndex: number) {
        if (reelDone[reelIndex]) return; 
        reelDone[reelIndex] = true;
        
        const reel = reels[reelIndex];
        
        // 🛑 ЖОРСТКА СИНХРОНІЗАЦІЯ ЕКРАНУ І ПАМ'ЯТІ 🛑
        for (let r = 0; r < CONFIG.ROW_COUNT; r++) {
            // Беремо реальний символ з математичного масиву (з мозку)
            const targetTexture = currentResultGrid[reelIndex][r];
            
            // Знаходимо верхній (схований) і нижній (видимий) символи
            const topSymbol = reel.symbols[r];
            const bottomSymbol = reel.symbols[CONFIG.SYMBOLS_PER_REEL - 3 + r];
            
            // ПРИМУСОВО натягуємо правильні картинки з пам'яті на екран
            topSymbol.texture = Assets.get(targetTexture);
            bottomSymbol.texture = Assets.get(targetTexture);
            
            // Оновлюємо розміри, щоб символи не сплющувались
            applySymbolSize(topSymbol, targetTexture);
            applySymbolSize(bottomSymbol, targetTexture);
        }
        
        // Телепортуємо барабан точно на місце
        reel.container.y = START_Y; 
        reelsFinished++;

        if (reelsFinished === CONFIG.REEL_COUNT) {
            // ТЕПЕР МИ НА 100% ВПЕВНЕНІ, ЩО ЕКРАН НЕ БРЕШЕ
            const wins = calculateWins(currentResultGrid, ui.currentBet);
            
            if (wins.length > 0) {
                playWinAnimation(wins, reels, winLinesGraphic, ui, () => {
                    running = false; 
                });
            } else {
                running = false; 
            }
        }
    }

    // ==========================================
    // 🎵 ФОНОВА МУЗИКА (Підключена до UI)
    // ==========================================
    const bgMusic = new Audio('/assets/music/fonmusic.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.4; 
    
    // Використовуємо локальну змінну для контролю звуку в main.ts
    let isMutedLocally = false;
    let musicStarted = false;
    
    // ВІШАЄМО КЛІК НА ТВОЮ КНОПКУ btnVolume З КЛАСУ UI
    ui.btnVolume.on('pointerdown', () => {
        isMutedLocally = !isMutedLocally;
        bgMusic.muted = isMutedLocally;
        
        // Змінюємо текстуру на твоїй кнопці
        if (isMutedLocally) {
            ui.btnVolume.texture = Assets.get('/assets/volumeMin.png'); 
        } else {
            ui.btnVolume.texture = Assets.get('/assets/volumeAdd.png'); 
            
            // Якщо музика ще не запускалась — стартуємо
            if (!musicStarted) {
                musicStarted = true;
                bgMusic.play().catch(() => console.log("Чекаємо кліку"));
            }
        }
    });

    // ==========================================
    // КЛІК ПО КНОПЦІ SPIN
    // ==========================================
    ui.btnSpin.on('pointerdown', () => {
        // Запуск музики при першому кліку на Spin (обхід блокування браузера)
        if (!musicStarted && !isMutedLocally) {
            musicStarted = true;
            bgMusic.play().catch(e => console.log("Помилка звуку:", e));
        }

        animateSpinButton(ui.btnSpin, 290);
        startPlay(); 
    });
}

init();