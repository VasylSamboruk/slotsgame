import { Sprite, Assets, Ticker } from 'pixi.js';

export function animateFon(fonSprite: Sprite) {
    // 🖼️ 1. Базові кадри з правильної папки
    const baseFrames = [
  
        '/assets/animation/fon2.png',
        '/assets/animation/fon3.png',
        '/assets/animation/fon3.png',
        '/assets/animation/fon4.png',
        '/assets/animation/fon5.png',
        '/assets/animation/fon6.png',
        '/assets/animation/fon7.png',
        '/assets/animation/fon8.png',
        '/assets/animation/fon9.png',
       
    ];

    // 🏓 2. Робимо "Пінг-Понг" ефект
    const pingPongFrames = [...baseFrames];
    for (let i = baseFrames.length - 2; i > 0; i--) {
        pingPongFrames.push(baseFrames[i]);
    }

    let currentFrame = 0;
    let elapsed = 0;
    const animationSpeed = 0.10; 

    // 🎬 3. Запускаємо нескінченний цикл
    Ticker.shared.add((ticker) => {
        elapsed += ticker.deltaTime * animationSpeed;
        
        if (elapsed >= 1) {
            currentFrame = (currentFrame + 1) % pingPongFrames.length;
            
            const nextTexture = Assets.get(pingPongFrames[currentFrame]);
            if (nextTexture) {
                fonSprite.texture = nextTexture; 
            }
            
            elapsed = 0;
        }
    });
}