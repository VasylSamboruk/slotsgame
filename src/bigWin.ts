import { Container, Sprite, Ticker, Graphics, BlurFilter, Assets } from 'pixi.js';
import { tweenTo, backout, lerp } from './animations';

export function showBigWinOverlay(
    container: Container,
    totalWinAmount: number,
    betAmount: number,
    onComplete: () => void // СУВОРО 4 АРГУМЕНТИ!
) {
    const winMultiplier = totalWinAmount / betAmount;

    if (winMultiplier < 10) {
        onComplete();
        return;
    }

    let currentTexturePath = '/assets/niceWin.png';
    let themeColor = 0x00ff33; 

    const masterOverlay = new Container();
    masterOverlay.alpha = 0; 
    masterOverlay.eventMode = 'none'; 
    container.addChild(masterOverlay);

    const screenGlow = new Graphics();
    screenGlow.circle(0, 0, 700); 
    screenGlow.fill({ color: themeColor, alpha: 0.35 });
    screenGlow.filters = [new BlurFilter(100)]; 
    screenGlow.blendMode = 'add'; 
    masterOverlay.addChild(screenGlow);

    const sparksContainer = new Container();
    masterOverlay.addChild(sparksContainer);

    const winContainer = new Container();
    winContainer.x = 0;
    winContainer.y = 800; 
    winContainer.scale.set(0);
    masterOverlay.addChild(winContainer);

    const localGlow = new Graphics();
    localGlow.circle(0, 0, 300);
    localGlow.fill({ color: themeColor, alpha: 0.6 });
    localGlow.filters = [new BlurFilter(50)];
    winContainer.addChild(localGlow);

    const winSprite = Sprite.from(currentTexturePath);
    winSprite.anchor.set(0.5);
    winContainer.addChild(winSprite);

    const shine = Sprite.from(currentTexturePath);
    shine.anchor.set(0.5);
    shine.blendMode = 'add'; 
    shine.alpha = 0;
    winContainer.addChild(shine);

    // ✨ БЕЗПЕЧНИЙ І ПЛАВНИЙ АПГРЕЙД ТАБЛИЧКИ (Через alpha та scale)
    let isUpgrading = false;
    const upgradeTier = (newTexture: string, newColor: number) => {
        if (isUpgrading) return;
        isUpgrading = true;

        // Зменшуємо і розчиняємо табличку
        tweenTo(winSprite, 'alpha', 0, 150, lerp, null, () => {
            // Міняємо текстуру і колір
            currentTexturePath = newTexture;
            winSprite.texture = Assets.get(newTexture);
            shine.texture = Assets.get(newTexture);
            themeColor = newColor;

            screenGlow.clear();
            screenGlow.circle(0, 0, 700);
            screenGlow.fill({ color: themeColor, alpha: 0.35 });

            localGlow.clear();
            localGlow.circle(0, 0, 300);
            localGlow.fill({ color: themeColor, alpha: 0.6 });

            // Спалах світла
            localGlow.scale.set(1.6);
            tweenTo(localGlow.scale, 'x', 1, 300, backout(1.5), null, null);
            tweenTo(localGlow.scale, 'y', 1, 300, backout(1.5), null, null);

            // Повертаємо табличку на екран із красивим ефектом появи
            winSprite.scale.set(0.5);
            tweenTo(winSprite, 'alpha', 1, 200, lerp, null, null);
            tweenTo(winSprite.scale, 'x', 1, 300, backout(1.8), null, () => {
                isUpgrading = false;
            });
            tweenTo(winSprite.scale, 'y', 1, 300, backout(1.8), null, null);
        });
    };

    const sparks: Graphics[] = [];
    let isActive = false;
    let tickCount = 0;
    let timeouts: any[] = [];
    
    const effectsTicker = (ticker: any) => {
        if (!isActive) return;
        const dt = ticker.deltaTime;
        tickCount += dt * 0.1;
        
        // Якщо йде апгрейд, не чіпаємо scale автоматично, щоб не ламати анімацію
        if (!isUpgrading) {
            const targetScale = 1.2 + Math.sin(tickCount * 1.5) * 0.05;
            winContainer.scale.set(targetScale);
        }

        winContainer.rotation = Math.sin(tickCount) * 0.05;
        
        screenGlow.scale.set(1 + Math.sin(tickCount * 1.2) * 0.2); 
        screenGlow.alpha = 0.35 + Math.sin(tickCount * 2) * 0.1; 
        localGlow.scale.set(1 + Math.sin(tickCount * 2) * 0.15); 
        shine.alpha = (Math.sin(tickCount * 3) * 0.5 + 0.5) * 0.5; 

        if (Math.random() < 0.6) { 
            const spark = new Graphics();
            const sparkColor = Math.random() > 0.5 ? 0xffffff : themeColor;
            
            spark.circle(0, 0, Math.random() * 5 + 2); 
            spark.fill({ color: sparkColor, alpha: Math.random() * 0.8 + 0.2 });
            spark.blendMode = 'add';
            
            spark.x = (Math.random() - 0.5) * 1600; 
            spark.y = (Math.random() - 0.5) * 600 + 300; 
            
            (spark as any).vx = (Math.random() - 0.5) * 8; 
            (spark as any).vy = -(Math.random() * 8 + 4); 
            
            sparksContainer.addChild(spark);
            sparks.push(spark);
        }

        for (let i = sparks.length - 1; i >= 0; i--) {
            const s = sparks[i];
            s.x += (s as any).vx * dt;
            s.y += (s as any).vy * dt;
            s.alpha -= 0.01 * dt; 
            s.scale.set(1 + Math.sin(tickCount * 5 + i) * 0.5); 
            
            if (s.alpha <= 0) {
                s.destroy();
                sparks.splice(i, 1);
            }
        }
    };

    tweenTo(masterOverlay, 'alpha', 1, 400, lerp, null, null); 
    tweenTo(winContainer, 'y', 0, 500, backout(1.2), null, null);
    
    tweenTo(winContainer.scale, 'x', 1.2, 500, backout(1.5), null, null);
    tweenTo(winContainer.scale, 'y', 1.2, 500, backout(1.5), null, () => {
        
        isActive = true;
        Ticker.shared.add(effectsTicker);

        if (winMultiplier >= 20) {
            timeouts.push(setTimeout(() => {
                upgradeTier('/assets/bigWin.png', 0xff8800); 
            }, 2000));
        }
        if (winMultiplier >= 50) {
            timeouts.push(setTimeout(() => {
                upgradeTier('/assets/megaWin.png', 0xb800ff); 
            }, 4000));
        }

        let isClosing = false;
        
        // Функція закриття банера (спільна для кліку і таймера)
        const closeBanner = () => {
            if (isClosing) return;
            isClosing = true;
            window.removeEventListener('pointerdown', closeBanner);

            timeouts.forEach(clearTimeout);
            isActive = false;
            Ticker.shared.remove(effectsTicker);

            // ❌ ПОЛІТ ВГОРУ ПРИБРАНО!
            // tweenTo(winContainer, 'y', -1000, 500, backout(1.2), null, null);

            // Залишаємо тільки плавне зменшення на місці перед ВАУ-ефектом
            tweenTo(winContainer.scale, 'x', 0, 400, lerp, null, null);
            tweenTo(winContainer.scale, 'y', 0, 400, lerp, null, null);
            
            tweenTo(masterOverlay, 'alpha', 0, 500, lerp, null, () => {
                masterOverlay.destroy({ children: true }); 
                onComplete(); 
            });
        };

        // Залишаємо можливість закрити по кліку (активується через 1с, щоб не скіпнули випадково)
        setTimeout(() => {
            window.addEventListener('pointerdown', closeBanner);
        }, 1000); 

        // ==========================================
        // 🔥 АВТОМАТИЧНЕ ЗАКРИТТЯ СИНХРОННО З МУЗИКОЮ
        // (Можеш видалити цей блок, якщо захочеш повернути лише закриття по кліку)
        // ==========================================
        let autoCloseTime = 2500; // Час для Nice Win (якщо немає апгрейдів)
        if (winMultiplier >= 50) autoCloseTime = 6500; // Mega Win
        else if (winMultiplier >= 20) autoCloseTime = 4500; // Big Win

        timeouts.push(setTimeout(() => {
            closeBanner();
        }, autoCloseTime));
        // ==========================================

    });
}