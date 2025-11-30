// ===== 坦克大戰遊戲 =====

// 遊戲常數
const TILE_SIZE = 32;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;
const CANVAS_WIDTH = MAP_WIDTH * TILE_SIZE;
const CANVAS_HEIGHT = MAP_HEIGHT * TILE_SIZE;

// 地圖元素
const TILES = {
    EMPTY: 0,
    WALL: 1,
    STEEL: 2,
    WATER: 3,
    GRASS: 4
};

// 方向
const DIRECTIONS = {
    UP: { dx: 0, dy: -1, angle: 0 },
    DOWN: { dx: 0, dy: 1, angle: 180 },
    LEFT: { dx: -1, dy: 0, angle: 270 },
    RIGHT: { dx: 1, dy: 0, angle: 90 }
};

// 遊戲狀態
let gameState = {
    isPlaying: false,
    score: 0,
    lives: 3,
    level: 1,
    player: null,
    enemies: [],
    bullets: [],
    map: [],
    explosions: [],
    powerups: [],
    lastTime: 0,
    enemySpawnTimer: 0,
    powerupSpawnTimer: 0,
    maxEnemies: 3,
    invincible: false,
    invincibleTimer: 0,
    message: null,
    messageTimer: 0
};

// Canvas 相關
let canvas, ctx;

// 輸入狀態
const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false
};

// DOM 元素
const startScreen = document.getElementById('start-screen');
const gameContent = document.getElementById('game-content');
const gameOver = document.getElementById('game-over');
const levelComplete = document.getElementById('level-complete');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const levelDisplay = document.getElementById('level');
const enemiesDisplay = document.getElementById('enemies');
const finalScore = document.getElementById('final-score');
const levelScore = document.getElementById('level-score');

// 地圖模板
const MAP_TEMPLATES = [
    // 關卡 1
    [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,0,1,1,0,0],
        [0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,0,1,1,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,0,0,1,1,0,0,2,2,2,2,0,0,1,1,0,0,1,0],
        [0,1,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,1,0],
        [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
        [0,0,1,1,0,0,0,0,1,1,1,1,0,0,0,0,1,1,0,0],
        [0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0],
        [0,0,0,0,0,0,2,0,0,0,0,0,0,2,0,0,0,0,0,0],
        [0,1,1,0,0,0,2,0,1,1,1,1,0,2,0,0,0,1,1,0],
        [0,1,1,0,0,0,0,0,1,4,4,1,0,0,0,0,0,1,1,0],
        [0,0,0,0,0,0,0,0,1,4,4,1,0,0,0,0,0,0,0,0],
        [0,0,0,1,1,0,0,0,0,4,4,0,0,0,0,1,1,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ]
];

// ===== 坦克類別 =====
class Tank {
    constructor(x, y, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE - 4;
        this.height = TILE_SIZE - 4;
        this.direction = DIRECTIONS.UP;
        this.speed = isPlayer ? 2 : 1;
        this.isPlayer = isPlayer;
        this.cooldown = 0;
        this.maxCooldown = isPlayer ? 20 : 40;
        this.alive = true;
    }

    update() {
        if (this.cooldown > 0) this.cooldown--;
    }

    move(dir) {
        this.direction = dir;
        const newX = this.x + dir.dx * this.speed;
        const newY = this.y + dir.dy * this.speed;

        // 邊界檢查
        if (newX < 0 || newX + this.width > CANVAS_WIDTH) return 'boundary';
        if (newY < 0 || newY + this.height > CANVAS_HEIGHT) return 'boundary';

        // 碰撞檢查
        const collision = this.checkCollision(newX, newY);
        if (!collision) {
            this.x = newX;
            this.y = newY;
            return null;
        }
        return collision; // 返回碰撞類型 'map' 或 'tank'
    }

    checkCollision(newX, newY) {
        // 檢查地圖碰撞
        const corners = [
            { x: newX, y: newY },
            { x: newX + this.width, y: newY },
            { x: newX, y: newY + this.height },
            { x: newX + this.width, y: newY + this.height }
        ];

        for (const corner of corners) {
            const tileX = Math.floor(corner.x / TILE_SIZE);
            const tileY = Math.floor(corner.y / TILE_SIZE);

            if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
                return 'map';
            }

            const tile = gameState.map[tileY]?.[tileX];
            if (tile === TILES.WALL || tile === TILES.STEEL || tile === TILES.WATER) {
                return 'map';
            }
        }

        // 檢查與其他坦克碰撞
        const tanks = this.isPlayer ? gameState.enemies : [gameState.player, ...gameState.enemies.filter(e => e !== this)];
        for (const tank of tanks) {
            if (tank && tank.alive && this.intersects(newX, newY, tank)) {
                return 'tank';
            }
        }

        return null;
    }

    intersects(x, y, other) {
        return x < other.x + other.width &&
               x + this.width > other.x &&
               y < other.y + other.height &&
               y + this.height > other.y;
    }

    fire() {
        if (this.cooldown > 0) return null;
        this.cooldown = this.maxCooldown;

        const bulletX = this.x + this.width / 2 - 3 + this.direction.dx * (this.width / 2);
        const bulletY = this.y + this.height / 2 - 3 + this.direction.dy * (this.height / 2);

        return new Bullet(bulletX, bulletY, this.direction, this.isPlayer);
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.direction.angle * Math.PI / 180);

        // 坦克身體
        ctx.fillStyle = this.isPlayer ? '#4CAF50' : '#e74c3c';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // 砲管
        ctx.fillStyle = this.isPlayer ? '#2E7D32' : '#c0392b';
        ctx.fillRect(-2, -this.height / 2 - 6, 4, this.height / 2 + 2);

        // 履帶
        ctx.fillStyle = '#333';
        ctx.fillRect(-this.width / 2, -this.height / 2, 3, this.height);
        ctx.fillRect(this.width / 2 - 3, -this.height / 2, 3, this.height);

        ctx.restore();
    }
}

// ===== 子彈類別 =====
class Bullet {
    constructor(x, y, direction, isPlayerBullet) {
        this.x = x;
        this.y = y;
        this.width = 6;
        this.height = 6;
        this.direction = direction;
        this.speed = 5;
        this.isPlayerBullet = isPlayerBullet;
        this.alive = true;
    }

    update() {
        this.x += this.direction.dx * this.speed;
        this.y += this.direction.dy * this.speed;

        // 邊界檢查
        if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
            this.alive = false;
            return;
        }

        // 地圖碰撞
        const tileX = Math.floor((this.x + this.width / 2) / TILE_SIZE);
        const tileY = Math.floor((this.y + this.height / 2) / TILE_SIZE);

        if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
            const tile = gameState.map[tileY][tileX];
            if (tile === TILES.WALL) {
                gameState.map[tileY][tileX] = TILES.EMPTY;
                this.alive = false;
                createExplosion(tileX * TILE_SIZE + TILE_SIZE / 2, tileY * TILE_SIZE + TILE_SIZE / 2, true);
            } else if (tile === TILES.STEEL) {
                this.alive = false;
                createExplosion(this.x, this.y, true);
            }
        }

        // 坦克碰撞
        if (this.isPlayerBullet) {
            for (const enemy of gameState.enemies) {
                if (enemy.alive && this.hits(enemy)) {
                    enemy.alive = false;
                    this.alive = false;
                    gameState.score += 100;
                    updateScore();
                    createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    break;
                }
            }
        } else {
            if (gameState.player && gameState.player.alive && this.hits(gameState.player)) {
                this.alive = false;
                loseLife();
            }
        }
    }

    hits(tank) {
        return this.x < tank.x + tank.width &&
               this.x + this.width > tank.x &&
               this.y < tank.y + tank.height &&
               this.y + this.height > tank.y;
    }

    draw(ctx) {
        ctx.fillStyle = this.isPlayerBullet ? '#FFD700' : '#FF6B6B';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ===== 爆炸效果 =====
class Explosion {
    constructor(x, y, small = false) {
        this.x = x;
        this.y = y;
        this.radius = small ? 8 : 15;
        this.maxRadius = small ? 12 : 25;
        this.alive = true;
        this.alpha = 1;
    }

    update() {
        this.radius += 1;
        this.alpha -= 0.08;
        if (this.alpha <= 0) {
            this.alive = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;

        // 外圈
        ctx.fillStyle = '#FF6B00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 內圈
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

function createExplosion(x, y, small = false) {
    gameState.explosions.push(new Explosion(x, y, small));
}

// ===== 盾牌道具類別 =====
class ShieldPowerup {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE - 8;
        this.height = TILE_SIZE - 8;
        this.alive = true;
        this.pulsePhase = 0;
    }

    update() {
        this.pulsePhase += 0.1;
    }

    draw(ctx) {
        if (!this.alive) return;

        const pulse = Math.sin(this.pulsePhase) * 0.2 + 0.8;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const size = (this.width / 2) * pulse;

        ctx.save();

        // 外層光暈
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#00BFFF';
        ctx.beginPath();
        ctx.arc(centerX, centerY, size + 5, 0, Math.PI * 2);
        ctx.fill();

        // 盾牌形狀
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#1E90FF';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - size);
        ctx.lineTo(centerX + size, centerY - size * 0.3);
        ctx.lineTo(centerX + size * 0.8, centerY + size * 0.6);
        ctx.lineTo(centerX, centerY + size);
        ctx.lineTo(centerX - size * 0.8, centerY + size * 0.6);
        ctx.lineTo(centerX - size, centerY - size * 0.3);
        ctx.closePath();
        ctx.fill();

        // 盾牌邊框
        ctx.strokeStyle = '#87CEEB';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 盾牌中心圖案
        ctx.fillStyle = '#87CEEB';
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    intersects(tank) {
        return this.x < tank.x + tank.width &&
               this.x + this.width > tank.x &&
               this.y < tank.y + tank.height &&
               this.y + this.height > tank.y;
    }
}

// ===== 初始化遊戲 =====
function initGame() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // 事件監聽
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('click', handleClick);

    // 手機控制
    const controlBtns = document.querySelectorAll('.control-btn');
    controlBtns.forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleControlPress(btn.dataset.action, true);
        });
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleControlPress(btn.dataset.action, false);
        });
        btn.addEventListener('mousedown', () => handleControlPress(btn.dataset.action, true));
        btn.addEventListener('mouseup', () => handleControlPress(btn.dataset.action, false));
    });
}

function handleControlPress(action, pressed) {
    switch (action) {
        case 'up': keys.up = pressed; break;
        case 'down': keys.down = pressed; break;
        case 'left': keys.left = pressed; break;
        case 'right': keys.right = pressed; break;
        case 'fire':
            if (pressed) playerFire();
            break;
    }
}

function handleKeyDown(e) {
    if (!gameState.isPlaying) return;

    switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': keys.up = true; e.preventDefault(); break;
        case 'ArrowDown': case 's': case 'S': keys.down = true; e.preventDefault(); break;
        case 'ArrowLeft': case 'a': case 'A': keys.left = true; e.preventDefault(); break;
        case 'ArrowRight': case 'd': case 'D': keys.right = true; e.preventDefault(); break;
        case ' ': playerFire(); e.preventDefault(); break;
    }
}

function handleKeyUp(e) {
    switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': keys.up = false; break;
        case 'ArrowDown': case 's': case 'S': keys.down = false; break;
        case 'ArrowLeft': case 'a': case 'A': keys.left = false; break;
        case 'ArrowRight': case 'd': case 'D': keys.right = false; break;
    }
}

function handleClick() {
    if (gameState.isPlaying) {
        playerFire();
    }
}

function playerFire() {
    if (!gameState.player || !gameState.player.alive) return;
    const bullet = gameState.player.fire();
    if (bullet) {
        gameState.bullets.push(bullet);
    }
}

// ===== 載入關卡 =====
function loadLevel(level) {
    const templateIndex = (level - 1) % MAP_TEMPLATES.length;
    gameState.map = JSON.parse(JSON.stringify(MAP_TEMPLATES[templateIndex]));

    // 玩家起始位置
    gameState.player = new Tank(CANVAS_WIDTH / 2 - TILE_SIZE / 2, CANVAS_HEIGHT - TILE_SIZE * 2, true);

    // 清空敵人和子彈
    gameState.enemies = [];
    gameState.bullets = [];
    gameState.explosions = [];
    gameState.powerups = [];
    gameState.enemySpawnTimer = 0;
    gameState.powerupSpawnTimer = 0;
    gameState.invincible = false;
    gameState.invincibleTimer = 0;

    // 每關增加敵人數量
    gameState.maxEnemies = Math.min(3 + level, 6);

    // 初始生成敵人，確保從不同位置生成
    spawnEnemyAt(0); // 左側
    spawnEnemyAt(2); // 右側
}

// ===== 生成敵人 =====
function spawnEnemy() {
    if (gameState.enemies.filter(e => e.alive).length >= gameState.maxEnemies) return;

    const spawnPoints = [
        { x: TILE_SIZE, y: TILE_SIZE },
        { x: CANVAS_WIDTH / 2 - TILE_SIZE / 2, y: TILE_SIZE },
        { x: CANVAS_WIDTH - TILE_SIZE * 2, y: TILE_SIZE }
    ];

    // 找出沒有敵人佔據的生成點
    const availablePoints = spawnPoints.filter(point => {
        return !gameState.enemies.some(enemy => {
            if (!enemy.alive) return false;
            const dx = Math.abs(enemy.x - point.x);
            const dy = Math.abs(enemy.y - point.y);
            return dx < TILE_SIZE && dy < TILE_SIZE;
        });
    });

    if (availablePoints.length === 0) return; // 沒有可用的生成點

    const spawn = availablePoints[Math.floor(Math.random() * availablePoints.length)];
    const enemy = new Tank(spawn.x, spawn.y, false);
    enemy.direction = DIRECTIONS.DOWN;
    gameState.enemies.push(enemy);
    updateEnemiesDisplay();
}

// 在指定位置生成敵人
function spawnEnemyAt(index) {
    const spawnPoints = [
        { x: TILE_SIZE, y: TILE_SIZE },
        { x: CANVAS_WIDTH / 2 - TILE_SIZE / 2, y: TILE_SIZE },
        { x: CANVAS_WIDTH - TILE_SIZE * 2, y: TILE_SIZE }
    ];

    const spawn = spawnPoints[index % spawnPoints.length];
    const enemy = new Tank(spawn.x, spawn.y, false);
    enemy.direction = DIRECTIONS.DOWN;
    gameState.enemies.push(enemy);
    updateEnemiesDisplay();
}

// 取得反向方向
function getOppositeDirection(dir) {
    if (dir === DIRECTIONS.UP) return DIRECTIONS.DOWN;
    if (dir === DIRECTIONS.DOWN) return DIRECTIONS.UP;
    if (dir === DIRECTIONS.LEFT) return DIRECTIONS.RIGHT;
    if (dir === DIRECTIONS.RIGHT) return DIRECTIONS.LEFT;
    return dir;
}

// ===== 敵人 AI =====
function updateEnemyAI(enemy) {
    if (!enemy.alive) return;

    // 隨機改變方向
    if (Math.random() < 0.02) {
        const dirs = [DIRECTIONS.UP, DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.RIGHT];
        enemy.direction = dirs[Math.floor(Math.random() * dirs.length)];
    }

    // 移動並處理碰撞
    const collision = enemy.move(enemy.direction);

    // 碰到坦克時折返
    if (collision === 'tank') {
        enemy.direction = getOppositeDirection(enemy.direction);
        enemy.move(enemy.direction);
    } else if (collision === 'map' || collision === 'boundary') {
        // 撞牆時隨機改變方向
        const dirs = [DIRECTIONS.UP, DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.RIGHT];
        enemy.direction = dirs[Math.floor(Math.random() * dirs.length)];
    }

    // 隨機射擊
    if (Math.random() < 0.02) {
        const bullet = enemy.fire();
        if (bullet) {
            gameState.bullets.push(bullet);
        }
    }
}

// ===== 遊戲主循環 =====
function gameLoop(timestamp) {
    if (!gameState.isPlaying) return;

    const deltaTime = timestamp - gameState.lastTime;
    gameState.lastTime = timestamp;

    update();
    render();

    requestAnimationFrame(gameLoop);
}

function update() {
    // 更新玩家
    if (gameState.player && gameState.player.alive) {
        gameState.player.update();

        let playerDir = null;
        if (keys.up) playerDir = DIRECTIONS.UP;
        else if (keys.down) playerDir = DIRECTIONS.DOWN;
        else if (keys.left) playerDir = DIRECTIONS.LEFT;
        else if (keys.right) playerDir = DIRECTIONS.RIGHT;

        if (playerDir) {
            const collision = gameState.player.move(playerDir);
            // 碰到坦克時折返
            if (collision === 'tank') {
                gameState.player.direction = getOppositeDirection(playerDir);
                gameState.player.move(gameState.player.direction);
            }
        }
    }

    // 更新敵人
    gameState.enemies.forEach(enemy => {
        enemy.update();
        updateEnemyAI(enemy);
    });

    // 更新子彈
    gameState.bullets.forEach(bullet => bullet.update());
    gameState.bullets = gameState.bullets.filter(b => b.alive);

    // 更新爆炸
    gameState.explosions.forEach(exp => exp.update());
    gameState.explosions = gameState.explosions.filter(e => e.alive);

    // 清理死亡敵人
    gameState.enemies = gameState.enemies.filter(e => e.alive);
    updateEnemiesDisplay();

    // 生成新敵人
    gameState.enemySpawnTimer++;
    if (gameState.enemySpawnTimer > 180) {
        gameState.enemySpawnTimer = 0;
        spawnEnemy();
    }

    // 生成盾牌道具（隨機，大約每10-20秒，且場上沒有盾牌時才生成）
    gameState.powerupSpawnTimer++;
    if (gameState.powerupSpawnTimer > 600 && gameState.powerups.length === 0 && Math.random() < 0.01) {
        spawnPowerup();
        gameState.powerupSpawnTimer = 0;
    }

    // 更新道具
    gameState.powerups.forEach(p => p.update());

    // 檢測玩家吃道具
    if (gameState.player && gameState.player.alive) {
        for (const powerup of gameState.powerups) {
            if (powerup.alive && powerup.intersects(gameState.player)) {
                powerup.alive = false;
                activateShield();
            }
        }
    }
    gameState.powerups = gameState.powerups.filter(p => p.alive);

    // 更新無敵計時器
    if (gameState.invincible) {
        gameState.invincibleTimer--;
        if (gameState.invincibleTimer <= 0) {
            gameState.invincible = false;
        }
    }

    // 更新訊息計時器
    if (gameState.messageTimer > 0) {
        gameState.messageTimer--;
        if (gameState.messageTimer <= 0) {
            gameState.message = null;
        }
    }

    // 檢查過關
    checkLevelComplete();
}

// 生成盾牌道具
function spawnPowerup() {
    // 在空地上隨機生成
    let attempts = 0;
    while (attempts < 50) {
        const tileX = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;
        const tileY = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;

        if (gameState.map[tileY][tileX] === TILES.EMPTY) {
            const x = tileX * TILE_SIZE + 4;
            const y = tileY * TILE_SIZE + 4;
            gameState.powerups.push(new ShieldPowerup(x, y));
            // 顯示提示訊息
            showMessage('🛡️ 盾牌出現了！');
            break;
        }
        attempts++;
    }
}

// 顯示訊息
function showMessage(text) {
    gameState.message = text;
    gameState.messageTimer = 120; // 顯示2秒
}

// 啟動盾牌無敵
function activateShield() {
    gameState.invincible = true;
    gameState.invincibleTimer = 300; // 5秒無敵（60fps * 5）
}

function render() {
    // 清除畫面
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 繪製地圖
    drawMap();

    // 繪製草叢下層
    drawGrass(false);

    // 繪製道具
    gameState.powerups.forEach(p => p.draw(ctx));

    // 繪製坦克
    if (gameState.player) {
        gameState.player.draw(ctx);

        // 無敵狀態效果
        if (gameState.invincible) {
            const pulse = Math.sin(Date.now() / 100) * 0.3 + 0.5;
            ctx.save();
            ctx.globalAlpha = pulse;
            ctx.strokeStyle = '#00BFFF';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(
                gameState.player.x + gameState.player.width / 2,
                gameState.player.y + gameState.player.height / 2,
                gameState.player.width / 2 + 5,
                0, Math.PI * 2
            );
            ctx.stroke();
            ctx.restore();
        }
    }
    gameState.enemies.forEach(enemy => enemy.draw(ctx));

    // 繪製子彈
    gameState.bullets.forEach(bullet => bullet.draw(ctx));

    // 繪製草叢上層
    drawGrass(true);

    // 繪製爆炸
    gameState.explosions.forEach(exp => exp.draw(ctx));

    // 繪製訊息
    if (gameState.message && gameState.messageTimer > 0) {
        const alpha = Math.min(1, gameState.messageTimer / 30); // 淡出效果
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(CANVAS_WIDTH / 2 - 100, 20, 200, 40);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(gameState.message, CANVAS_WIDTH / 2, 40);
        ctx.restore();
    }
}

function drawMap() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = gameState.map[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            switch (tile) {
                case TILES.WALL:
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    // 磚塊紋理
                    ctx.strokeStyle = '#654321';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px, py, TILE_SIZE / 2, TILE_SIZE / 2);
                    ctx.strokeRect(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 2);
                    break;
                case TILES.STEEL:
                    ctx.fillStyle = '#808080';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#A0A0A0';
                    ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    break;
                case TILES.WATER:
                    ctx.fillStyle = '#4169E1';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    // 水波紋
                    ctx.strokeStyle = '#6495ED';
                    ctx.beginPath();
                    ctx.moveTo(px, py + TILE_SIZE / 2);
                    ctx.quadraticCurveTo(px + TILE_SIZE / 2, py + TILE_SIZE / 3, px + TILE_SIZE, py + TILE_SIZE / 2);
                    ctx.stroke();
                    break;
            }
        }
    }
}

function drawGrass(overlay) {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (gameState.map[y][x] === TILES.GRASS) {
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;

                if (overlay) {
                    ctx.globalAlpha = 0.7;
                }
                ctx.fillStyle = '#228B22';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // 草的紋理
                ctx.fillStyle = '#32CD32';
                for (let i = 0; i < 4; i++) {
                    ctx.fillRect(px + 3 + i * 4, py + 2, 2, TILE_SIZE - 4);
                }

                if (overlay) {
                    ctx.globalAlpha = 1;
                }
            }
        }
    }
}

// ===== 生命與分數 =====
function loseLife() {
    if (!gameState.player) return;

    // 無敵狀態不會失去生命
    if (gameState.invincible) return;

    gameState.player.alive = false;
    createExplosion(gameState.player.x + gameState.player.width / 2, gameState.player.y + gameState.player.height / 2);
    gameState.lives--;
    updateLives();

    if (gameState.lives <= 0) {
        endGame();
    } else {
        // 重生
        showMessage('💀 復活中...');
        setTimeout(() => {
            gameState.player = new Tank(CANVAS_WIDTH / 2 - TILE_SIZE / 2, CANVAS_HEIGHT - TILE_SIZE * 2, true);
            showMessage('🎖️ 復活！');
        }, 1000);
    }
}

function updateScore() {
    scoreDisplay.textContent = gameState.score;
}

function updateLives() {
    livesDisplay.textContent = '❤️'.repeat(gameState.lives);
}

function updateEnemiesDisplay() {
    enemiesDisplay.textContent = gameState.enemies.filter(e => e.alive).length;
}

// ===== 關卡控制 =====
function checkLevelComplete() {
    // 消滅足夠敵人過關
    if (gameState.score >= gameState.level * 500) {
        showLevelComplete();
    }
}

function showLevelComplete() {
    gameState.isPlaying = false;

    levelScore.innerHTML = `
        <span class="normal-title">
            關卡 ${gameState.level} 完成！<br>
            目前分數: ${gameState.score}
        </span>
        <span class="ide-title">
            // Level ${gameState.level} cleared!<br>
            // Score: ${gameState.score}
        </span>
    `;

    gameContent.classList.add('hidden');
    levelComplete.classList.remove('hidden');
}

function nextLevel() {
    gameState.level++;
    levelDisplay.textContent = gameState.level;

    levelComplete.classList.add('hidden');
    gameContent.classList.remove('hidden');

    loadLevel(gameState.level);
    gameState.isPlaying = true;
    gameState.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameState.isPlaying = false;

    finalScore.innerHTML = `
        <span class="normal-title">
            最終分數: ${gameState.score}<br>
            到達關卡: ${gameState.level}
        </span>
        <span class="ide-title">
            // Final Score: ${gameState.score}<br>
            // Level Reached: ${gameState.level}
        </span>
    `;

    gameContent.classList.add('hidden');
    gameOver.classList.remove('hidden');
}

// ===== 開始遊戲 =====
function startGame() {
    startScreen.classList.add('hidden');
    gameContent.classList.remove('hidden');

    gameState.score = 0;
    gameState.lives = 3;
    gameState.level = 1;
    gameState.isPlaying = true;

    updateScore();
    updateLives();
    levelDisplay.textContent = '1';

    loadLevel(1);

    gameState.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    gameOver.classList.add('hidden');
    startScreen.classList.remove('hidden');
}

// ===== 事件綁定 =====
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('retry-btn').addEventListener('click', () => {
    gameOver.classList.add('hidden');
    startGame();
});
document.getElementById('back-menu-btn').addEventListener('click', () => {
    window.location.href = '../index.html';
});
document.getElementById('next-level-btn').addEventListener('click', nextLevel);

// 初始化
initGame();
