import { Container, Text, TextStyle, Sprite, FillGradient, Graphics, Ticker, BlurFilter } from 'pixi.js';
import { animateButtonPress, tweenTo, lerp, killTweensOf } from './animations';

export class SlotUI {
    public container: Container;
    public balance: number;
    public currentBet: number;
    
    public displayBalance: number; 
    public displayWin: number = 0; 

    private balanceText!: Text;
    private betText!: Text;
    public winText!: Text; 
    public btnSpin!: Sprite; 
    
    public btnInfo!: Sprite;
    public btnVolume!: Sprite;
    private isMuted: boolean = false; 
    
    private betIndex: number = 0;
    private availableBets: number[] = [1, 2, 5, 10, 20, 50, 100, 200, 500];

    public isSpinning: () => boolean = () => false;

    // --- ЕЛЕМЕНТИ ДЛЯ ЕФЕКТІВ ЦИФР ---
    private winContainer!: Container;
    private winGlow!: Graphics;
    private sparks: Graphics[] = [];
    private tickCount: number = 0;
    private currentThemeColor: number = 0xff8800; // Колір за замовчуванням

    constructor(initialBalance: number) {
        this.container = new Container();
        this.balance = initialBalance;
        this.displayBalance = initialBalance; 
        this.currentBet = this.availableBets[this.betIndex];

        this.buildUI();
    }

    private buildUI() {
        const panelLeft = Sprite.from('/assets/pidkladka.png');
        panelLeft.anchor.set(0.5);
        panelLeft.x = -600; 
        panelLeft.y = 650;  
        this.container.addChild(panelLeft);

        const panelRight = Sprite.from('/assets/pidkladka2.png');
        panelRight.anchor.set(0.5);
        panelRight.x = 600; 
        panelRight.y = 650;
        this.container.addChild(panelRight);

        this.btnSpin = Sprite.from('/assets/spinBTN.png');
        this.btnSpin.anchor.set(0.5);
        this.btnSpin.width = 290; 
        this.btnSpin.height = 290;
        this.btnSpin.x = 0; 
        this.btnSpin.y = 650; 
        this.btnSpin.eventMode = 'static';
        this.btnSpin.cursor = 'pointer';

        const spinGlow = new Sprite(this.btnSpin.texture);
        spinGlow.anchor.set(0.5);
        spinGlow.blendMode = 'add';
        spinGlow.alpha = 0;
        this.btnSpin.addChild(spinGlow);

        this.btnSpin.on('pointerdown', () => {
            killTweensOf(spinGlow);
            spinGlow.alpha = 0.8;
            tweenTo(spinGlow, 'alpha', 0, 400, lerp, null, null);
        });

        this.container.addChild(this.btnSpin);

        const balanceStyle = new TextStyle({
            fontFamily: 'Skranji',
            fontSize: 55, 
            fontWeight: '900',
            letterSpacing: 2,
            fill: [0xffefcc, 0xdca052, 0xab5f17], 
            stroke: { color: 0x3e1d04, width: 6, join: 'round' }
        });
        
        this.balanceText = new Text({ text: `${this.displayBalance.toFixed(2)} $`, style: balanceStyle });
        this.balanceText.anchor.set(0.5); 
        this.balanceText.x = panelLeft.x; 
        this.balanceText.y = panelLeft.y + 25;  
        this.container.addChild(this.balanceText);

        const btnMinus = Sprite.from('/assets/minusBTN.png');
        btnMinus.anchor.set(0.5);
        btnMinus.width = 120; 
        btnMinus.height = 120;
        btnMinus.x = panelRight.x - 210; 
        btnMinus.y = panelRight.y + 10;
        btnMinus.eventMode = 'static';
        btnMinus.cursor = 'pointer';

        const minusGlow = new Sprite(btnMinus.texture);
        minusGlow.anchor.set(0.5);
        minusGlow.blendMode = 'add';
        minusGlow.alpha = 0;
        btnMinus.addChild(minusGlow);

        btnMinus.on('pointerdown', (e) => {
            e.stopPropagation(); 
            animateButtonPress(btnMinus, 120); 
            
            killTweensOf(minusGlow);
            minusGlow.alpha = 0.8;
            tweenTo(minusGlow, 'alpha', 0, 400, lerp, null, null);
            
            if (this.isSpinning()) return;
            if (this.betIndex > 0) {
                this.betIndex--;
                this.updateBetText();
            }
        });
        this.container.addChild(btnMinus);

        const betStyle = new TextStyle({
            fontFamily: 'Skranji',
            fontSize: 65, 
            fontWeight: '900',
            letterSpacing: 2,
            fill: [0xffefcc, 0xdca052, 0xab5f17], 
            stroke: { color: 0x3e1d04, width: 7, join: 'round' }
        });
        this.betText = new Text({ text: `${this.currentBet} $`, style: betStyle });
        this.betText.anchor.set(0.5);
        this.betText.x = panelRight.x; 
        this.betText.y = panelRight.y + 25;
        this.container.addChild(this.betText);

        const goldGradient = new FillGradient(0, 0, 0, 45); 
        goldGradient.addColorStop(0, 0xffefcc);   
        goldGradient.addColorStop(0.5, 0xdca052); 
        goldGradient.addColorStop(1, 0xab5f17);   

        const labelStyle = new TextStyle({
            fontFamily: 'Skranji',
            fontSize: 45, 
            fontWeight: '900',
            letterSpacing: 2,
            fill: goldGradient, 
            stroke: { color: 0x3e1d04, width: 6, join: 'round' }
        });

        const balanceLabel = new Text({ text: 'BALANCE', style: labelStyle });
        balanceLabel.anchor.set(0.5);
        balanceLabel.x = panelLeft.x; 
        balanceLabel.y = panelLeft.y - 65; 
        this.container.addChild(balanceLabel);

        const betLabel = new Text({ text: 'BET', style: labelStyle });
        betLabel.anchor.set(0.5);
        betLabel.x = panelRight.x; 
        betLabel.y = panelRight.y - 65; 
        this.container.addChild(betLabel);

        const btnPlus = Sprite.from('/assets/plusBTN.png');
        btnPlus.anchor.set(0.5);
        btnPlus.width = 120;
        btnPlus.height = 120;
        btnPlus.x = panelRight.x + 220; 
        btnPlus.y = panelRight.y + 10;
        btnPlus.eventMode = 'static';
        btnPlus.cursor = 'pointer';

        const plusGlow = new Sprite(btnPlus.texture);
        plusGlow.anchor.set(0.5);
        plusGlow.blendMode = 'add';
        plusGlow.alpha = 0;
        btnPlus.addChild(plusGlow);

        btnPlus.on('pointerdown', (e) => {
            e.stopPropagation();
            animateButtonPress(btnPlus, 120);
            
            killTweensOf(plusGlow);
            plusGlow.alpha = 0.8;
            tweenTo(plusGlow, 'alpha', 0, 400, lerp, null, null);
            
            if (this.isSpinning()) return;
            if (this.betIndex < this.availableBets.length - 1) {
                this.betIndex++;
                this.updateBetText();
            }
        });
        this.container.addChild(btnPlus);

        // ==========================================
        // 🔥 ВИГРАШ ТЕПЕР НАВЕРХУ (y = -740)
        // ==========================================
        this.winContainer = new Container();
        this.winContainer.x = -30; // 👈 Зсув вліво (можеш підібрати точніше: -20, -40 тощо)
        this.winContainer.y = -700; // 👈 Опускаємо нижче на плашку (міняй -740 на менше за модулем, наприклад -700 або -680)        this.winContainer.eventMode = 'none'; // ВАЖЛИВО: Ніколи не перекриває кліки!
        this.container.addChild(this.winContainer);

        // Локальне світіння за цифрами
        this.winGlow = new Graphics();
        this.winGlow.circle(0, 0, 250);
        this.winGlow.fill({ color: 0xff6600, alpha: 0.5 });
        this.winGlow.filters = [new BlurFilter(50)];
        this.winGlow.blendMode = 'add';
        this.winGlow.alpha = 0;
        this.winContainer.addChild(this.winGlow);

        // Цифри виграшу
        this.winText = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Skranji',
                fontSize: 85, // Оптимальний розмір для верхньої рамки
                fontWeight: '900',
                letterSpacing: 3,
                fill: [0xfff9c4, 0xffca28, 0xff8f00] as any, 
                stroke: { color: 0x3e1d04, width: 10, join: 'round' }
            })
        });
        this.winText.x = +60; // 👈 Зсув вліво (можеш поставити -50 чи -60, якщо мало)
        this.winText.y = 90;  // 👈 Опускаємо вниз на саму плашку (постав 40, 50 або 60)
        this.winText.anchor.set(0.5);
        this.winText.alpha = 0;
        this.winContainer.addChild(this.winText);

        Ticker.shared.add(this.winEffectTicker.bind(this));

        // ==========================================
        // КНОПКА ІНФО ТА ЗВУКУ
        // ==========================================
        this.btnInfo = Sprite.from('/assets/infoBtn.png');
        this.btnInfo.anchor.set(0.5);
        this.btnInfo.width = 110; 
        this.btnInfo.height = 110;
        this.btnInfo.x = -1250; 
        this.btnInfo.y = -650; 
        this.btnInfo.eventMode = 'static';
        this.btnInfo.cursor = 'pointer';
        this.container.addChild(this.btnInfo);

        this.btnVolume = Sprite.from('/assets/volumeAdd.png');
        this.btnVolume.anchor.set(0.5);
        this.btnVolume.width = 110; 
        this.btnVolume.height = 110;
        this.btnVolume.x = -1250; 
        this.btnVolume.y = -520; 
        this.btnVolume.eventMode = 'static';
        this.btnVolume.cursor = 'pointer';
        this.container.addChild(this.btnVolume);

        this.btnVolume.on('pointerdown', (e) => {
            e.stopPropagation();
            animateButtonPress(this.btnVolume, 110);
            this.isMuted = !this.isMuted;
            const newTexturePath = this.isMuted ? '/assets/volumeMin.png' : '/assets/volumeAdd.png';
            this.btnVolume.texture = Sprite.from(newTexturePath).texture;
        });
    }

    // 🔥 ТІКЕР: ДУЖЕ М'ЯКА АНІМАЦІЯ
    private winEffectTicker(ticker: any) {
        if (this.winText.alpha <= 0) return;

        const dt = ticker.deltaTime;
        this.tickCount += dt * 0.05; // Сповільнив загальний час

        const currentMultiplier = this.displayWin / this.currentBet;
        if (currentMultiplier < 0.1) return; 
        
        // Дуже м'яка пульсація
        const pulseIntensity = Math.min(0.08, currentMultiplier * 0.002); 
        
        const scale = 1 + Math.sin(this.tickCount * 2) * pulseIntensity;
        this.winText.scale.set(scale);
        this.winText.rotation = Math.sin(this.tickCount * 1.5) * (pulseIntensity * 0.3); 

        this.winGlow.scale.set(scale * 1.1);
        this.winGlow.alpha = 0.5 + Math.sin(this.tickCount * 2) * 0.2;

        // 🎇 ГЕНЕРАЦІЯ ІСКОР ПІД КОЛІР БАНЕРА
        if (Math.random() < 0.2 + pulseIntensity) { 
            const spark = new Graphics();
            // Іскри або білі, або під колір поточного банера
            const color = Math.random() > 0.5 ? 0xffffff : this.currentThemeColor;
            
            spark.circle(0, 0, Math.random() * 4 + 2);
            spark.fill({ color, alpha: 0.8 });
            spark.blendMode = 'add';
            
            spark.x = (Math.random() - 0.5) * 350; 
            spark.y = (Math.random() - 0.5) * 40 + 20; 
            
            (spark as any).vx = (Math.random() - 0.5) * 3;
            (spark as any).vy = -(Math.random() * 4 + 2);
            
            this.winContainer.addChildAt(spark, 1); 
            this.sparks.push(spark);
        }

        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const s = this.sparks[i];
            s.x += (s as any).vx * dt;
            s.y += (s as any).vy * dt;
            s.alpha -= 0.015 * dt;
            
            if (s.alpha <= 0) {
                s.destroy();
                this.sparks.splice(i, 1);
            }
        }
    }

    private updateBetText() {
        this.currentBet = this.availableBets[this.betIndex];
        this.betText.text = `${this.currentBet} $`;
    }

    public deductBet(): boolean {
        if (this.balance < this.currentBet) {
            this.winText.text = 'НЕМАЄ КОШТІВ!';
            // Якщо немає коштів, повертаємо на старе місце вниз, щоб гравець побачив
            this.winContainer.y = 550;
            this.winText.style = new TextStyle({ fontFamily: 'Skranji', fontSize: 60, fill: 0xff0000 });
            this.winText.alpha = 1;
            return false; 
        }
        
        this.balance -= this.currentBet;
        
        killTweensOf(this);
        
        tweenTo(this, 'displayBalance', this.balance, 200, lerp, () => {
            this.balanceText.text = `${this.displayBalance.toFixed(2)} $`;
        }, () => {
            this.balanceText.text = `${this.balance.toFixed(2)} $`;
        });
        
        // Скидаємо ефекти перед новим спіном
        this.winContainer.y = -740; // Повертаємо наверх
        this.winText.alpha = 0;
        this.winGlow.alpha = 0;
        this.displayWin = 0; 
        this.winText.scale.set(1);
        this.winText.rotation = 0;

        this.sparks.forEach(s => s.destroy());
        this.sparks = [];

        return true; 
    }

    public addWin(amount: number) {
        this.balance += amount;
        this.displayWin = 0; 
        
        killTweensOf(this);

        const winMultiplier = amount / this.currentBet;
        let duration = 2000; // Nice Win
        
        if (winMultiplier >= 50) {
            duration = 6500; // Mega Win (робимо довшим, щоб створити максимум інтриги на кожному етапі)
        } else if (winMultiplier >= 20) {
            duration = 4500; // Big Win
        }

        this.winText.alpha = 1;

        tweenTo(this, 'displayBalance', this.balance, duration, lerp, () => {
            this.balanceText.text = `${this.displayBalance.toFixed(2)} $`;
        }, () => {
            this.balanceText.text = `${this.balance.toFixed(2)} $`;
        });

        // 🔥 Використовуємо функцію сповільнення наприкінці (ease-out куб), 
        // щоб цифри створювали інтригу і плавно підходили до фіналу кожної стадії!
        const customEase = (t: number) => 1 - Math.pow(1 - t, 3);

        tweenTo(this, 'displayWin', amount, duration, customEase, () => {
            this.winText.text = `${this.displayWin.toFixed(2)} $`;
            this.updateWinThemeByProgress(this.displayWin); 
        }, () => {
            this.winText.text = `${amount.toFixed(2)} $`;
            this.updateWinThemeByProgress(amount); 
        });
    }

    // 🎨 Динамічна зміна кольору і світіння цифр залежно від поточної суми
    private updateWinThemeByProgress(currentAmount: number) {
        const currentMultiplier = currentAmount / this.currentBet;
        
        // 🌟 Базові кольори для простих/малих виграшів (< x10) — м'яке золото і темна СІРА обводка
        let themeColor = 0xffefcc; 
        let strokeColor = 0x222222; // Темно-сірий контур для простого виграшу
        let dropColor = 0x111111;

        if (currentMultiplier >= 50) {
            themeColor = 0xb800ff; // Фіолетовий (Mega Win)
            strokeColor = 0x4a0066;
            dropColor = 0x8800cc;
        } else if (currentMultiplier >= 20) {
            themeColor = 0xff8800; // Оранжевий (Big Win)
            strokeColor = 0x663300;
            dropColor = 0xcc6600;
        } else if (currentMultiplier >= 10) {
            themeColor = 0x00ff33; // Зелений (Nice Win)
            strokeColor = 0x004411;
            dropColor = 0x00aa22;
        }

        this.currentThemeColor = themeColor;

        // Оновлюємо колір світіння
        this.winGlow.clear();
        this.winGlow.circle(0, 0, 250);
        this.winGlow.fill({ color: themeColor, alpha: currentMultiplier >= 10 ? 0.6 : 0.2 }); // При малих виграшах світіння ледь помітне

        // Оновлюємо стиль тексту з правильним контуром
        this.winText.style = new TextStyle({
            fontFamily: 'Skranji',
            fontSize: 85,
            fontWeight: '900',
            letterSpacing: 4,
            fill: [0xffffff, 0xffefcc, themeColor] as any, 
            stroke: { color: strokeColor, width: 12, join: 'round' },
            dropShadow: { alpha: 1, angle: Math.PI / 2, blur: 15, color: dropColor, distance: 0 }
        });
    }
}