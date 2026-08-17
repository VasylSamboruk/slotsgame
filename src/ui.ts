import { Container, Text, TextStyle, Sprite, FillGradient } from 'pixi.js';
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
    
    // Нові кнопки
    public btnInfo!: Sprite;
    public btnVolume!: Sprite;
    private isMuted: boolean = false; // Стан звуку
    
    private betIndex: number = 0;
    private availableBets: number[] = [1, 2, 5, 10, 20, 50, 100, 200, 500];

    public isSpinning: () => boolean = () => false;

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

        // ДОДАЄМО СВІТІННЯ ДЛЯ SPIN
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
            stroke: { color: 0x3e1d04, width: 6, join: 'round' }, 
            dropShadow: { 
                alpha: 1, 
                angle: Math.PI / 2, 
                blur: 0,            
                color: 0x240d00,    
                distance: 6         
            }
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

        // ДОДАЄМО СВІТІННЯ ДЛЯ МІНУСА
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
            stroke: { color: 0x3e1d04, width: 7, join: 'round' }, 
            dropShadow: { 
                alpha: 1, 
                angle: Math.PI / 2, 
                blur: 0,            
                color: 0x240d00,    
                distance: 7         
            }
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
            stroke: { color: 0x3e1d04, width: 6, join: 'round' }, 
            dropShadow: { 
                alpha: 1, 
                angle: Math.PI / 2, 
                blur: 0,            
                color: 0x240d00,    
                distance: 5         
            }
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

        // ДОДАЄМО СВІТІННЯ ДЛЯ ПЛЮСА
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

        this.winText = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Skranji',
                fontSize: 85, 
                fontWeight: '900',
                letterSpacing: 2,
                fill: [0xffefcc, 0xdca052, 0xab5f17] as any, 
                stroke: { color: 0x3e1d04, width: 10, join: 'round' }, 
                dropShadow: { 
                    alpha: 1, 
                    angle: Math.PI / 2, 
                    blur: 0,            
                    color: 0x240d00,    
                    distance: 8         
                }
            })
        });
        this.winText.anchor.set(0.5);
        this.winText.x = 0;
        this.winText.y = 550; 
        this.winText.alpha = 0;
        this.container.addChild(this.winText);

        // ==========================================
        // КНОПКА ІНФО (Лівий верхній кут)
        // ==========================================
        this.btnInfo = Sprite.from('/assets/infoBtn.png');
        this.btnInfo.anchor.set(0.5);
        this.btnInfo.width = 110; 
        this.btnInfo.height = 110;
        this.btnInfo.x = -1250; 
        this.btnInfo.y = -650; 
        this.btnInfo.eventMode = 'static';
        this.btnInfo.cursor = 'pointer';

        const infoGlow = new Sprite(this.btnInfo.texture);
        infoGlow.anchor.set(0.5);
        infoGlow.blendMode = 'add';
        infoGlow.alpha = 0;
        this.btnInfo.addChild(infoGlow);

        this.btnInfo.on('pointerdown', (e) => {
            e.stopPropagation();
            animateButtonPress(this.btnInfo, 110);
            
            killTweensOf(infoGlow);
            infoGlow.alpha = 0.8;
            tweenTo(infoGlow, 'alpha', 0, 400, lerp, null, null);
        });
        this.container.addChild(this.btnInfo);

        // ==========================================
        // КНОПКА ЗВУКУ (З перемиканням текстур)
        // ==========================================
        this.btnVolume = Sprite.from('/assets/volumeAdd.png');
        this.btnVolume.anchor.set(0.5);
        this.btnVolume.width = 110; 
        this.btnVolume.height = 110;
        this.btnVolume.x = -1250; 
        this.btnVolume.y = -520; 
        this.btnVolume.eventMode = 'static';
        this.btnVolume.cursor = 'pointer';

        const volumeGlow = new Sprite(this.btnVolume.texture);
        volumeGlow.anchor.set(0.5);
        volumeGlow.blendMode = 'add';
        volumeGlow.alpha = 0;
        this.btnVolume.addChild(volumeGlow);

        this.btnVolume.on('pointerdown', (e) => {
            e.stopPropagation();
            animateButtonPress(this.btnVolume, 110);
            
            // Змінюємо стан звуку та саму текстуру кнопки
            this.isMuted = !this.isMuted;
            const newTexturePath = this.isMuted ? '/assets/volumeMin.png' : '/assets/volumeAdd.png';
            this.btnVolume.texture = Sprite.from(newTexturePath).texture;
            volumeGlow.texture = this.btnVolume.texture; // Оновлюємо текстуру світіння теж
            
            // Запускаємо спалах світіння
            killTweensOf(volumeGlow);
            volumeGlow.alpha = 0.8;
            tweenTo(volumeGlow, 'alpha', 0, 400, lerp, null, null);
        });
        this.container.addChild(this.btnVolume);
    }

    private updateBetText() {
        this.currentBet = this.availableBets[this.betIndex];
        this.betText.text = `${this.currentBet} $`;
    }

    public deductBet(): boolean {
        if (this.balance < this.currentBet) {
            this.winText.text = 'НЕМАЄ КОШТІВ!';
            this.winText.style.fill = 0xff0000; 
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
        
        this.winText.alpha = 0;
        this.winText.style.fill = 0xffcc00; 
        return true; 
    }

    public addWin(amount: number) {
        this.balance += amount;
        this.displayWin = 0; 
        
        killTweensOf(this);

        tweenTo(this, 'displayBalance', this.balance, 1000, lerp, () => {
            this.balanceText.text = `${this.displayBalance.toFixed(2)} $`;
        }, () => {
            this.balanceText.text = `${this.balance.toFixed(2)} $`;
        });

        tweenTo(this, 'displayWin', amount, 1000, lerp, () => {
            this.winText.text = `You win: ${this.displayWin.toFixed(2)} $`;
        }, () => {
            this.winText.text = `You win: ${amount.toFixed(2)} $`;
        });
    }
}