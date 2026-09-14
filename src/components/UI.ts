import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GAME_CONFIG } from '../constants';

export class UI extends Container {
    private bottomBar: Container;
    private balanceLabel!: Text;
    private balanceValue!: Text;
    private betLabel!: Text;
    private betValue!: Text;
    private winValue!: Text;
    
    private statusContainer!: Container;
    private statusBg!: Graphics;
    private statusText!: Text; 
    
    private spinBtn!: Container;
    private buyBonusBtn!: Container;
    private btnMinus!: Container;
    private btnPlus!: Container;
    
    private bonusModal: Container;
    private modalContent!: Container;
    private modalHeader!: Container;
    private cardsContainer!: Container;
    private closeBtn!: Container;
    
    private modalMask!: Graphics;
    private scrollArea!: Container;
    private scrollBg!: Graphics;
    private dragState = { isDragging: false, startY: 0, startContainerY: 0, dragMoved: false };
    
    private bonusCards: Container[] = [];
    private modalPrices: { text: Text, multiplier: number }[] = [];
    private modalBetValue!: Text;
    
    // Зберігаємо посилання на кнопки карток для зміни їх статусу
    private cardButtonData: { btnBg: Graphics, btnTxt: Text, mode: number, isFeature: boolean }[] = [];
    private currentFeatureMode: number = 0;

    public onSpinClick: () => void = () => {};
    public onBetChange: (direction: 1 | -1) => void = () => {};
    public onBuyBonus: (type: number) => void = () => {};
    public onToggleFeatureSpins: (mode: number) => void = () => {};

    constructor() {
        super();
        this.bottomBar = new Container();
        this.addChild(this.bottomBar);
        this.buildBottomBar();
        
        this.bonusModal = new Container();
        this.bonusModal.visible = false;
        this.addChild(this.bonusModal);
        this.buildBonusModal();
    }

    private buildBottomBar() {
        const styleLabel = new TextStyle({ fontSize: 13, fill: 0xdddddd, fontWeight: 'bold' });
        const styleValue = new TextStyle({ fontSize: 22, fill: 0xffffff, fontWeight: '900', stroke: { color: 0x000000, width: 4 } });
        const styleWin = new TextStyle({ fontSize: 26, fill: 0xf1c40f, fontWeight: '900', stroke: { color: 0x000000, width: 5 } });

        this.statusContainer = new Container();
        this.statusBg = new Graphics();
        this.statusText = new Text({ text: '', style: new TextStyle({ fontSize: 20, fill: 0x2ecc71, fontWeight: '900' }) });
        this.statusText.anchor.set(0.5);
        this.statusContainer.addChild(this.statusBg, this.statusText);
        this.bottomBar.addChild(this.statusContainer);

        this.winValue = new Text({ text: '', style: styleWin });
        this.winValue.anchor.set(0.5, 1);
        this.bottomBar.addChild(this.winValue);

        this.balanceLabel = new Text({ text: 'BALANCE', style: styleLabel });
        this.balanceLabel.anchor.set(0, 1); 
        this.balanceValue = new Text({ text: '€0.00', style: styleValue });
        this.balanceValue.anchor.set(0, 1);
        this.bottomBar.addChild(this.balanceLabel, this.balanceValue);

        this.betLabel = new Text({ text: 'BET', style: styleLabel });
        this.betLabel.anchor.set(1, 1); 
        this.betValue = new Text({ text: '€1.00', style: styleValue });
        this.betValue.anchor.set(1, 1);
        this.bottomBar.addChild(this.betLabel, this.betValue);

        this.buyBonusBtn = new Container();
        this.buyBonusBtn.eventMode = 'static'; this.buyBonusBtn.cursor = 'pointer';
        const buyBg = new Graphics().circle(0, 0, 32).fill(0xf1c40f).stroke({ width: 3, color: 0x000000 });
        const buyTxt = new Text({ text: 'BUY\nBONUS', style: new TextStyle({ fontSize: 12, fill: 0x000000, fontWeight: '900', align: 'center' }) });
        buyTxt.anchor.set(0.5); buyTxt.rotation = -0.15;
        this.buyBonusBtn.addChild(buyBg, buyTxt);
        this.buyBonusBtn.on('pointerdown', () => this.buyBonusBtn.scale.set(0.9));
        this.buyBonusBtn.on('pointerup', () => { this.buyBonusBtn.scale.set(1); this.openBonusModal(); });
        this.buyBonusBtn.on('pointerupoutside', () => this.buyBonusBtn.scale.set(1));
        this.bottomBar.addChild(this.buyBonusBtn);

        this.btnMinus = this.buildBetButton('-', -1);
        this.btnPlus = this.buildBetButton('+', 1);

        this.spinBtn = new Container();
        this.spinBtn.eventMode = 'static'; this.spinBtn.cursor = 'pointer';
        const spinBg = new Graphics().circle(0, 0, 45).fill(0x2c3e50).stroke({ width: 4, color: 0xecf0f1 });
        const spinIcon = new Text({ text: '↻', style: new TextStyle({ fontSize: 45, fill: 0xffffff, fontWeight: 'bold' }) });
        spinIcon.anchor.set(0.5); spinIcon.y = -4;
        this.spinBtn.addChild(spinBg, spinIcon);
        this.spinBtn.on('pointerdown', () => this.spinBtn.scale.set(0.9));
        this.spinBtn.on('pointerup', () => { this.spinBtn.scale.set(1); this.onSpinClick(); });
        this.spinBtn.on('pointerupoutside', () => this.spinBtn.scale.set(1));
        this.bottomBar.addChild(this.spinBtn);
    }

    private buildBetButton(label: string, dir: 1 | -1): Container {
        const btn = new Container();
        btn.eventMode = 'static'; btn.cursor = 'pointer';
        const bg = new Graphics().roundRect(-18, -18, 36, 36, 5).fill(0x34495e);
        const txt = new Text({ text: label, style: new TextStyle({ fontSize: 24, fill: 0xffffff, fontWeight: 'bold' }) });
        txt.anchor.set(0.5); btn.addChild(bg, txt);
        btn.on('pointerdown', () => btn.alpha = 0.5);
        btn.on('pointerup', () => { btn.alpha = 1; this.onBetChange(dir); });
        btn.on('pointerupoutside', () => btn.alpha = 1);
        this.bottomBar.addChild(btn);
        return btn;
    }

    private buildBonusModal() {
        const overlay = new Graphics().rect(-3000, -3000, 8000, 8000).fill(0x000000);
        overlay.alpha = 0.85; overlay.eventMode = 'static';
        this.bonusModal.addChild(overlay);

        this.modalContent = new Container();
        this.bonusModal.addChild(this.modalContent);

        this.scrollArea = new Container();
        this.modalContent.addChild(this.scrollArea);
        
        this.scrollBg = new Graphics();
        this.scrollArea.addChild(this.scrollBg);
        
        this.cardsContainer = new Container();
        this.scrollArea.addChild(this.cardsContainer);

        this.modalMask = new Graphics();
        this.modalContent.addChild(this.modalMask);
        this.scrollArea.mask = this.modalMask;

        this.scrollArea.eventMode = 'static';
        this.scrollArea.on('pointerdown', (e) => {
            this.dragState.isDragging = true;
            this.dragState.dragMoved = false;
            this.dragState.startY = e.global.y;
            this.dragState.startContainerY = this.cardsContainer.y;
        });
        this.scrollArea.on('globalpointermove', (e) => {
            if (!this.dragState.isDragging) return;
            const dy = e.global.y - this.dragState.startY;
            if (Math.abs(dy) > 10) this.dragState.dragMoved = true;
            
            this.cardsContainer.y = this.dragState.startContainerY + dy;
            
            const minH = this.modalMask.height;
            const maxH = this.cardsContainer.height;
            
            if (maxH > minH) {
                if (this.cardsContainer.y > 0) this.cardsContainer.y = 0;
                if (this.cardsContainer.y < minH - maxH) this.cardsContainer.y = minH - maxH;
            } else {
                this.cardsContainer.y = 0;
            }
        });
        window.addEventListener('pointerup', () => this.dragState.isDragging = false);

        this.modalHeader = new Container();
        const headerBg = new Graphics().roundRect(0, 0, 320, 80, 15).fill(0xffffff);
        this.modalHeader.addChild(headerBg);
        
        const titleTxt = new Text({ text: 'BONUS BUY', style: new TextStyle({ fontSize: 20, fill: 0xffffff, fontWeight: '900' }) });
        titleTxt.anchor.set(0.5); titleTxt.position.set(160, -22);
        this.modalHeader.addChild(titleTxt);

        const mBetLabel = new Text({ text: 'BET', style: new TextStyle({ fontSize: 13, fill: 0x000000, fontWeight: 'bold' }) });
        mBetLabel.anchor.set(0.5); mBetLabel.position.set(80, 22);
        this.modalHeader.addChild(mBetLabel);

        this.modalBetValue = new Text({ text: '€1.00', style: new TextStyle({ fontSize: 24, fill: 0x000000, fontWeight: '900' }) });
        this.modalBetValue.anchor.set(0.5); this.modalBetValue.position.set(80, 52);
        this.modalHeader.addChild(this.modalBetValue);

        const createModalBtn = (label: string, x: number, dir: number) => {
            const btn = new Container();
            btn.eventMode = 'static'; btn.cursor = 'pointer';
            const bg = new Graphics().roundRect(0, 0, 42, 42, 10).fill(0x333333);
            const txt = new Text({ text: label, style: new TextStyle({ fontSize: 26, fill: 0xffffff, fontWeight: 'bold' }) });
            txt.anchor.set(0.5); txt.position.set(21, 21);
            btn.addChild(bg, txt);
            btn.position.set(x, 19);
            btn.on('pointerdown', () => btn.alpha = 0.7);
            btn.on('pointerup', () => { btn.alpha = 1; this.onBetChange(dir as 1|-1); });
            btn.on('pointerupoutside', () => btn.alpha = 1);
            return btn;
        };
        this.modalHeader.addChild(createModalBtn('-', 170, -1));
        this.modalHeader.addChild(createModalBtn('+', 240, 1));
        this.modalContent.addChild(this.modalHeader);

        const createCard = (title: string, desc: string, multiplier: number, btnColor: number, mode: number, isFeature: boolean, callback: () => void) => {
            const card = new Container();
            const bg = new Graphics().roundRect(0, 0, 240, 300, 15).fill(0xffffff);
            
            const tTxt = new Text({ text: title, style: new TextStyle({ fontSize: 15, fill: 0x000000, fontWeight: 'bold', align: 'center', wordWrap: true, wordWrapWidth: 220 }) });
            tTxt.anchor.set(0.5, 0); tTxt.position.set(120, 15);

            const dTxt = new Text({ text: desc, style: new TextStyle({ fontSize: 11, fill: 0x555555, align: 'center', wordWrap: true, wordWrapWidth: 210 }) });
            dTxt.anchor.set(0.5, 0); dTxt.position.set(120, 65);

            const mTxt = new Text({ text: `${multiplier}x BET`, style: new TextStyle({ fontSize: 13, fill: 0x777777, fontWeight: 'bold' }) });
            mTxt.anchor.set(0.5, 0); mTxt.position.set(120, 185);

            const price = new Text({ text: '€0.00', style: new TextStyle({ fontSize: 24, fill: 0x000000, fontWeight: '900' }) });
            price.anchor.set(0.5, 0); price.position.set(120, 205);

            const btn = new Container();
            btn.eventMode = 'static'; btn.cursor = 'pointer';
            const btnBg = new Graphics().roundRect(0, 0, 240, 48, 15).fill(btnColor);
            const btnTxt = new Text({ text: 'ACTIVATE', style: new TextStyle({ fontSize: 16, fill: 0xffffff, fontWeight: 'bold' }) });
            btnTxt.anchor.set(0.5); btnTxt.position.set(120, 24);
            btn.addChild(btnBg, btnTxt); btn.position.set(0, 245);

            btn.on('pointerdown', () => btn.alpha = 0.8);
            btn.on('pointerup', () => { 
                btn.alpha = 1; 
                if (!this.dragState.dragMoved) {
                    callback(); 
                    if (!isFeature) {
                        this.closeBonusModal(); // Куплені бонуски одразу закривають вікно, фічі — ні
                    }
                }
            });
            btn.on('pointerupoutside', () => btn.alpha = 1);

            card.addChild(bg, tTxt, dTxt, mTxt, price, btn);
            this.cardsContainer.addChild(card);
            this.bonusCards.push(card);
            this.modalPrices.push({ text: price, multiplier });

            if (isFeature) {
                this.cardButtonData.push({ btnBg, btnTxt, mode, isFeature });
            }
        };

        // Додаємо картки (перші дві — це фіче-спіни з можливістю Deactivate, інші дві — покупка бонусок)
        createCard('BONUSHUNT\nFEATURESPINS', '5 times more likely to trigger a bonus!', 3, 0xd35400, 1, true, () => this.onToggleFeatureSpins(1));
        createCard('RAINBOW\nFEATURESPINS', 'Each spin guarantees a Rainbow!', 50, 0xd35400, 2, true, () => this.onToggleFeatureSpins(2));
        createCard('LUCK OF THE\nBANDIT', 'Bonus with 8 free spins!', 100, 0x27ae60, 0, false, () => this.onBuyBonus(1));
        createCard('ALL THAT\nGLITTERS', 'Bonus with 12 free spins!', 250, 0x27ae60, 0, false, () => this.onBuyBonus(2));

        this.closeBtn = new Container();
        this.closeBtn.eventMode = 'static'; this.closeBtn.cursor = 'pointer';
        const closeBg = new Graphics().circle(0, 0, 20).fill(0x000000).stroke({ width: 2, color: 0xffffff });
        const closeTxt = new Text({ text: 'X', style: new TextStyle({ fontSize: 20, fill: 0xffffff, fontWeight: 'bold' }) });
        closeTxt.anchor.set(0.5); this.closeBtn.addChild(closeBg, closeTxt);
        this.closeBtn.on('pointerdown', () => this.closeBonusModal());
        this.bonusModal.addChild(this.closeBtn);
    }

    public openBonusModal() { this.bonusModal.visible = true; }
    public closeBonusModal() { this.bonusModal.visible = false; }

    public updateLayout(windowW: number, windowH: number, isMobile: boolean, globalScale: number) {
        this.scale.set(1); 
        const w = windowW; const h = windowH;

        if (isMobile) {
            this.buyBonusBtn.position.set(45, h - 140); 
            this.spinBtn.position.set(w / 2, h - 75); 
            this.btnMinus.position.set(w / 2 - 90, h - 75); 
            this.btnPlus.position.set(w / 2 + 90, h - 75); 
            
            this.balanceLabel.position.set(15, h - 30);
            this.balanceValue.position.set(15, h - 8);
            
            this.betLabel.position.set(w - 15, h - 30);
            this.betValue.position.set(w - 15, h - 8);
            
            this.winValue.position.set(w / 2, h - 125); 
            this.statusContainer.position.set(w / 2, h - 155); 
        } else {
            const panelY = h - 20; 
            const centerX = w / 2;
            this.buyBonusBtn.position.set(centerX - 330, panelY - 35); 
            
            this.balanceLabel.position.set(centerX - 260, panelY - 25);
            this.balanceValue.position.set(centerX - 260, panelY - 3);
            
            this.betLabel.position.set(centerX + 260, panelY - 25);
            this.betValue.position.set(centerX + 260, panelY - 3);
            
            this.btnMinus.position.set(centerX - 90, panelY - 35);
            this.spinBtn.position.set(centerX, panelY - 35);
            this.btnPlus.position.set(centerX + 90, panelY - 35);
            
            this.winValue.position.set(centerX, panelY - 90);
            this.statusContainer.position.set(centerX, panelY - 120); 
        }

        if (this.bonusCards.length === 4) {
            if (isMobile) {
                this.modalHeader.position.set((w - 320) / 2, 40); 
                
                this.scrollArea.position.set(0, 135);
                this.modalMask.clear();
                this.modalMask.rect(0, 135, w, h - 150).fill(0xff0000); 
                this.scrollBg.clear();
                this.scrollBg.rect(0, 0, w, h).fill({color: 0x000000, alpha: 0.001});
                
                this.cardsContainer.scale.set(1); 
                const cardGap = 15;
                
                this.bonusCards[0].position.set((w - 240) / 2, 0);
                this.bonusCards[1].position.set((w - 240) / 2, 300 + cardGap);
                this.bonusCards[2].position.set((w - 240) / 2, (300 + cardGap) * 2);
                this.bonusCards[3].position.set((w - 240) / 2, (300 + cardGap) * 3);
                
                this.closeBtn.position.set(w - 35, 35);
            } else {
                this.modalHeader.position.set((w - 320) / 2, (h - 430) / 2 - 40);
                
                this.scrollArea.position.set(0, 0);
                this.modalMask.clear();
                this.modalMask.rect(0, 0, w, h).fill(0xff0000);
                this.scrollBg.clear();
                
                this.cardsContainer.scale.set(1);
                this.bonusCards[0].position.set(0, (h - 430) / 2 + 60);
                this.bonusCards[1].position.set(260, (h - 430) / 2 + 60);
                this.bonusCards[2].position.set(520, (h - 430) / 2 + 60);
                this.bonusCards[3].position.set(780, (h - 430) / 2 + 60);

                this.cardsContainer.x = (w - 1020) / 2;
                this.cardsContainer.y = 0;
                
                this.closeBtn.position.set(this.cardsContainer.x + 1020 + 20, (h - 430) / 2 - 20);
            }
        }
    }

    public updateFeatureSpinButtons(mode: number) {
        this.currentFeatureMode = mode;
        // Оновлюємо вигляд кнопок фіче-спінів у модалці
        this.cardButtonData.forEach(item => {
            item.btnBg.clear();
            if (item.mode === mode) {
                // Якщо ця фіча активна — робимо кнопку червоною з надписом DEACTIVATE
                item.btnBg.roundRect(0, 0, 240, 48, 15).fill(0xc0392b);
                item.btnTxt.text = 'DEACTIVATE';
            } else {
                // Якщо не активна — помаранчева з надписом ACTIVATE
                item.btnBg.roundRect(0, 0, 240, 48, 15).fill(0xd35400);
                item.btnTxt.text = 'ACTIVATE';
            }
        });
    }

    public updateStats(balance: number, bet: number, win: number, statusText: string = '') {
        this.balanceValue.text = `€${balance.toFixed(2)}`;
        this.betValue.text = `€${bet.toFixed(2)}`;
        this.winValue.text = win > 0 ? `WIN: €${win.toFixed(2)}` : '';
        
        this.modalBetValue.text = `€${bet.toFixed(2)}`;
        this.modalPrices.forEach(p => {
            p.text.text = `€${(bet * p.multiplier).toFixed(2)}`;
        });

        this.statusText.text = statusText;
        this.statusBg.clear();
        if (statusText) {
            const tw = this.statusText.width;
            this.statusBg.roundRect(-tw/2 - 15, -20, tw + 30, 40, 20);
            this.statusBg.fill(0x000000, 0.85); 
            this.statusBg.stroke({ width: 2.5, color: 0x2ecc71 }); 
        }
    }
}