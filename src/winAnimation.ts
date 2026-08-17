import { Container, Sprite, Graphics, AnimatedSprite } from 'pixi.js';
import { CONFIG } from './config';
import { type WinResult } from './winLogic';
import { SlotUI } from './ui';
import { tweenTo, lerp, backout, killTweensOf } from './animations';

// 🔥 ІМПОРТУЄМО ПОКАДРОВІ АНІМАЦІЇ З НОВОГО ФАЙЛУ 🔥
import { playChestAnimation, playDragon2Animation, playScrollAnimation, playDragon3Animation, playWildAnimation, playDragon1Animation, playDragon4Animation, playBonusAnimation } from './winAnimation2';


// ==========================================
// ЗУПИНКА АНІМАЦІЙ (Викликається при новому спіні)
// ==========================================
export function stopWinAnimations(reels: { container: Container, symbols: Sprite[] }[]) {
    reels.forEach(reel => {
        reel.symbols.forEach(sprite => {
            (sprite as any).isWinningAnim = false;

            // 🛑 ФІКС: "гасимо" поточне покоління анімації[cite: 8].
            (sprite as any).animGen = ((sprite as any).animGen || 0) + 1;

            // 🛑 ФІКС: чистимо "забутий" setTimeout з animateBasicWin[cite: 8]
            if ((sprite as any).winTimeoutId) {
                clearTimeout((sprite as any).winTimeoutId);
                (sprite as any).winTimeoutId = null;
            }

            killTweensOf(sprite);
            killTweensOf(sprite.scale);

            if ((sprite as any).animSprite) {
                const animSprite = (sprite as any).animSprite as AnimatedSprite;
                if ((animSprite as any).pulseTimeoutId) {
                    clearTimeout((animSprite as any).pulseTimeoutId);
                }
                animSprite.destroy();
                (sprite as any).animSprite = null;
                sprite.visible = true;
            }

            if (sprite.children.length > 0) {
                const glow = sprite.children[0];
                killTweensOf(glow);
                glow.destroy();
            }

            sprite.alpha = 1;
            sprite.rotation = 0;

            if ((sprite as any).baseSX !== undefined) {
                sprite.scale.x = Math.abs((sprite as any).baseSX);
                sprite.scale.y = Math.abs((sprite as any).baseSY);
            }
        });
    });
}

// ==========================================
// 🎛️ РОЗПОДІЛЬНИК АНІМАЦІЙ
// ==========================================
function playSymbolAnimation(sprite: Sprite, symbolTexture: string, baseSX: number, baseSY: number, gen: number) {
    const isChest = symbolTexture.includes('chest') || symbolTexture.includes('sunduk');
    const isDragon1 = symbolTexture.includes('d1');
    const isDragon2 = symbolTexture.includes('d2');
    const isDragon3 = symbolTexture.includes('d3');
    const isDragon4 = symbolTexture.includes('d4');
    const isScroll = symbolTexture.includes('svitok') || symbolTexture.includes('scroll');
    const isWild = symbolTexture.includes('wild');
    const isBonus = symbolTexture.includes('bonus'); // 🛑 ДОДАЛИ ПЕРЕВІРКУ НА БОНУС

    if (isChest) {
        playChestAnimation(sprite, symbolTexture, baseSX, baseSY);
    } else if (isDragon1) {
        playDragon1Animation(sprite, symbolTexture, baseSX, baseSY);
    } else if (isDragon2) {
        playDragon2Animation(sprite, symbolTexture, baseSX, baseSY);
    } else if (isDragon3) {
        playDragon3Animation(sprite, symbolTexture, baseSX, baseSY);
    } else if (isDragon4) {
        playDragon4Animation(sprite, symbolTexture, baseSX, baseSY);
    } else if (isScroll) {
        playScrollAnimation(sprite, symbolTexture, baseSX, baseSY); 
    } else if (isWild) {
        playWildAnimation(sprite, symbolTexture, baseSX, baseSY);
    } else if (isBonus) { // 🛑 ВИКЛИКАЄМО АНІМАЦІЮ БОНУСА
        playBonusAnimation(sprite, symbolTexture, baseSX, baseSY);
    } else {
        animateBasicWin(sprite, baseSX, baseSY, gen);
    }
}

// ==========================================
// БЕЗКІНЕЧНА АНІМАЦІЯ ДЛЯ ЗВИЧАЙНИХ СИМВОЛІВ (Без кадрів)
// ==========================================
function animateBasicWin(sprite: Sprite, baseSX: number, baseSY: number, gen: number) {
    // 🛑 ФІКС: перевіряємо і флаг, і покоління анімації[cite: 8].
    if (!(sprite as any).isWinningAnim || (sprite as any).animGen !== gen) return;

    let glow = sprite.children[0] as Sprite;
    if (!glow) {
        glow = new Sprite(sprite.texture);
        glow.anchor.set(0.5);
        glow.blendMode = 'add';
        glow.tint = 0xffd700;
        glow.alpha = 0;
        sprite.addChild(glow);
    }

    const scaleUp = 1.15;

    tweenTo(glow, 'alpha', 0.8, 300, lerp, null, () => {
        tweenTo(glow, 'alpha', 0, 700, lerp, null, null);
    });

    tweenTo(sprite.scale, 'y', baseSY * scaleUp, 200, backout(1), null, null);
    tweenTo(sprite.scale, 'x', baseSX * scaleUp, 200, backout(1), null, () => {
        if (!(sprite as any).isWinningAnim || (sprite as any).animGen !== gen) return;

        tweenTo(sprite.scale, 'x', 0, 150, lerp, null, () => {
            tweenTo(sprite.scale, 'x', -baseSX * scaleUp, 150, lerp, null, () => {
                tweenTo(sprite.scale, 'x', 0, 150, lerp, null, () => {
                    tweenTo(sprite.scale, 'x', baseSX * scaleUp, 150, lerp, null, () => {
                        if (!(sprite as any).isWinningAnim || (sprite as any).animGen !== gen) return;

                        tweenTo(sprite.scale, 'x', baseSX, 200, lerp, null, null);
                        tweenTo(sprite.scale, 'y', baseSY, 200, lerp, null, () => {
                            if ((sprite as any).isWinningAnim && (sprite as any).animGen === gen) {
                                // 🛑 ФІКС: зберігаємо id таймера на спрайті[cite: 8]
                                (sprite as any).winTimeoutId = setTimeout(() => {
                                    animateBasicWin(sprite, baseSX, baseSY, gen);
                                }, 800);
                            }
                        });
                    });
                });
            });
        });
    });
}

// ==========================================
// ГОЛОВНА ФУНКЦІЯ ОБРОБКИ ВИГРАШУ
// ==========================================
export function playWinAnimation(
    wins: WinResult[],
    reels: { container: Container, symbols: Sprite[] }[],
    winLinesGraphic: Graphics,
    ui: SlotUI,
    onComplete: () => void
) {
    let totalWinAmount = 0;
    winLinesGraphic.clear();

    reels.forEach(reel => {
        for (let r = 0; r < CONFIG.ROW_COUNT; r++) {
            const visibleIndex = CONFIG.SYMBOLS_PER_REEL - 3 + r;
            reel.symbols[visibleIndex].alpha = 0.4;
        }
    });

    const animatedPositions = new Set<string>();

    wins.forEach(win => {
        totalWinAmount += win.amount;

    
        
        // Обводимо лінію (PixiJS v8)
        winLinesGraphic.stroke({ width: 8, color: 0xffd700, alpha: 0.8 });

        win.positions.forEach(pos => {
            const posKey = `${pos.c}_${pos.r}`;
            if (!animatedPositions.has(posKey)) {
                animatedPositions.add(posKey);

                const visibleIndex = CONFIG.SYMBOLS_PER_REEL - 3 + pos.r;
                const sprite = reels[pos.c].symbols[visibleIndex];

                sprite.alpha = 1;

                if (!(sprite as any).isWinningAnim) {
                    (sprite as any).isWinningAnim = true;

                    const newGen = ((sprite as any).animGen || 0) + 1;
                    (sprite as any).animGen = newGen;

                    const baseSX = Math.abs(sprite.scale.x);
                    const baseSY = Math.abs(sprite.scale.y);
                    (sprite as any).baseSX = baseSX;
                    (sprite as any).baseSY = baseSY;

                    // 🛑 НАЙГОЛОВНІШИЙ ФІКС: Беремо СПРАВЖНЮ текстуру клітинки, а не загальний символ лінії!
                    // Wild тепер буде анімуватися як Wild!
                    const trueSymbolTexture = pos.actualSym; 
                    playSymbolAnimation(sprite, trueSymbolTexture, baseSX, baseSY, newGen);
                }
            }
        });
    });

    ui.addWin(totalWinAmount);

    killTweensOf(ui.winText);

    tweenTo(ui.winText, 'alpha', 1, 500, lerp, null, () => {
        setTimeout(() => {
            onComplete();
        }, 500);
    });
}