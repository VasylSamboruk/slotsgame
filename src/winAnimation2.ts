import { Sprite, AnimatedSprite, Assets } from 'pixi.js';
import { tweenTo, lerp, backout } from './animations';

// =================================================================
// 📦 БЛОК АНІМАЦІЙ СКРИНІ (CHEST / SUNDUK)
// =================================================================
export function playChestAnimation(sprite: Sprite, symbolTexture: string, baseSX: number, baseSY: number) {
    if (!(sprite as any).isWinningAnim) return;

    const frames = [
        Assets.get(symbolTexture), 
        Assets.get('/assets/animation/sunduk1.png'),
        Assets.get('/assets/animation/sunduk2.png'),
        Assets.get('/assets/animation/sunduk3.png'),
    ];

    const animSprite = new AnimatedSprite(frames);
    animSprite.anchor.set(0.5);
    animSprite.width = sprite.width;
    animSprite.height = sprite.height;

    animSprite.animationSpeed = 0.08;
    animSprite.loop = true;
    animSprite.play();

    (sprite as any).animSprite = animSprite;

    sprite.visible = false;
    sprite.parent!.addChild(animSprite);
    animSprite.x = sprite.x;
    animSprite.y = sprite.y;

    animateCustomPulse(animSprite, baseSX, baseSY, 1.03, 600, 800);
}

// =================================================================
// 🐉 БЛОК АНІМАЦІЙ РОЖЕВОГО ДРАКОНА (D2)
// =================================================================
export function playDragon2Animation(sprite: Sprite, symbolTexture: string, baseSX: number, baseSY: number) {
    if (!(sprite as any).isWinningAnim) return;

    const frames = [
        Assets.get(symbolTexture), 
        Assets.get('/assets/animation/d2_1.png'),
        Assets.get('/assets/animation/d2_2.png'),
        Assets.get('/assets/animation/d2_3.png'),
        Assets.get('/assets/animation/d2_4.png'),
    ];

    const animSprite = new AnimatedSprite(frames);
    animSprite.anchor.set(0.5);
    animSprite.width = sprite.width;
    animSprite.height = sprite.height;

    animSprite.animationSpeed = 0.1;
    animSprite.loop = true;
    animSprite.play();

    (sprite as any).animSprite = animSprite;

    sprite.visible = false;
    sprite.parent!.addChild(animSprite);
    animSprite.x = sprite.x;
    animSprite.y = sprite.y;

    animateCustomPulse(animSprite, baseSX, baseSY, 1.06, 500, 700);
}

// =================================================================
// 🐲 БЛОК АНІМАЦІЙ СИНЬОГО ДРАКОНА (D3)
// =================================================================
export function playDragon3Animation(sprite: Sprite, symbolTexture: string, baseSX: number, baseSY: number) {
    if (!(sprite as any).isWinningAnim) return;

    const frames = [
        Assets.get(symbolTexture), // Базовий кадр d3.png
        Assets.get('/assets/animation/d3_2.png'),
        Assets.get('/assets/animation/d3_3.png'),
        Assets.get('/assets/animation/d3_4.png'),
        Assets.get('/assets/animation/d3_5.png'),
        Assets.get('/assets/animation/d3_6.png'),
    ];

    const animSprite = new AnimatedSprite(frames);
    animSprite.anchor.set(0.5);
    animSprite.width = sprite.width;
    animSprite.height = sprite.height;

    animSprite.animationSpeed = 0.1; // Швидкість анімації, можеш змінити за потреби
    animSprite.loop = true;
    animSprite.play();

    (sprite as any).animSprite = animSprite;

    sprite.visible = false;
    sprite.parent!.addChild(animSprite);
    animSprite.x = sprite.x;
    animSprite.y = sprite.y;

    // Пульсація
    animateCustomPulse(animSprite, baseSX, baseSY, 1.06, 500, 700);
}

// =================================================================
// 📜 БЛОК АНІМАЦІЙ СВИТКУ (SVITOK)
// =================================================================
export function playScrollAnimation(sprite: Sprite, symbolTexture: string, baseSX: number, baseSY: number) {
    if (!(sprite as any).isWinningAnim) return;

    const frames = [
        Assets.get(symbolTexture), 
        Assets.get('/assets/animation/svitok1.png'),
        Assets.get('/assets/animation/svitok2.png'),
        Assets.get('/assets/animation/svitok3.png'),
    ];

    const animSprite = new AnimatedSprite(frames);
    animSprite.anchor.set(0.5);
    animSprite.width = sprite.width;
    animSprite.height = sprite.height;

    animSprite.animationSpeed = 0.09;
    animSprite.loop = true;
    animSprite.play();

    (sprite as any).animSprite = animSprite;

    sprite.visible = false;
    sprite.parent!.addChild(animSprite);
    animSprite.x = sprite.x;
    animSprite.y = sprite.y;

    animateCustomPulse(animSprite, baseSX, baseSY, 1.05, 550, 750);
}

// =================================================================
// 🐲 БЛОК АНІМАЦІЙ ДРАКОНА 1 (D1)
// =================================================================
export function playDragon1Animation(sprite: Sprite, symbolTexture: string, baseSX: number, baseSY: number) {
    if (!(sprite as any).isWinningAnim) return;

    const frames = [
        Assets.get(symbolTexture), // Базовий кадр d1.png
        Assets.get('/assets/animation/d1_1.png'),
        Assets.get('/assets/animation/d1_2.png'),
        Assets.get('/assets/animation/d1_3.png'),
        Assets.get('/assets/animation/d1_4.png'),
        Assets.get('/assets/animation/d1_5.png'),
    ];

    const animSprite = new AnimatedSprite(frames);
    animSprite.anchor.set(0.5);
    animSprite.width = sprite.width;
    animSprite.height = sprite.height;

    animSprite.animationSpeed = 0.08; // Швидкість анімації
    animSprite.loop = true;
    animSprite.play();

    (sprite as any).animSprite = animSprite;

    sprite.visible = false;
    sprite.parent!.addChild(animSprite);
    animSprite.x = sprite.x;
    animSprite.y = sprite.y;

    // Пульсація
    animateCustomPulse(animSprite, baseSX, baseSY, 1.06, 500, 700);
}

// =================================================================
// 🐉 БЛОК АНІМАЦІЙ ЧЕРВОНОГО ДРАКОНА (D4)
// =================================================================
export function playDragon4Animation(sprite: Sprite, symbolTexture: string, baseSX: number, baseSY: number) {
    if (!(sprite as any).isWinningAnim) return;

    const frames = [
        Assets.get(symbolTexture), // Базовий кадр d4.png
        Assets.get('/assets/animation/d4_1.png'),
        Assets.get('/assets/animation/d4_2.png'),
        Assets.get('/assets/animation/d4_3.png'),
        Assets.get('/assets/animation/d4_4.png'),
        Assets.get('/assets/animation/d4_5.png'),
    ];

    const animSprite = new AnimatedSprite(frames);
    animSprite.anchor.set(0.5);
    animSprite.width = sprite.width;
    animSprite.height = sprite.height;

    animSprite.animationSpeed = 0.1; // Швидкість анімації
    animSprite.loop = true;
    animSprite.play();

    (sprite as any).animSprite = animSprite;

    sprite.visible = false;
    sprite.parent!.addChild(animSprite);
    animSprite.x = sprite.x;
    animSprite.y = sprite.y;

    // Пульсація
    animateCustomPulse(animSprite, baseSX, baseSY, 1.06, 500, 700);
}

// =================================================================
// 🃏 БЛОК АНІМАЦІЙ WILD
// =================================================================
export function playWildAnimation(sprite: Sprite, symbolTexture: string, baseSX: number, baseSY: number) {
    if (!(sprite as any).isWinningAnim) return;

    const frames = [
        Assets.get(symbolTexture), // Базовий кадр wild.png
        Assets.get('/assets/animation/wild1.png'),
        Assets.get('/assets/animation/wild2.png'),
        Assets.get('/assets/animation/wild3.png'),
    ];

    const animSprite = new AnimatedSprite(frames);
    animSprite.anchor.set(0.5);
    animSprite.width = sprite.width;
    animSprite.height = sprite.height;

    animSprite.animationSpeed = 0.05;
    animSprite.loop = true;
    animSprite.play();

    (sprite as any).animSprite = animSprite;

    sprite.visible = false;
    sprite.parent!.addChild(animSprite);
    animSprite.x = sprite.x;
    animSprite.y = sprite.y;

    animateCustomPulse(animSprite, baseSX, baseSY, 1.05, 500, 700);
}

// ==========================================
// 🎛️ УНІВЕРСАЛЬНА ПУЛЬСАЦІЯ ДЛЯ ПОКАДРОВИХ АНІМАЦІЙ
// ==========================================
function animateCustomPulse(
    animSprite: AnimatedSprite,
    baseSX: number,
    baseSY: number,
    scaleUp: number = 1.05,
    pulseSpeed: number = 600,
    pauseTime: number = 800
) {
    if (!animSprite.parent) return;

    tweenTo(animSprite.scale, 'y', baseSY * scaleUp, pulseSpeed, backout(1), null, null);
    tweenTo(animSprite.scale, 'x', baseSX * scaleUp, pulseSpeed, backout(1), null, () => {
        if (!animSprite.parent) return;
        tweenTo(animSprite.scale, 'x', baseSX, pulseSpeed, lerp, null, null);
        tweenTo(animSprite.scale, 'y', baseSY, pulseSpeed, lerp, null, () => {
            if (animSprite.parent) {
                // 🛑 Збережений фікс таймера для зупинки
                (animSprite as any).pulseTimeoutId = setTimeout(() => {
                    if (!animSprite.parent) return; 
                    animateCustomPulse(animSprite, baseSX, baseSY, scaleUp, pulseSpeed, pauseTime);
                }, pauseTime);
            }
        });
    });
}