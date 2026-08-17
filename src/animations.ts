import { Ticker } from 'pixi.js';

const tweening: any[] = [];

export function tweenTo(object: any, property: string, target: number, time: number, easing: Function, onchange: Function | null, oncomplete: Function | null) {
    const tween = { object, property, propertyBeginValue: object[property], target, easing, time, change: onchange, complete: oncomplete, start: Date.now() };
    tweening.push(tween);
    return tween;
}

// НОВА ФУНКЦІЯ: Вбиває старі анімації об'єкта, щоб вони не конфліктували при швидкому кліку
export function killTweensOf(object: any) {
    for (let i = tweening.length - 1; i >= 0; i--) {
        if (tweening[i].object === object) {
            tweening.splice(i, 1);
        }
    }
}

const interpolate = (a1: number, a2: number, t: number) => a1 + t * (a2 - a1);

Ticker.shared.add(() => {
    const now = Date.now();
    const remove = [];
    for (let i = 0; i < tweening.length; i++) {
        const t = tweening[i];
        const phase = Math.min(1, (now - t.start) / t.time);
        t.object[t.property] = interpolate(t.propertyBeginValue, t.target, t.easing(phase));
        if (t.change) t.change(t);
        if (phase === 1) {
            t.object[t.property] = t.target;
            if (t.complete) t.complete(t);
            remove.push(t);
        }
    }
    for (let i = 0; i < remove.length; i++) {
        tweening.splice(tweening.indexOf(remove[i]), 1);
    }
});

export const lerp = (t: number) => t; 
export const backout = (amount: number) => (t: number) => --t * t * ((amount + 1) * t + amount) + 1;

// ==========================================
// ГОТОВІ АНІМАЦІЇ ДЛЯ КНОПОК
// ==========================================

export function animateButtonPress(sprite: any, baseSize: number) {
    killTweensOf(sprite); // Зупиняємо попереднє стискання
    tweenTo(sprite, 'width', baseSize * 0.85, 80, lerp, null, () => {
        tweenTo(sprite, 'width', baseSize, 80, lerp, null, null);
    });
    tweenTo(sprite, 'height', baseSize * 0.85, 80, lerp, null, () => {
        tweenTo(sprite, 'height', baseSize, 80, lerp, null, null);
    });
}

export function animateSpinButton(sprite: any, baseSize: number) {
    killTweensOf(sprite); // Зупиняємо попереднє стискання
    sprite.rotation = 0; // Скидаємо обертання, якщо швидко клікають
    tweenTo(sprite, 'width', baseSize * 0.85, 80, lerp, null, () => {
        tweenTo(sprite, 'width', baseSize, 300, backout(2), null, null);
    });
    tweenTo(sprite, 'height', baseSize * 0.85, 80, lerp, null, () => {
        tweenTo(sprite, 'height', baseSize, 300, backout(2), null, null);
    });
    tweenTo(sprite, 'rotation', 0.2, 80, lerp, null, () => {
        tweenTo(sprite, 'rotation', 0, 300, backout(2), null, null);
    });
}