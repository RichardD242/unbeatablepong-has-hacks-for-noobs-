const game = {
    canvas: null,
    ctx: null,
    ballX: 0,
    ballY: 0,
    ballSpeedX: 0,
    ballSpeedY: 0,
    playerPaddleY: 0,
    aiPaddleY: 0,
    mouseY: 0,
    playerScore: 0,
    aiScore: 0,
    isRunning: false,
    isPaused: false,
    ballPause: 0,
    speedMultiplier: 1,
    isDarkMode: false,
    coins: 0,
    aimbotEnabled: false,
    lineEnabled: false,
    timeHackEnabled: false,
    dualPaddleEnabled: false,
    godModeEnabled: false,
    multiBallEnabled: true,
    playerOffsetX: 0,
    playerOscPhase: 0,
    upgrades: {
        platformSize: {
            level: 0,
            maxLevel: 3,
            cost: 100,
            sizeMultiplier: 1
        },
        multiBall: {
            level: 0,
            maxLevel: 4,
            cost: 200,
            chance: 0,
            chances: [0, 0.15, 0.3, 0.5, 1]
        },
        skin: {
            current: 'normal',
            owned: ['normal'],
            costs: {
                crystal: 300,
                gold: 500
            }
        }
    },
    balls: [],

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        const updateCanvasSize = () => {
            const container = this.canvas.parentElement;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const aspectRatio = 4/3;

            let targetWidth, targetHeight;

            if (containerWidth / aspectRatio <= containerHeight) {
                targetWidth = containerWidth * 0.95;
                targetHeight = targetWidth / aspectRatio;
            } else {
                targetHeight = containerHeight * 0.95;
                targetWidth = targetHeight * aspectRatio;
            }

            this.canvas.width = targetWidth;
            this.canvas.height = targetHeight;

            this.updateGameParameters();
        };

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleY = this.canvas.height / rect.height;
            this.mouseY = (e.clientY - rect.top) * scaleY;
        });

        window.addEventListener('resize', () => {
            updateCanvasSize();
            if (!this.isRunning) {
                this.reset();
                this.draw();
            }
        });

        this.setupUpgrades();

        updateCanvasSize();
        this.reset();
        this.setupControls();
    this.loadProgress();
        this.coins = 0;
        this.updateAllUpgradeUI();
        this.syncToggles && this.syncToggles();
        this.saveProgress();
        this.draw();
    },

    setupUpgrades() {
        document.getElementById('upgradesButton').addEventListener('click', () => {
            document.getElementById('upgradesPanel').classList.toggle('visible');
            if (this.isRunning) {
                this.isPaused = !this.isPaused;
                document.getElementById('pauseIndicator').style.display = 
                    this.isPaused ? 'flex' : 'none';
            }
        });

        document.addEventListener('click', (e) => {
            const panel = document.getElementById('upgradesPanel');
            const button = document.getElementById('upgradesButton');
            if (!panel.contains(e.target) && e.target !== button) {
                if (panel.classList.contains('visible')) {
                    panel.classList.remove('visible');
                    if (this.isRunning) {
                        this.isPaused = false;
                        document.getElementById('pauseIndicator').style.display = 'none';
                    }
                }
            }
        });

        document.getElementById('upgradePlatformSize').addEventListener('click', () => {
            this.purchaseUpgrade('platformSize');
        });

        document.getElementById('upgradeMultiBall').addEventListener('click', () => {
            this.purchaseUpgrade('multiBall');
        });

        document.getElementById('upgradeSkin').addEventListener('click', () => {
            const nextSkin = this.getNextSkin();
            if (nextSkin) {
                this.purchaseSkin(nextSkin);
            }
        });

        const hackerBtn = document.getElementById('hackerButton');
        const hackerPanel = document.getElementById('hackerPanel');
        if (hackerBtn && hackerPanel) {
            hackerBtn.addEventListener('click', () => {
                const visible = hackerPanel.classList.toggle('visible');
                document.body.classList.toggle('hacker-open', visible);
                if (this.isRunning) {
                    this.isPaused = visible;
                    const pi = document.getElementById('pauseIndicator');
                    if (pi) pi.style.display = this.isPaused ? 'flex' : 'none';
                }
            });
            document.addEventListener('click', (e) => {
                if (!hackerPanel.contains(e.target) && e.target !== hackerBtn) {
                    if (hackerPanel.classList.contains('visible')) {
                        hackerPanel.classList.remove('visible');
                        document.body.classList.remove('hacker-open');
                        if (this.isRunning) {
                            this.isPaused = false;
                            const pi = document.getElementById('pauseIndicator');
                            if (pi) pi.style.display = 'none';
                        }
                    }
                }
            });
        }
        const bindToggle = (id, prop, onChange) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('change', (e) => {
                this[prop] = e.target.checked;
                if (onChange) onChange(e.target.checked);
            });
        };
    bindToggle('toggleAimbot', 'aimbotEnabled');
    bindToggle('toggleLine', 'lineEnabled');
    bindToggle('toggleTime', 'timeHackEnabled');
    bindToggle('toggleDual', 'dualPaddleEnabled');
        bindToggle('toggleGod', 'godModeEnabled', () => {
            this.updateGameParameters();
            this.playerPaddleY = Math.max(0, Math.min(this.playerPaddleY, this.canvas.height - this.playerPaddleHeight));
        });
    bindToggle('toggleMultiBallEnabled', 'multiBallEnabled');
        

    this.syncToggles && this.syncToggles();

        document.querySelectorAll('.paddle-preview').forEach(preview => {
            preview.addEventListener('click', () => {
                const skin = preview.dataset.skin;
                if (this.upgrades.skin.owned.includes(skin)) {
                    this.upgrades.skin.current = skin;
                    this.updateSkinPreviews();
                    this.saveProgress();
                }
            });
        });
    },

    purchaseUpgrade(type) {
        const upgrade = this.upgrades[type];
        if (upgrade.level >= upgrade.maxLevel) return;
        
        if (this.coins >= upgrade.cost) {
            this.coins -= upgrade.cost;
            upgrade.level++;
            
            if (type === 'platformSize') {
                upgrade.sizeMultiplier = 1 + (upgrade.level * 0.25);
                this.updateGameParameters();
                this.playerPaddleY = Math.max(0, Math.min(this.playerPaddleY, this.canvas.height - this.playerPaddleHeight));
                this.aiPaddleY = Math.max(0, Math.min(this.aiPaddleY, this.canvas.height - this.aiPaddleHeight));
            } else if (type === 'multiBall') {
                upgrade.chance = upgrade.chances[upgrade.level];
            }
            
            this.updateUpgradeUI(type);
            this.updateAllUpgradeUI();
            this.saveProgress();
        }
    },

    purchaseSkin(skin) {
        const cost = this.upgrades.skin.costs[skin];
        if (this.coins >= cost) {
            this.coins -= cost;
            this.upgrades.skin.owned.push(skin);
            this.upgrades.skin.current = skin;
            this.updateSkinPreviews();
            this.updateUpgradeUI('skin');
            this.saveProgress();
        }
    },

    getNextSkin() {
        const skins = ['normal', 'crystal', 'gold'];
        const currentIndex = skins.indexOf(this.upgrades.skin.current);
        return skins[currentIndex + 1];
    },

    updateUpgradeUI(type) {
        document.getElementById('coinCount').textContent = this.coins;
        
        if (type === 'platformSize') {
            const btn = document.getElementById('upgradePlatformSize');
            const item = btn ? btn.closest('.upgrade-item') : null;
            const progress = item ? item.querySelector('.upgrade-progress-bar') : null;
            const percent = (this.upgrades.platformSize.level / this.upgrades.platformSize.maxLevel) * 100;
            if (progress) progress.style.width = `${percent}%`;
            if (btn) btn.textContent = this.upgrades.platformSize.level >= this.upgrades.platformSize.maxLevel ? 
                'MAXED' : `Upgrade (${this.upgrades.platformSize.cost} coins)`;
        }
        else if (type === 'multiBall') {
            const btn = document.getElementById('upgradeMultiBall');
            const item = btn ? btn.closest('.upgrade-item') : null;
            const desc = item ? item.querySelector('.upgrade-description') : null;
            const progress = item ? item.querySelector('.upgrade-progress-bar') : null;
            const percent = (this.upgrades.multiBall.level / this.upgrades.multiBall.maxLevel) * 100;
            if (progress) progress.style.width = `${percent}%`;
            if (desc) desc.textContent = `Chance to spawn 2 balls: ${this.upgrades.multiBall.chance * 100}%`;
            if (btn) btn.textContent = this.upgrades.multiBall.level >= this.upgrades.multiBall.maxLevel ? 
                'MAXED' : `Upgrade (${this.upgrades.multiBall.cost} coins)`;
        }
        else if (type === 'skin') {
            const nextSkin = this.getNextSkin();
            const btn = document.getElementById('upgradeSkin');
            if (nextSkin) {
                const cost = this.upgrades.skin.costs[nextSkin];
                if (btn) btn.textContent = `Buy ${nextSkin} (${cost} coins)`;
            } else {
                if (btn) btn.textContent = 'All skins owned';
            }
        }
    },

    updateSkinPreviews() {
        document.querySelectorAll('.paddle-preview').forEach(preview => {
            const skin = preview.dataset.skin;
            preview.classList.toggle('active', skin === this.upgrades.skin.current);
        });
    },

    saveProgress() {
    const saveData = {
            coins: this.coins,
            upgrades: this.upgrades,
            flags: {
                multiBallEnabled: this.multiBallEnabled,
                godModeEnabled: this.godModeEnabled,
                aimbotEnabled: this.aimbotEnabled,
                lineEnabled: this.lineEnabled,
                timeHackEnabled: this.timeHackEnabled,
        dualPaddleEnabled: this.dualPaddleEnabled
        }
        };
        localStorage.setItem('pongProgress', JSON.stringify(saveData));
    },

    loadProgress() {
        const saveData = localStorage.getItem('pongProgress');
        if (saveData) {
            const data = JSON.parse(saveData);
            this.coins = data.coins;
            this.upgrades = data.upgrades;
            if (this.upgrades && this.upgrades.platformSize) {
                const lvl = this.upgrades.platformSize.level || 0;
                this.upgrades.platformSize.sizeMultiplier = 1 + (lvl * 0.25);
            }
            if (this.upgrades && this.upgrades.multiBall) {
                const lvl = this.upgrades.multiBall.level || 0;
                const chances = this.upgrades.multiBall.chances || [0, 0.15, 0.3, 0.5, 1];
                this.upgrades.multiBall.chance = chances[Math.min(lvl, chances.length - 1)] || 0;
            }
            if (data.flags) {
                this.multiBallEnabled = data.flags.multiBallEnabled ?? this.multiBallEnabled;
                this.godModeEnabled = data.flags.godModeEnabled ?? this.godModeEnabled;
                this.aimbotEnabled = data.flags.aimbotEnabled ?? this.aimbotEnabled;
                this.lineEnabled = data.flags.lineEnabled ?? this.lineEnabled;
                this.timeHackEnabled = data.flags.timeHackEnabled ?? this.timeHackEnabled;
                this.dualPaddleEnabled = data.flags.dualPaddleEnabled ?? this.dualPaddleEnabled;
            }
            this.updateGameParameters();
            this.playerPaddleY = Math.max(0, Math.min(this.playerPaddleY, this.canvas.height - this.playerPaddleHeight));
            this.aiPaddleY = Math.max(0, Math.min(this.aiPaddleY, this.canvas.height - this.aiPaddleHeight));
            this.updateAllUpgradeUI();
            this.syncToggles && this.syncToggles();
        }
    },

    syncToggles() {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
        set('toggleAimbot', this.aimbotEnabled);
        set('toggleLine', this.lineEnabled);
        set('toggleTime', this.timeHackEnabled);
        set('toggleDual', this.dualPaddleEnabled);
        set('toggleGod', this.godModeEnabled);
    set('toggleMultiBallEnabled', this.multiBallEnabled);
    },

    updateAllUpgradeUI() {
        document.getElementById('coinCount').textContent = this.coins;
        this.updateUpgradeUI('platformSize');
        this.updateUpgradeUI('multiBall');
        this.updateUpgradeUI('skin');
        this.updateSkinPreviews();
    },

    handlePaddleHit(paddle, ball) {
        if (paddle === 'player') {
            this.coins += 5;
            this.updateAllUpgradeUI();
        }
        const impactY = (ball.y + this.ballSize/2) - (paddle === 'player' ? 
            this.playerPaddleY : this.aiPaddleY);
        let normalizedImpact = (impactY / (paddle === 'player' ? this.playerPaddleHeight : this.aiPaddleHeight)) * 2 - 1;
        normalizedImpact = Math.max(-1, Math.min(1, normalizedImpact));
        const angle = normalizedImpact * 45 * Math.PI / 180;

        const currentSpeed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
        let newSpeed = Math.min(currentSpeed * 1.1, this.ballSpeedInitial * 2 * this.speedMultiplier);
        if (paddle === 'player' && this.godModeEnabled) {
            newSpeed = Math.min(currentSpeed * 1.2, this.ballSpeedInitial * 2.6 * this.speedMultiplier);
        }

        const minHoriz = this.ballSpeedInitial * 0.6;
        const horiz = Math.max(Math.abs(newSpeed * Math.cos(angle)), minHoriz);
        ball.speedX = paddle === 'player' ? horiz : -horiz;
        ball.speedY = newSpeed * Math.sin(angle);
        
        if (paddle === 'player') {
            const playerLeft = this.paddleOffset;
            ball.x = playerLeft + this.paddleWidth + 3;
            if (this.multiBallEnabled && Math.random() < this.upgrades.multiBall.chance) {
                const speedMag = Math.sqrt(ball.speedX*ball.speedX + ball.speedY*ball.speedY);
                const sx = Math.max(Math.abs(ball.speedX), this.ballSpeedInitial * 0.6);
                const sy = -ball.speedY;
                const offsetX = this.ballSize + 1;
                const offsetY = (ball.speedY >= 0 ? -1 : 1) * this.ballSize;
                this.balls.push({
                    x: ball.x + offsetX,
                    y: Math.max(0, Math.min(ball.y + offsetY, this.canvas.height - this.ballSize)),
                    speedX: sx,
                    speedY: sy,
                    lastHitTime: performance.now()
                });
            }
        } else {
            ball.x = this.canvas.width - this.paddleOffset - this.paddleWidth - this.ballSize - 3;
        }
    },

    updateGameParameters() {
    this.ballSize = Math.round(this.canvas.width * 0.012);
    this.paddleWidth = Math.round(this.canvas.width * 0.012);
    const baseHeight = Math.round(this.canvas.height * 0.15);
    this.playerPaddleHeight = Math.round(baseHeight * this.upgrades.platformSize.sizeMultiplier);
    this.aiPaddleHeight = baseHeight;
    this.paddleOffset = Math.round(this.canvas.width * 0.03);
    this.ballSpeedInitial = Math.round(this.canvas.width * 0.005);
    if (this.godModeEnabled) {
        this.playerPaddleHeight = Math.max(Math.round(this.ballSize * 0.8), 6);
    }
    },

    setupControls() {
        document.getElementById('startButton').addEventListener('click', () => {
            if (!this.isRunning) {
                this.isRunning = true;
                this.reset();
                this.gameLoop();
                document.getElementById('startButton').textContent = 'Reset Game';
            } else {
                this.isRunning = false;
                this.playerScore = 0;
                this.aiScore = 0;
                this.updateScore();
                this.reset();
                document.getElementById('startButton').textContent = 'Start Game';
            }
        });

        document.getElementById('toggleTheme').addEventListener('click', () => {
            this.isDarkMode = !this.isDarkMode;
            document.body.classList.toggle('dark-mode', this.isDarkMode);
            if (!this.isRunning) this.draw();
        });
    },

    reset(direction = 1) {
        this.balls = [];
        this.addBall(direction);
    this.playerPaddleY = this.canvas.height / 2 - this.playerPaddleHeight / 2;
    this.aiPaddleY = this.canvas.height / 2 - this.aiPaddleHeight / 2;
        this.ballPause = 50;
    },

    addBall(direction = 1) {
        const angle = (Math.random() * 90 - 45) * Math.PI / 180;
        this.balls.push({
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            speedX: this.ballSpeedInitial * direction * Math.cos(angle) * this.speedMultiplier,
            speedY: this.ballSpeedInitial * Math.sin(angle) * this.speedMultiplier,
            lastHitTime: 0
        });
    },

    releaseStuckBalls() {
        for (const b of this.balls) {
            if (b.stuck) {
                b.stuck = false;
                const angle = (Math.random() * 60 - 30) * Math.PI / 180;
                const speed = Math.max(this.ballSpeedInitial * 1.4, Math.abs(b.speedX) + 1);
                b.speedX = Math.abs(speed * Math.cos(angle));
                b.speedY = speed * Math.sin(angle);
                b.x = this.paddleOffset + this.paddleWidth + 4;
                b.lastHitTime = performance.now();
            }
        }
    },

    updateGame() {
        if (this.ballPause > 0) {
            this.ballPause--;
            return;
        }
    if (this.godModeEnabled || this.aimbotEnabled) {
            let best = null;
            let bestT = Infinity;
            for (const b of this.balls) {
                if (b.speedX < 0 && Math.abs(b.speedX) >= 1e-6) {
            const dist = ((this.paddleOffset + this.paddleWidth) - b.x);
                    const t = Math.abs(dist / b.speedX);
                    if (t >= 0 && t < bestT) { bestT = t; best = b; }
                }
            }
            if (best) {
                let futureY = best.y + best.speedY * bestT;
                let guard = 0;
                const maxIt = 12;
                while ((futureY < 0 || futureY > this.canvas.height - this.ballSize) && guard++ < maxIt) {
                    if (futureY < 0) futureY = -futureY;
                    else if (futureY > this.canvas.height - this.ballSize) futureY = 2 * (this.canvas.height - this.ballSize) - futureY;
                }
                const targetY = futureY - this.playerPaddleHeight / 2;
                this.playerPaddleY = Math.max(0, Math.min(targetY, this.canvas.height - this.playerPaddleHeight));
            }
            this.playerOffsetX = 0;
        } else {
            const targetY = this.mouseY - this.playerPaddleHeight / 2;
            const dy = targetY - this.playerPaddleY;
            this.playerPaddleY += dy * 0.15;
        }
        
    this.playerPaddleY = Math.max(0, Math.min(this.playerPaddleY, this.canvas.height - this.playerPaddleHeight));
    this.aiPaddleY = Math.max(0, Math.min(this.aiPaddleY, this.canvas.height - this.aiPaddleHeight));

        if (this.balls.length > 0) {
            const aiRight = this.canvas.width - this.paddleOffset;
            const aiLeft = aiRight - this.paddleWidth;
            let targetYCenter = null;

            for (const b of this.balls) {
                const nextX = b.x + b.speedX;
                const nextY = b.y + b.speedY;
                const crossesAIPlane = (nextX + this.ballSize) >= aiLeft && b.x <= aiLeft && b.speedX > 0;
                const overlapsVertically = (nextY + this.ballSize) >= this.aiPaddleY && nextY <= (this.aiPaddleY + this.aiPaddleHeight);
                if (crossesAIPlane) {
                    targetYCenter = nextY + this.ballSize / 2;
                    break;
                }
            }

            if (targetYCenter === null) {
                let best = null;
                let bestT = Infinity;
                for (const b of this.balls) {
                    if (b.speedX > 0 && Math.abs(b.speedX) >= 1e-6 && isFinite(b.speedX)) {
                        const dist = (aiLeft - (b.x + this.ballSize));
                        const t = dist / b.speedX;
                        if (t >= 0 && t < bestT) {
                            bestT = t;
                            best = b;
                        }
                    }
                }
                if (best) {
                    let futureY = best.y + best.speedY * bestT;
                    let guard = 0;
                    const maxIt = 20;
                    while ((futureY < 0 || futureY > this.canvas.height - this.ballSize) && guard++ < maxIt) {
                        if (futureY < 0) futureY = -futureY;
                        else if (futureY > this.canvas.height - this.ballSize) futureY = 2 * (this.canvas.height - this.ballSize) - futureY;
                    }
                    targetYCenter = futureY + this.ballSize / 2;
                }
            }

            if (targetYCenter !== null) {
                this.aiPaddleY = Math.max(0, Math.min(targetYCenter - this.aiPaddleHeight / 2, this.canvas.height - this.aiPaddleHeight));
            }
        }
        
        const now = performance.now();
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];

            const inPlayerHalf = (ball.x + this.ballSize/2) < this.canvas.width / 2;
            let timeScale = this.timeHackEnabled ? (inPlayerHalf ? 0.7 : 1.35) : 1;
            if (this.godModeEnabled) timeScale = 1.8;
            let nextX = ball.x + ball.speedX * timeScale;
            let nextY = ball.y + ball.speedY * timeScale;
            if (nextY <= 0 || nextY + this.ballSize >= this.canvas.height) {
                ball.speedY *= -1;
                nextY = Math.max(0, Math.min(nextY, this.canvas.height - this.ballSize));
            }
            const cooldown = this.godModeEnabled ? 60 : 100;
            const canCollide = !ball.lastHitTime || (now - ball.lastHitTime) > cooldown;
            const playerLeft = this.paddleOffset;
            const playerRight = playerLeft + this.paddleWidth;
            const playerTop = this.playerPaddleY;
            const playerBottom = this.playerPaddleY + this.playerPaddleHeight;
            const dualGap = Math.round(this.playerPaddleHeight * 0.2);
            const player2Top = this.dualPaddleEnabled ? Math.min(this.canvas.height - this.playerPaddleHeight, this.playerPaddleY + this.playerPaddleHeight + dualGap) : null;
            const player2Bottom = this.dualPaddleEnabled && player2Top !== null ? player2Top + this.playerPaddleHeight : null;
            const aiRight2 = this.canvas.width - this.paddleOffset;
            const aiLeft2 = aiRight2 - this.paddleWidth;
            const aiTop = this.aiPaddleY;
            const aiBottom = this.aiPaddleY + this.aiPaddleHeight;
            let collided = false;
            if (canCollide && ball.speedX < 0) {
                const crossesPlayerPlane = nextX <= playerRight && (ball.x + this.ballSize) >= playerRight;
                const overlapsVertically = (nextY + this.ballSize) >= playerTop && nextY <= playerBottom;
                const overlapsP2 = this.dualPaddleEnabled && player2Top !== null && (nextY + this.ballSize) >= player2Top && nextY <= player2Bottom;
                if (crossesPlayerPlane && (overlapsVertically || overlapsP2 || this.godModeEnabled)) {
                    this.handlePaddleHit('player', ball);
                    ball.lastHitTime = now;
                    collided = true;
                    nextX = playerRight + 2;
                }
            }
        if (!collided && canCollide && ball.speedX > 0) {
                const crossesAIPlane = (nextX + this.ballSize) >= aiLeft2 && ball.x <= aiLeft2;
                if (crossesAIPlane) {
                    this.handlePaddleHit('ai', ball);
                    ball.lastHitTime = now;
                    collided = true;
            nextX = aiLeft2 - this.ballSize - 2;
                } else if (this.godModeEnabled && (nextX + this.ballSize) >= aiLeft2) {
                    this.handlePaddleHit('ai', ball);
                    ball.lastHitTime = now;
                    collided = true;
            nextX = aiLeft2 - this.ballSize - 2;
                }
            }
            const aimbotBoost = (this.aimbotEnabled ? 1.25 : 1) * (this.godModeEnabled ? 2.4 : 1);
            const moveScale = aimbotBoost * timeScale;
            if (!collided) {
                ball.x = ball.x + ball.speedX * moveScale;
                ball.y = ball.y + ball.speedY * moveScale;
            } else {
                ball.y = nextY;
            }
            if (this.godModeEnabled) {
                const playerRightNow = this.paddleOffset + this.paddleWidth;
                if (ball.x + this.ballSize < playerRightNow) {
                    ball.x = playerRightNow + 3;
                    if (ball.speedX < 0) ball.speedX = Math.abs(ball.speedX) || this.ballSpeedInitial;
                }
                const aiLeftNow = this.canvas.width - this.paddleOffset - this.paddleWidth;
                if (ball.x > aiLeftNow) {
                    ball.x = aiLeftNow - this.ballSize - 3;
                    if (ball.speedX > 0) ball.speedX = -Math.abs(ball.speedX) || -this.ballSpeedInitial;
                }
            }
                if (ball.x + this.ballSize < 0) {
                    this.aiScore++;
                    this.updateScore();
                    const idx = this.balls.indexOf(ball);
                    if (idx !== -1) this.balls.splice(idx, 1);
                    if (this.balls.length === 0) {
                        this.reset(-1);
                    }
                    return;
                } else if (ball.x > this.canvas.width) {
                    this.playerScore++;
                    this.coins += 10;
                    this.updateScore();
                    this.updateAllUpgradeUI();
                    const idx = this.balls.indexOf(ball);
                    if (idx !== -1) this.balls.splice(idx, 1);
                    if (this.balls.length === 0) {
                        this.reset(1);
                    }
                    return;
                }
        }
    },

    

    updateScore() {
        document.getElementById('playerScore').textContent = this.playerScore;
        document.getElementById('aiScore').textContent = this.aiScore;
    },

    draw() {
        this.ctx.fillStyle = this.isDarkMode ? '#1a1a1a' : '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.setLineDash([5, 15]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.strokeStyle = this.isDarkMode ? '#4a4a4a' : '#a8956b';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowBlur = 8;
        this.ctx.fillStyle = this.isDarkMode ? '#ffffff' : '#3a2f25';

    for (const ball of this.balls) {
            this.ctx.beginPath();
            this.ctx.arc(ball.x + this.ballSize/2, ball.y + this.ballSize/2, 
                this.ballSize/2, 0, Math.PI * 2);
            this.ctx.fill();
            if (this.aimbotEnabled) {
                this.ctx.save();
                this.ctx.strokeStyle = '#ff2d2d';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(ball.x - 2, ball.y - 2, this.ballSize + 4, this.ballSize + 4);
                this.ctx.restore();
            }
        }
        if (this.lineEnabled) {
            const playerRight = this.paddleOffset + this.paddleWidth;
            const aiLeft = this.canvas.width - this.paddleOffset - this.paddleWidth;
            this.ctx.save();
            this.ctx.strokeStyle = '#ff2d2d';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([6, 6]);
            for (const b of this.balls) {
                const targetX = b.speedX < 0 ? playerRight : aiLeft;
                const edgeAdjust = b.speedX < 0 ? this.ballSize : 0;
                const dist = (targetX - (b.x + edgeAdjust));
                const t = Math.abs(dist / (b.speedX || 1e-6));
                let futureY = b.y + b.speedY * t;
                let guard = 0, maxIt = 20;
                while ((futureY < 0 || futureY > this.canvas.height - this.ballSize) && guard++ < maxIt) {
                    if (futureY < 0) futureY = -futureY;
                    else if (futureY > this.canvas.height - this.ballSize) futureY = 2 * (this.canvas.height - this.ballSize) - futureY;
                }
                const bx = b.x + this.ballSize/2;
                const by = b.y + this.ballSize/2;
                const tx = targetX;
                const ty = futureY + this.ballSize/2;
                this.ctx.beginPath();
                this.ctx.moveTo(bx, by);
                this.ctx.lineTo(tx, ty);
                this.ctx.stroke();
            }
            this.ctx.setLineDash([]);
            this.ctx.restore();
        }
        this.ctx.shadowBlur = 0;
        const paddleGradient = this.ctx.createLinearGradient(0, 0, this.paddleWidth, 0);
        switch(this.upgrades.skin.current) {
            case 'normal':
                paddleGradient.addColorStop(0, '#a8956b');
                paddleGradient.addColorStop(0.5, '#b5a27a');
                paddleGradient.addColorStop(1, '#8b7a54');
                break;
            case 'crystal':
                paddleGradient.addColorStop(0, '#88c0d0');
                paddleGradient.addColorStop(0.5, '#81a1c1');
                paddleGradient.addColorStop(1, '#5e81ac');
                break;
            case 'gold':
                paddleGradient.addColorStop(0, '#ffd700');
                paddleGradient.addColorStop(0.5, '#ffcc00');
                paddleGradient.addColorStop(1, '#ffa500');
                break;
        }
        
    this.ctx.fillStyle = paddleGradient;
    const pX = this.paddleOffset;
    this.ctx.beginPath();
    this.ctx.roundRect(pX, this.playerPaddleY, 
        this.paddleWidth, this.playerPaddleHeight, 4);
        this.ctx.fill();

        if (this.dualPaddleEnabled) {
            const dualGap = Math.round(this.playerPaddleHeight * 0.2);
            const p2Y = Math.min(this.canvas.height - this.playerPaddleHeight, this.playerPaddleY + this.playerPaddleHeight + dualGap);
            this.ctx.beginPath();
            this.ctx.roundRect(pX, p2Y, this.paddleWidth, this.playerPaddleHeight, 4);
            this.ctx.fill();
        }

        const aiPaddleGradient = this.ctx.createLinearGradient(0, 0, this.paddleWidth, 0);
        aiPaddleGradient.addColorStop(0, '#a8956b');
        aiPaddleGradient.addColorStop(0.5, '#b5a27a');
        aiPaddleGradient.addColorStop(1, '#8b7a54');
        this.ctx.fillStyle = aiPaddleGradient;
        this.ctx.beginPath();
        this.ctx.roundRect(this.canvas.width - this.paddleOffset - this.paddleWidth, 
            this.aiPaddleY, this.paddleWidth, this.aiPaddleHeight, 4);
        this.ctx.fill();
    },

    gameLoop() {
        if (!this.isRunning) return;
        
        if (!this.isPaused) {
            this.updateGame();
        }
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
};

window.onload = () => game.init();
