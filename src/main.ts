import { Application, Container, Assets, Sprite, Graphics, Text } from 'pixi.js';
import { SYMBOL_TEXTURES, LETTERS, CONFIG, generateSpinResult } from './config';
import { calculateWins } from './winLogic';
import { SlotUI } from './ui';
import { tweenTo, lerp, backout, animateSpinButton, killTweensOf } from './animations';
import { playWinAnimation, stopWinAnimations } from './winAnimation';
import { showBigWinOverlay } from './bigWin';
import { animateFon } from './fonAnimation';

const app = new Application();

// ==========================================
// 🎬 ФУНКЦІЯ ДЛЯ ВІДТВОРЕННЯ БОНУСНОГО ВІДЕО
// ==========================================
function playBonusVideo(onComplete: () => void) {
    const video = document.createElement('video');
    video.src = '/assets/bonusvid.mp4'; 
    video.playsInline = true;
    video.autoplay = true;
    video.muted = false; 

    video.style.position = 'fixed';
    video.style.top = '0';
    video.style.left = '0';
    video.style.width = '100vw';
    video.style.height = '100vh';
    video.style.objectFit = 'cover';
    video.style.zIndex = '99999';
    video.style.backgroundColor = '#000'; 
    
    document.body.appendChild(video);

    video.onended = () => {
        video.remove(); 
        onComplete();   
    };

    video.play().catch(error => {
        console.log("Браузер заблокував звук у відео, запускаємо muted:", error);
        video.muted = true;
        video.play();
    });
}

async function init() {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden'; 
    document.body.style.backgroundColor = '#1a1a24';

    const customFont = new FontFace('Skranji', 'url(/assets/fonts/Skranji-Bold.ttf)');
    await customFont.load();
    document.fonts.add(customFont);

    await app.init({ 
        resizeTo: window, 
        backgroundColor: 0x1a1a24,
        resolution: window.devicePixelRatio || 1, 
        autoDensity: true                         
    });
    document.body.appendChild(app.canvas);

    await Assets.load([
        '/assets/bg.png', '/assets/fon.png', 
        '/assets/pidkladka.png', '/assets/pidkladka2.png',
        '/assets/minusBTN.png', '/assets/plusBTN.png', '/assets/spinBTN.png',
        '/assets/infoBtn.png', '/assets/volumeAdd.png', '/assets/volumeMin.png',
        '/assets/animation/fon2.png', '/assets/animation/fon3.png', '/assets/animation/fon3.png',
        '/assets/animation/fon4.png', '/assets/animation/fon5.png', '/assets/animation/fon6.png',
        '/assets/animation/fon7.png', '/assets/animation/fon8.png', '/assets/animation/fon9.png',
        '/assets/animation/sunduk1.png', '/assets/animation/sunduk2.png', '/assets/animation/sunduk3.png',
        '/assets/animation/svitok1.png', '/assets/animation/svitok2.png', '/assets/animation/svitok3.png',
        '/assets/animation/d2_1.png', '/assets/animation/d2_2.png', '/assets/animation/d2_3.png', '/assets/animation/d2_4.png',
        '/assets/animation/d3_2.png', '/assets/animation/d3_3.png', '/assets/animation/d3_4.png', '/assets/animation/d3_5.png', '/assets/animation/d3_6.png',
        '/assets/animation/wild1.png', '/assets/animation/wild2.png', '/assets/animation/wild3.png',
        '/assets/animation/d1_1.png', '/assets/animation/d1_2.png', '/assets/animation/d1_3.png', '/assets/animation/d1_4.png', '/assets/animation/d1_5.png',
        '/assets/animation/d4_1.png', '/assets/animation/d4_2.png', '/assets/animation/d4_3.png', '/assets/animation/d4_4.png', '/assets/animation/d4_5.png',
        '/assets/animation/bonus1.png', '/assets/animation/bonus2.png', '/assets/animation/bonus3.png', '/assets/animation/bonus4.png', '/assets/animation/bonus5.png',
        '/assets/bigWin.png', '/assets/niceWin.png', '/assets/megaWin.png',
        '/assets/speed.png', '/assets/avtospin.png',
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
    let stopSoundTimeouts: any[] = []; 

    // ==========================================
    // 🎵 ФОНОВА МУЗИКА ТА ЕФЕКТИ
    // ==========================================
    const bgMusic = new Audio('/assets/music/fonmusic.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.4; 

    const spinSound = new Audio('/assets/music/spin.webm');
    spinSound.loop = true;
    spinSound.volume = 0.5;

    const stopSound = new Audio('/assets/music/stop.webm');
    stopSound.volume = 0.7;

    const countSound = new Audio('/assets/music/cntr_rllng.webm');
    countSound.loop = true;
    countSound.volume = 0.6;
    
    // 🔥 ЗВУК ДЛЯ БАНЕРІВ ВИГРАШУ (Nice, Big, Mega)
    const bannerSound = new Audio('/assets/music/floraphonic.mp3');
    bannerSound.volume = 0.7;
    bannerSound.playbackRate = 1.15;
    
    let isMutedLocally = false;
    let musicStarted = false;

    function startPlay() {
        if (running) {
            if (!quickStopping && reelsFinished < CONFIG.REEL_COUNT) {
                quickStopping = true;
                
                stopSoundTimeouts.forEach(clearTimeout);
                stopSoundTimeouts = [];

                for (let i = 0; i < reels.length; i++) {
                    if (!reelDone[i]) {
                        killTweensOf(reels[i].container);
                        killTweensOf(reels[i].container.position); 
                        reels[i].container.y = 0; 
                        onReelComplete(i);

                        if (!isMutedLocally) {
                            const stopHit = stopSound.cloneNode() as HTMLAudioElement;
                            stopHit.volume = stopSound.volume;
                            stopHit.play().catch(() => {});
                        }
                    }
                }
            }
            return;
        }

        if (!ui.deductBet()) {
            (window as any).isAutoSpinActive = false;
            tweenTo(ui.winText, 'alpha', 1, 300, lerp, null, () => {
                setTimeout(() => { tweenTo(ui.winText, 'alpha', 0, 500, lerp, null, null); }, 1500);
            });
            return;
        }

        running = true;

        if (!isMutedLocally) {
            spinSound.currentTime = 0;
            spinSound.play().catch(() => {});
        }
        
        stopWinAnimations(reels);
        
        quickStopping = false;
        reelsFinished = 0;
        reelDone = [false, false, false, false, false];
        winLinesGraphic.clear();
        
        stopSoundTimeouts.forEach(clearTimeout);
        stopSoundTimeouts = [];
        
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

            let hitOffset = 0;
            if ((window as any).currentSpeed === 1) hitOffset = 450; 
            else if ((window as any).currentSpeed === 2) hitOffset = 150; 

            const hitTime = time - hitOffset;

            const t = setTimeout(() => {
                if (!isMutedLocally && running && !quickStopping) {
                    const stopHit = stopSound.cloneNode() as HTMLAudioElement;
                    stopHit.volume = stopSound.volume;
                    stopHit.play().catch(() => {});
                }
            }, hitTime);
            stopSoundTimeouts.push(t);

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
            spinSound.pause();

            const wins = calculateWins(currentResultGrid, ui.currentBet);
            
            let bonusCount = 0;
            currentResultGrid.forEach(reelColumn => {
                reelColumn.forEach(symbolPath => {
                    if (symbolPath.includes('bonus')) bonusCount++;
                });
            });
            const isBonusTriggered = bonusCount >= 3; 

            const finishSpinSequence = () => {
                if (isBonusTriggered) {
                    setTimeout(() => {
                        playBonusVideo(() => {
                            running = false;
                            
                            if ((window as any).isAutoSpinActive) {
                                (window as any).triggerAutoSpin(1000); 
                            }
                        });
                    }, 1500); 
                } else {
                    running = false; 
                    if ((window as any).isAutoSpinActive) {
                        (window as any).triggerAutoSpin(wins.length > 0 ? 2000 : 0);
                    }
                }
            };

            if (wins.length > 0) {
                const totalWinAmount = wins.reduce((sum, win) => sum + win.amount, 0);
                const winMultiplier = totalWinAmount / ui.currentBet; 
                
                let countDuration = 2000; 
                if (winMultiplier >= 50) countDuration = 6500; 
                else if (winMultiplier >= 20) countDuration = 4500; 

                // 🔊 Звук лічильника 
                if (!isMutedLocally) {
                    countSound.currentTime = 0;
                    countSound.play().catch(() => {});
                }

                const tCount = setTimeout(() => {
                    countSound.pause();
                }, countDuration);
                
                // 🔊 Звук БАНЕРА (грає під кінець, коли з'являється фінальна табличка)
                let tBanner: any;
                if (winMultiplier >= 10 && !isMutedLocally) {
                    // Запускаємо звук за півсекунди (500мс) до повної зупинки лічильника
                    const bannerDelay = Math.max(0, countDuration - 500);
                    tBanner = setTimeout(() => {
                        bannerSound.currentTime = 0;
                        bannerSound.play().catch(() => {});
                    }, bannerDelay);
                }

                playWinAnimation(wins, reels, winLinesGraphic, ui, () => {
                    showBigWinOverlay(mainContainer, totalWinAmount, ui.currentBet, () => {
                        // Очищаємо всі таймери і вимикаємо звуки при закритті
                        clearTimeout(tCount);
                        if (tBanner) clearTimeout(tBanner);
                        countSound.pause();
                        bannerSound.pause(); 

                        // ==========================================
                        // 🔥 ЕФЕКТ "ВАУ" (ЗБІЛЬШЕННЯ БАНЕРА ТА ЗНИКНЕННЯ)
                        // Легко видалити цей блок if (winMultiplier >= 10) { ... }, якщо буде не потрібно!
                        // ==========================================
                        if (winMultiplier >= 10) {
                            let bannerTex = '/assets/niceWin.png';
                            if (winMultiplier >= 50) bannerTex = '/assets/megaWin.png';
                            else if (winMultiplier >= 20) bannerTex = '/assets/bigWin.png';

                            const wowSprite = Sprite.from(bannerTex);
                            wowSprite.anchor.set(0.5);
                            wowSprite.x = 0; 
                            wowSprite.y = 0;
                            wowSprite.scale.set(1);
                            wowSprite.zIndex = 9999;
                            mainContainer.addChild(wowSprite);

                            // Різко збільшуємо до x2.5 і розчиняємо альфу
                            tweenTo(wowSprite.scale, 'x', 2.5, 600, lerp, null, null);
                            tweenTo(wowSprite.scale, 'y', 2.5, 600, lerp, null, null);
                            tweenTo(wowSprite, 'alpha', 0, 600, lerp, null, () => {
                                wowSprite.destroy(); // Видаляємо після анімації
                                finishSpinSequence();
                            });
                        } else {
                            // Якщо це звичайний виграш — просто йдемо далі
                            finishSpinSequence(); 
                        }
                        // ==========================================
                    });
                });

                if (winMultiplier < 10) {
                    setTimeout(() => {
                        finishSpinSequence(); 
                    }, countDuration); 
                }

            } else {
                finishSpinSequence(); 
            }
        }
    }
    
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
        spinSound.muted = isMutedLocally;
        stopSound.muted = isMutedLocally;
        countSound.muted = isMutedLocally; 
        bannerSound.muted = isMutedLocally; // 👈 Банер теж вимикається кнопкою
        
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
    // 🔄 КНОПКА АВТОСПІНУ
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

    const checkAndTriggerAutoSpin = (delay: number = 0) => {
        if (!(window as any).isAutoSpinActive) return;

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