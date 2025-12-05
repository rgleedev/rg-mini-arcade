// ===== 數字拼圖遊戲 =====

// 遊戲狀態
let gameState = {
    size: 3,              // 拼圖大小 (3x3, 4x4, 5x5)
    tiles: [],            // 拼圖陣列
    emptyPos: { row: 0, col: 0 },  // 空格位置
    moves: 0,             // 移動次數
    startTime: null,      // 開始時間
    timerInterval: null,  // 計時器
    isPlaying: false      // 遊戲進行中
};

// DOM 元素
const startScreen = document.getElementById('start-screen');
const gameContent = document.getElementById('game-content');
const winScreen = document.getElementById('win-screen');
const puzzleContainer = document.getElementById('puzzle-container');
const movesDisplay = document.getElementById('moves');
const timeDisplay = document.getElementById('time');
const winStatsDisplay = document.getElementById('win-stats');

// 按鈕
const startBtn = document.getElementById('start-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const hintBtn = document.getElementById('hint-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const backMenuBtn = document.getElementById('back-menu-btn');
const sizeButtons = document.querySelectorAll('.size-btn');

// ===== 事件監聽 =====
startBtn.addEventListener('click', startGame);
shuffleBtn.addEventListener('click', shufflePuzzle);
hintBtn.addEventListener('click', showHint);
playAgainBtn.addEventListener('click', resetToStart);
backMenuBtn.addEventListener('click', () => window.location.href = '../index.html');

// 難度選擇
sizeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        sizeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameState.size = parseInt(btn.dataset.size);
    });
});

// ===== 初始化拼圖 =====
function initPuzzle() {
    const size = gameState.size;
    gameState.tiles = [];

    // 建立已排序的拼圖陣列
    for (let row = 0; row < size; row++) {
        gameState.tiles[row] = [];
        for (let col = 0; col < size; col++) {
            const value = row * size + col + 1;
            gameState.tiles[row][col] = value <= size * size - 1 ? value : 0;
        }
    }

    // 空格在右下角
    gameState.emptyPos = { row: size - 1, col: size - 1 };
}

// ===== 渲染拼圖 =====
function renderPuzzle() {
    const size = gameState.size;
    puzzleContainer.innerHTML = '';
    puzzleContainer.className = `puzzle-container size-${size}`;

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const value = gameState.tiles[row][col];
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile';
            tile.dataset.row = row;
            tile.dataset.col = col;

            if (value === 0) {
                tile.classList.add('empty');
            } else {
                tile.textContent = value;
                tile.addEventListener('click', () => handleTileClick(row, col));
            }

            puzzleContainer.appendChild(tile);
        }
    }
}

// ===== 處理方塊點擊 =====
function handleTileClick(row, col) {
    if (!gameState.isPlaying) return;

    const { row: emptyRow, col: emptyCol } = gameState.emptyPos;

    // 檢查是否相鄰空格
    const isAdjacent =
        (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
        (Math.abs(col - emptyCol) === 1 && row === emptyRow);

    if (isAdjacent) {
        // 交換方塊與空格
        const temp = gameState.tiles[row][col];
        gameState.tiles[row][col] = gameState.tiles[emptyRow][emptyCol];
        gameState.tiles[emptyRow][emptyCol] = temp;

        gameState.emptyPos = { row, col };
        gameState.moves++;
        movesDisplay.textContent = gameState.moves;

        renderPuzzle();

        // 檢查是否完成
        if (checkWin()) {
            endGame();
        }
    }
}

// ===== 打亂拼圖 =====
function shufflePuzzle() {
    const size = gameState.size;
    const moves = size === 3 ? 50 : size === 4 ? 100 : size === 5 ? 150 : 200;

    // 使用隨機移動來打亂，確保可解
    for (let i = 0; i < moves; i++) {
        const validMoves = getValidMoves();
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];

        const { row: emptyRow, col: emptyCol } = gameState.emptyPos;
        const temp = gameState.tiles[randomMove.row][randomMove.col];
        gameState.tiles[randomMove.row][randomMove.col] = gameState.tiles[emptyRow][emptyCol];
        gameState.tiles[emptyRow][emptyCol] = temp;

        gameState.emptyPos = randomMove;
    }

    renderPuzzle();
}

// ===== 獲取可移動的方塊 =====
function getValidMoves() {
    const { row, col } = gameState.emptyPos;
    const size = gameState.size;
    const moves = [];

    // 上下左右
    const directions = [
        { row: row - 1, col: col },  // 上
        { row: row + 1, col: col },  // 下
        { row: row, col: col - 1 },  // 左
        { row: row, col: col + 1 }   // 右
    ];

    directions.forEach(dir => {
        if (dir.row >= 0 && dir.row < size && dir.col >= 0 && dir.col < size) {
            moves.push(dir);
        }
    });

    return moves;
}

// ===== 檢查是否完成 =====
function checkWin() {
    const size = gameState.size;
    let expected = 1;

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (row === size - 1 && col === size - 1) {
                // 最後一格應該是空格 (0)
                if (gameState.tiles[row][col] !== 0) return false;
            } else {
                if (gameState.tiles[row][col] !== expected) return false;
                expected++;
            }
        }
    }

    return true;
}

// ===== 提示功能 =====
function showHint() {
    if (!gameState.isPlaying) return;

    const size = gameState.size;
    let foundWrong = false;

    // 移除之前的提示效果
    document.querySelectorAll('.puzzle-tile').forEach(tile => {
        tile.classList.remove('correct', 'hint-highlight');
    });

    // 檢查每個方塊是否在正確位置
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const value = gameState.tiles[row][col];
            const correctValue = row * size + col + 1;
            const tile = puzzleContainer.children[row * size + col];

            if (value === correctValue || (row === size - 1 && col === size - 1 && value === 0)) {
                tile.classList.add('correct');
            } else if (!foundWrong && value !== 0) {
                // 高亮第一個錯誤的方塊
                tile.classList.add('hint-highlight');
                foundWrong = true;
            }
        }
    }
}

// ===== 計時器 =====
function startTimer() {
    gameState.startTime = Date.now();
    gameState.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

// ===== 開始遊戲 =====
function startGame() {
    startScreen.classList.add('hidden');
    gameContent.classList.remove('hidden');

    gameState.moves = 0;
    gameState.isPlaying = true;
    movesDisplay.textContent = '0';
    timeDisplay.textContent = '0:00';

    initPuzzle();
    shufflePuzzle();
    startTimer();
}

// ===== 結束遊戲 =====
function endGame() {
    gameState.isPlaying = false;
    stopTimer();

    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const difficultyText = gameState.size === 3 ? '簡單' : gameState.size === 4 ? '中等' : gameState.size === 5 ? '困難' : '專家';

    winStatsDisplay.innerHTML = `
        <span class="normal-title">
            難度: ${difficultyText} (${gameState.size}×${gameState.size})<br>
            移動次數: ${gameState.moves}<br>
            完成時間: ${timeStr}
        </span>
        <span class="ide-title">
            // Difficulty: ${gameState.size}×${gameState.size}<br>
            // Moves: ${gameState.moves}<br>
            // Time: ${timeStr}
        </span>
    `;

    gameContent.classList.add('hidden');
    winScreen.classList.remove('hidden');
}

// ===== 重置到開始畫面 =====
function resetToStart() {
    winScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    stopTimer();
    gameState.isPlaying = false;
}
