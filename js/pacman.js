// ===== PAC-MAN 遊戲 =====

// 遊戲常數
const CELL_TYPES = {
    WALL: 1,
    PATH: 0,
    DOT: 2,
    POWER_PELLET: 3,
    EMPTY: 4
};

// 迷宮地圖 (21x19)
const MAZE_TEMPLATE = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
    [4,4,4,1,2,1,0,0,0,0,0,0,0,1,2,1,4,4,4],
    [1,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,1],
    [0,0,0,0,2,0,0,0,0,0,0,0,0,0,2,0,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
    [4,4,4,1,2,1,0,0,0,0,0,0,0,1,2,1,4,4,4],
    [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
    [1,3,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,3,1],
    [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// 遊戲狀態
let gameState = {
    maze: [],
    pacman: { x: 9, y: 15, direction: 'right', nextDirection: null },
    ghosts: [],
    score: 0,
    lives: 3,
    level: 1,
    dotsRemaining: 0,
    powerMode: false,
    powerModeTimer: null,
    powerModeCountdown: null,
    gameLoop: null,
    isPlaying: false,
    isPaused: false,
    ghostSpeed: 280,
    pacmanSpeed: 180,
    cellSize: 28
};

// 鬼魂初始位置（在鬼屋中心區域）
const GHOST_START = [
    { x: 7, y: 9, name: 'blinky', color: '#ff0000' },
    { x: 9, y: 9, name: 'pinky', color: '#ffb8ff' },
    { x: 11, y: 9, name: 'inky', color: '#00ffff' },
    { x: 9, y: 7, name: 'clyde', color: '#ffb852' }
];

// DOM 元素
const startScreen = document.getElementById('start-screen');
const gameContent = document.getElementById('game-content');
const gameOver = document.getElementById('game-over');
const levelComplete = document.getElementById('level-complete');
const gameBoard = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const levelDisplay = document.getElementById('level');
const finalScore = document.getElementById('final-score');
const levelScore = document.getElementById('level-score');

// 按鈕
const startBtn = document.getElementById('start-btn');
const retryBtn = document.getElementById('retry-btn');
const backMenuBtn = document.getElementById('back-menu-btn');
const nextLevelBtn = document.getElementById('next-level-btn');
const mobileControls = document.querySelectorAll('.control-btn');

// ===== 事件監聽 =====
startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', resetGame);
backMenuBtn.addEventListener('click', () => window.location.href = '../index.html');
nextLevelBtn.addEventListener('click', nextLevel);

// 鍵盤控制
document.addEventListener('keydown', handleKeyDown);

// 手機控制按鈕
mobileControls.forEach(btn => {
    btn.addEventListener('click', () => {
        const dir = btn.dataset.dir;
        if (dir && gameState.isPlaying) {
            gameState.pacman.nextDirection = dir;
        }
    });
});

// ===== 初始化迷宮 =====
function initMaze() {
    gameState.maze = JSON.parse(JSON.stringify(MAZE_TEMPLATE));
    gameState.dotsRemaining = 0;

    // 計算豆子數量
    for (let y = 0; y < gameState.maze.length; y++) {
        for (let x = 0; x < gameState.maze[y].length; x++) {
            if (gameState.maze[y][x] === CELL_TYPES.DOT ||
                gameState.maze[y][x] === CELL_TYPES.POWER_PELLET) {
                gameState.dotsRemaining++;
            }
        }
    }
}

// ===== 初始化鬼魂 =====
function initGhosts() {
    gameState.ghosts = GHOST_START.map(g => ({
        ...g,
        startX: g.x,
        startY: g.y,
        direction: 'up',
        scared: false,
        eaten: false
    }));
}

// ===== 渲染遊戲 =====
function renderGame() {
    const rows = gameState.maze.length;
    const cols = gameState.maze[0].length;
    const cellSize = gameState.cellSize;

    gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gameBoard.style.position = 'relative';
    gameBoard.innerHTML = '';

    // 渲染迷宮格子
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.x = x;
            cell.dataset.y = y;

            const cellType = gameState.maze[y][x];

            switch (cellType) {
                case CELL_TYPES.WALL:
                    cell.classList.add('wall');
                    break;
                case CELL_TYPES.PATH:
                case CELL_TYPES.EMPTY:
                    cell.classList.add('path');
                    break;
                case CELL_TYPES.DOT:
                    cell.classList.add('path', 'dot');
                    break;
                case CELL_TYPES.POWER_PELLET:
                    cell.classList.add('path', 'power-pellet');
                    break;
            }

            gameBoard.appendChild(cell);
        }
    }

    // 創建 PAC-MAN 容器（使用絕對定位）
    const pacmanContainer = document.createElement('div');
    pacmanContainer.id = 'pacman-sprite';
    pacmanContainer.className = 'pacman-container';
    pacmanContainer.style.left = `${gameState.pacman.x * cellSize + 4}px`;
    pacmanContainer.style.top = `${gameState.pacman.y * cellSize + 4}px`;

    const pacman = document.createElement('div');
    pacman.className = `pacman ${gameState.pacman.direction}`;
    pacmanContainer.appendChild(pacman);
    gameBoard.appendChild(pacmanContainer);

    // 創建鬼魂容器
    gameState.ghosts.forEach((ghost, index) => {
        const ghostContainer = document.createElement('div');
        ghostContainer.id = `ghost-${index}`;
        ghostContainer.className = 'ghost-container';
        ghostContainer.style.left = `${ghost.x * cellSize + 4}px`;
        ghostContainer.style.top = `${ghost.y * cellSize + 4}px`;

        const ghostEl = document.createElement('div');
        ghostEl.className = `ghost ${ghost.name}`;
        if (ghost.scared) {
            ghostEl.classList.add('scared');
            if (gameState.powerModeTimer && gameState.powerModeTimer < 2000) {
                ghostEl.classList.add('ending');
            }
        }
        if (ghost.eaten) {
            ghostContainer.style.display = 'none';
        }
        ghostContainer.appendChild(ghostEl);
        gameBoard.appendChild(ghostContainer);
    });
}

// ===== 更新角色位置（不重繪整個畫面）=====
function updatePositions(teleport = false) {
    const cellSize = gameState.cellSize;

    // 更新 PAC-MAN 位置
    const pacmanSprite = document.getElementById('pacman-sprite');
    if (pacmanSprite) {
        // 穿越通道時禁用 transition
        if (teleport) {
            pacmanSprite.style.transition = 'none';
        } else {
            pacmanSprite.style.transition = 'left 0.12s linear, top 0.12s linear';
        }

        pacmanSprite.style.left = `${gameState.pacman.x * cellSize + 4}px`;
        pacmanSprite.style.top = `${gameState.pacman.y * cellSize + 4}px`;

        // 更新方向
        const pacmanEl = pacmanSprite.querySelector('.pacman');
        if (pacmanEl) {
            pacmanEl.className = `pacman ${gameState.pacman.direction}`;
        }
    }

    // 同時更新鬼魂位置（非穿越通道的情況）
    updateGhostPositions();
}

// ===== 更新豆子狀態 =====
function updateDot(x, y) {
    const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    if (cell) {
        cell.classList.remove('dot', 'power-pellet');
    }
}

// ===== 處理鍵盤輸入 =====
function handleKeyDown(e) {
    if (!gameState.isPlaying) return;

    const keyMap = {
        'ArrowUp': 'up', 'w': 'up', 'W': 'up',
        'ArrowDown': 'down', 's': 'down', 'S': 'down',
        'ArrowLeft': 'left', 'a': 'left', 'A': 'left',
        'ArrowRight': 'right', 'd': 'right', 'D': 'right'
    };

    const direction = keyMap[e.key];
    if (direction) {
        e.preventDefault();
        gameState.pacman.nextDirection = direction;
    }
}

// ===== 移動 PAC-MAN =====
function movePacman() {
    const { pacman, maze } = gameState;

    // 嘗試轉向
    if (pacman.nextDirection && canMove(pacman.x, pacman.y, pacman.nextDirection)) {
        pacman.direction = pacman.nextDirection;
        pacman.nextDirection = null;
    }

    // 計算新位置
    const newPos = getNewPosition(pacman.x, pacman.y, pacman.direction);

    // 檢查是否可以移動
    if (canMove(pacman.x, pacman.y, pacman.direction)) {
        const oldX = pacman.x;
        pacman.x = newPos.x;
        pacman.y = newPos.y;

        // 穿越通道
        let didTeleport = false;
        if (pacman.x < 0) {
            pacman.x = maze[0].length - 1;
            didTeleport = true;
        }
        if (pacman.x >= maze[0].length) {
            pacman.x = 0;
            didTeleport = true;
        }

        // 吃豆子
        const cell = maze[pacman.y][pacman.x];
        if (cell === CELL_TYPES.DOT) {
            maze[pacman.y][pacman.x] = CELL_TYPES.PATH;
            gameState.score += 10;
            gameState.dotsRemaining--;
            updateDot(pacman.x, pacman.y);
        } else if (cell === CELL_TYPES.POWER_PELLET) {
            maze[pacman.y][pacman.x] = CELL_TYPES.PATH;
            gameState.score += 50;
            gameState.dotsRemaining--;
            updateDot(pacman.x, pacman.y);
            activatePowerMode();
        }

        updateScore();
        checkWin();
        updatePositions(didTeleport);
    } else {
        updatePositions(false);
    }
}

// ===== 移動鬼魂 =====
function moveGhosts() {
    gameState.ghosts.forEach((ghost, index) => {
        if (ghost.eaten) return;

        // AI：根據狀態選擇移動方向
        const directions = ['up', 'down', 'left', 'right'];
        let validDirs = directions.filter(dir => canGhostMove(ghost.x, ghost.y, dir));

        if (validDirs.length === 0) return;

        // 避免回頭（除非沒有其他選擇）
        const oppositeDir = getOppositeDir(ghost.lastDirection);
        if (validDirs.length > 1 && oppositeDir) {
            validDirs = validDirs.filter(dir => dir !== oppositeDir);
        }

        let newDir;

        if (ghost.scared) {
            // 驚嚇模式：逃離 PAC-MAN，加一些隨機性
            if (Math.random() < 0.7) {
                newDir = getEscapeDirection(ghost, validDirs);
            } else {
                newDir = validDirs[Math.floor(Math.random() * validDirs.length)];
            }
        } else {
            // 每隻鬼魂有不同的行為模式
            const chaseChance = getGhostChaseChance(ghost.name);

            if (Math.random() < chaseChance) {
                // 追蹤模式，但避免與其他鬼魂重疊
                newDir = getSmartDirection(ghost, validDirs, index);
            } else {
                // 隨機模式
                newDir = validDirs[Math.floor(Math.random() * validDirs.length)];
            }
        }

        ghost.lastDirection = newDir;

        const newPos = getNewPosition(ghost.x, ghost.y, newDir);

        // 檢查是否穿越通道
        ghost.x = newPos.x;
        ghost.y = newPos.y;
        ghost.direction = newDir;

        // 穿越通道
        if (ghost.x < 0) {
            ghost.x = gameState.maze[0].length - 1;
            ghost.teleported = true;
        } else if (ghost.x >= gameState.maze[0].length) {
            ghost.x = 0;
            ghost.teleported = true;
        } else {
            ghost.teleported = false;
        }
    });

    updateGhostPositions();
}

// 取得反方向
function getOppositeDir(dir) {
    const opposites = { 'up': 'down', 'down': 'up', 'left': 'right', 'right': 'left' };
    return opposites[dir];
}

// 每隻鬼魂的追蹤機率不同
function getGhostChaseChance(name) {
    switch (name) {
        case 'blinky': return 0.85; // 紅色 - 最積極追蹤
        case 'pinky': return 0.6;  // 粉色 - 中等追蹤
        case 'inky': return 0.5;   // 藍色 - 較隨機
        case 'clyde': return 0.4;  // 橙色 - 最隨機
        default: return 0.5;
    }
}

// 智能方向選擇，避免與其他鬼魂重疊
function getSmartDirection(ghost, validDirs, ghostIndex) {
    const { pacman, ghosts } = gameState;

    // 計算每個方向的分數
    let bestDir = validDirs[0];
    let bestScore = -Infinity;

    validDirs.forEach(dir => {
        const newPos = getNewPosition(ghost.x, ghost.y, dir);

        // 距離 PAC-MAN 的分數（越近越高）
        const distToPacman = Math.abs(newPos.x - pacman.x) + Math.abs(newPos.y - pacman.y);
        let score = 100 - distToPacman;

        // 避免與其他鬼魂太近（扣分）
        ghosts.forEach((otherGhost, otherIndex) => {
            if (otherIndex !== ghostIndex && !otherGhost.eaten) {
                const distToGhost = Math.abs(newPos.x - otherGhost.x) + Math.abs(newPos.y - otherGhost.y);
                if (distToGhost < 3) {
                    score -= (3 - distToGhost) * 10; // 太近扣分
                }
            }
        });

        if (score > bestScore) {
            bestScore = score;
            bestDir = dir;
        }
    });

    return bestDir;
}

// ===== 更新鬼魂位置（處理穿越通道的瞬移問題）=====
function updateGhostPositions() {
    const cellSize = gameState.cellSize;

    gameState.ghosts.forEach((ghost, index) => {
        const ghostContainer = document.getElementById(`ghost-${index}`);
        if (ghostContainer) {
            // 穿越通道時禁用 transition
            if (ghost.teleported) {
                ghostContainer.style.transition = 'none';
            } else {
                ghostContainer.style.transition = 'left 0.15s linear, top 0.15s linear';
            }

            ghostContainer.style.left = `${ghost.x * cellSize + 4}px`;
            ghostContainer.style.top = `${ghost.y * cellSize + 4}px`;

            if (ghost.eaten) {
                ghostContainer.style.display = 'none';
            } else {
                ghostContainer.style.display = 'flex';
                const ghostEl = ghostContainer.querySelector('.ghost');
                if (ghostEl) {
                    ghostEl.className = `ghost ${ghost.name}`;
                    if (ghost.scared) {
                        ghostEl.classList.add('scared');
                        if (gameState.powerModeTimer && gameState.powerModeTimer < 2000) {
                            ghostEl.classList.add('ending');
                        }
                    }
                }
            }
        }
    });
}

// ===== 鬼魂追蹤邏輯 =====
function getBestDirection(ghost, validDirs) {
    const { pacman } = gameState;
    let bestDir = validDirs[0];
    let bestDist = Infinity;

    validDirs.forEach(dir => {
        const newPos = getNewPosition(ghost.x, ghost.y, dir);
        const dist = Math.abs(newPos.x - pacman.x) + Math.abs(newPos.y - pacman.y);
        if (dist < bestDist) {
            bestDist = dist;
            bestDir = dir;
        }
    });

    return bestDir;
}

// ===== 鬼魂逃跑邏輯 =====
function getEscapeDirection(ghost, validDirs) {
    const { pacman } = gameState;
    let bestDir = validDirs[0];
    let bestDist = -Infinity;

    // 選擇離 PAC-MAN 最遠的方向
    validDirs.forEach(dir => {
        const newPos = getNewPosition(ghost.x, ghost.y, dir);
        const dist = Math.abs(newPos.x - pacman.x) + Math.abs(newPos.y - pacman.y);
        if (dist > bestDist) {
            bestDist = dist;
            bestDir = dir;
        }
    });

    return bestDir;
}

// ===== 取得新位置 =====
function getNewPosition(x, y, direction) {
    switch (direction) {
        case 'up': return { x, y: y - 1 };
        case 'down': return { x, y: y + 1 };
        case 'left': return { x: x - 1, y };
        case 'right': return { x: x + 1, y };
        default: return { x, y };
    }
}

// ===== 檢查是否可移動 =====
function canMove(x, y, direction) {
    const newPos = getNewPosition(x, y, direction);
    const { maze } = gameState;

    // 邊界檢查（允許穿越通道）
    if (newPos.y < 0 || newPos.y >= maze.length) return false;

    // 穿越通道
    if (newPos.x < 0 || newPos.x >= maze[0].length) {
        return maze[y][0] !== CELL_TYPES.WALL && maze[y][0] !== CELL_TYPES.EMPTY;
    }

    const cell = maze[newPos.y][newPos.x];
    return cell !== CELL_TYPES.WALL && cell !== CELL_TYPES.EMPTY;
}

// ===== 鬼魂可移動檢查 =====
function canGhostMove(x, y, direction) {
    const newPos = getNewPosition(x, y, direction);
    const { maze } = gameState;

    if (newPos.y < 0 || newPos.y >= maze.length) return false;
    if (newPos.x < 0 || newPos.x >= maze[0].length) {
        return maze[y][0] !== CELL_TYPES.WALL;
    }

    const cell = maze[newPos.y][newPos.x];
    return cell !== CELL_TYPES.WALL;
}

// ===== 啟動大力丸模式 =====
function activatePowerMode() {
    gameState.powerMode = true;
    gameState.ghosts.forEach(g => g.scared = true);

    // 清除舊計時器
    if (gameState.powerModeCountdown) {
        clearInterval(gameState.powerModeCountdown);
    }

    // 8秒後結束
    let remaining = 8000;
    gameState.powerModeTimer = remaining;

    gameState.powerModeCountdown = setInterval(() => {
        remaining -= 100;
        gameState.powerModeTimer = remaining;

        if (remaining <= 0) {
            clearInterval(gameState.powerModeCountdown);
            gameState.powerMode = false;
            gameState.powerModeTimer = null;
            gameState.powerModeCountdown = null;
            gameState.ghosts.forEach(g => {
                g.scared = false;
                g.eaten = false;
            });
            updatePositions();
        }
    }, 100);
}

// ===== 碰撞檢測 =====
function checkCollision() {
    const { pacman, ghosts } = gameState;

    ghosts.forEach(ghost => {
        if (ghost.eaten) return;

        if (ghost.x === pacman.x && ghost.y === pacman.y) {
            if (ghost.scared) {
                // 吃掉鬼魂
                ghost.eaten = true;
                ghost.scared = false; // 被吃掉後不再是 scared 狀態
                gameState.score += 200;
                updateScore();

                // 鬼魂返回起點，復活後不再可吃（直到下一顆大力丸）
                setTimeout(() => {
                    ghost.x = ghost.startX;
                    ghost.y = ghost.startY;
                    ghost.eaten = false;
                    // 復活後不再是 scared 狀態，即使 power mode 還在
                    ghost.scared = false;
                    updateGhostPositions();
                }, 3000);
            } else {
                // 被鬼魂抓到
                loseLife();
            }
        }
    });
}

// ===== 失去生命 =====
function loseLife() {
    gameState.lives--;
    updateLives();

    if (gameState.lives <= 0) {
        endGame();
    } else {
        // 重置位置
        resetPositions();
    }
}

// ===== 重置位置 =====
function resetPositions() {
    gameState.pacman = { x: 9, y: 15, direction: 'right', nextDirection: null };
    initGhosts();
    gameState.powerMode = false;
    if (gameState.powerModeCountdown) {
        clearInterval(gameState.powerModeCountdown);
        gameState.powerModeTimer = null;
        gameState.powerModeCountdown = null;
    }
    renderGame();
}

// ===== 更新分數 =====
function updateScore() {
    scoreDisplay.textContent = gameState.score;
}

// ===== 更新生命 =====
function updateLives() {
    livesDisplay.textContent = '❤️'.repeat(gameState.lives);
}

// ===== 檢查勝利 =====
function checkWin() {
    if (gameState.dotsRemaining <= 0) {
        showLevelComplete();
    }
}

// ===== 顯示過關畫面 =====
function showLevelComplete() {
    gameState.isPlaying = false;
    stopGameLoop();

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

// ===== 下一關 =====
function nextLevel() {
    gameState.level++;
    gameState.ghostSpeed = Math.max(100, gameState.ghostSpeed - 15);
    levelDisplay.textContent = gameState.level;

    levelComplete.classList.add('hidden');
    gameContent.classList.remove('hidden');

    initMaze();
    resetPositions();
    renderGame();
    startGameLoop();
    gameState.isPlaying = true;
}

// ===== 結束遊戲 =====
function endGame() {
    gameState.isPlaying = false;
    stopGameLoop();

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

// ===== 遊戲主循環 =====
function startGameLoop() {
    // PAC-MAN 移動
    gameState.pacmanLoop = setInterval(() => {
        if (!gameState.isPlaying) return;
        movePacman();
        checkCollision();
    }, gameState.pacmanSpeed);

    // 鬼魂移動
    gameState.ghostLoop = setInterval(() => {
        if (!gameState.isPlaying) return;
        moveGhosts();
        checkCollision();
    }, gameState.ghostSpeed);
}

function stopGameLoop() {
    if (gameState.pacmanLoop) clearInterval(gameState.pacmanLoop);
    if (gameState.ghostLoop) clearInterval(gameState.ghostLoop);
}

// ===== 開始遊戲 =====
function startGame() {
    startScreen.classList.add('hidden');
    gameContent.classList.remove('hidden');

    gameState.score = 0;
    gameState.lives = 3;
    gameState.level = 1;
    gameState.ghostSpeed = 200;
    gameState.isPlaying = true;

    updateScore();
    updateLives();
    levelDisplay.textContent = '1';

    initMaze();
    gameState.pacman = { x: 9, y: 15, direction: 'right', nextDirection: null };
    initGhosts();
    renderGame();
    startGameLoop();
}

// ===== 重置遊戲 =====
function resetGame() {
    gameOver.classList.add('hidden');
    startScreen.classList.remove('hidden');
    stopGameLoop();
}
