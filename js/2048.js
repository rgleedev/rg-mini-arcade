// 2048 遊戲
(function () {
    const GRID_SIZE = 4;
    const BEST_SCORE_KEY = 'rg-2048-best';

    let grid = [];
    let score = 0;
    let bestScore = 0;
    let gameOver = false;
    let won = false;
    let keepPlaying = false;

    // DOM 元素
    const gridBackground = document.getElementById('grid-background');
    const tileContainer = document.getElementById('tile-container');
    const scoreDisplay = document.getElementById('score');
    const bestScoreDisplay = document.getElementById('best-score');
    const gameOverScreen = document.getElementById('game-over');
    const gameWinScreen = document.getElementById('game-win');
    const finalScoreMsg = document.getElementById('final-score-msg');
    const newGameBtn = document.getElementById('new-game-btn');
    const retryBtn = document.getElementById('retry-btn');
    const continueBtn = document.getElementById('continue-btn');
    const newGameWinBtn = document.getElementById('new-game-win-btn');

    // 初始化網格背景
    function initGridBackground() {
        gridBackground.innerHTML = '';
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            gridBackground.appendChild(cell);
        }
    }

    // 初始化遊戲
    function initGame() {
        grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
        score = 0;
        gameOver = false;
        won = false;
        keepPlaying = false;

        loadBestScore();
        updateScore();
        hideMessages();

        // 加入兩個初始方塊
        addRandomTile();
        addRandomTile();
        renderGrid();
    }

    // 載入最高分
    function loadBestScore() {
        bestScore = parseInt(localStorage.getItem(BEST_SCORE_KEY)) || 0;
        bestScoreDisplay.textContent = bestScore;
    }

    // 儲存最高分
    function saveBestScore() {
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem(BEST_SCORE_KEY, bestScore);
            bestScoreDisplay.textContent = bestScore;
        }
    }

    // 更新分數
    function updateScore() {
        scoreDisplay.textContent = score;
    }

    // 隱藏訊息
    function hideMessages() {
        gameOverScreen.classList.add('hidden');
        gameWinScreen.classList.add('hidden');
    }

    // 取得空白格子
    function getEmptyCells() {
        const empty = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (grid[r][c] === 0) {
                    empty.push({ r, c });
                }
            }
        }
        return empty;
    }

    // 隨機加入方塊
    function addRandomTile() {
        const empty = getEmptyCells();
        if (empty.length === 0) return false;

        const { r, c } = empty[Math.floor(Math.random() * empty.length)];
        grid[r][c] = Math.random() < 0.9 ? 2 : 4;
        return { r, c, value: grid[r][c] };
    }

    // 渲染網格
    function renderGrid(newTile = null, mergedPositions = []) {
        tileContainer.innerHTML = '';

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (grid[r][c] !== 0) {
                    const tile = document.createElement('div');
                    const value = grid[r][c];
                    const tileClass = value <= 2048 ? `tile-${value}` : 'tile-super';

                    tile.className = `tile ${tileClass}`;
                    tile.textContent = value;
                    tile.style.left = `calc(${c} * (100% - 30px) / 4 + ${c} * 10px)`;
                    tile.style.top = `calc(${r} * (100% - 30px) / 4 + ${r} * 10px)`;

                    // 新方塊動畫
                    if (newTile && newTile.r === r && newTile.c === c) {
                        tile.classList.add('new');
                    }

                    // 合併動畫
                    if (mergedPositions.some(p => p.r === r && p.c === c)) {
                        tile.classList.add('merged');
                    }

                    tileContainer.appendChild(tile);
                }
            }
        }
    }

    // 移動邏輯
    function move(direction) {
        if (gameOver) return false;

        let moved = false;
        const mergedPositions = [];
        const merged = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));

        const vectors = {
            up: { r: -1, c: 0 },
            down: { r: 1, c: 0 },
            left: { r: 0, c: -1 },
            right: { r: 0, c: 1 }
        };

        const vector = vectors[direction];

        // 決定遍歷順序
        const rows = direction === 'down' ? [3, 2, 1, 0] : [0, 1, 2, 3];
        const cols = direction === 'right' ? [3, 2, 1, 0] : [0, 1, 2, 3];

        for (const r of rows) {
            for (const c of cols) {
                if (grid[r][c] === 0) continue;

                let newR = r;
                let newC = c;

                // 找到最遠可移動位置
                while (true) {
                    const nextR = newR + vector.r;
                    const nextC = newC + vector.c;

                    if (nextR < 0 || nextR >= GRID_SIZE || nextC < 0 || nextC >= GRID_SIZE) break;

                    if (grid[nextR][nextC] === 0) {
                        newR = nextR;
                        newC = nextC;
                    } else if (grid[nextR][nextC] === grid[r][c] && !merged[nextR][nextC]) {
                        // 合併
                        newR = nextR;
                        newC = nextC;
                        break;
                    } else {
                        break;
                    }
                }

                if (newR !== r || newC !== c) {
                    moved = true;

                    if (grid[newR][newC] === grid[r][c]) {
                        // 合併
                        grid[newR][newC] *= 2;
                        score += grid[newR][newC];
                        merged[newR][newC] = true;
                        mergedPositions.push({ r: newR, c: newC });

                        // 檢查是否達到 2048
                        if (grid[newR][newC] === 2048 && !won && !keepPlaying) {
                            won = true;
                        }
                    } else {
                        grid[newR][newC] = grid[r][c];
                    }

                    grid[r][c] = 0;
                }
            }
        }

        if (moved) {
            const newTile = addRandomTile();
            renderGrid(newTile, mergedPositions);
            updateScore();
            saveBestScore();

            if (won && !keepPlaying) {
                showWin();
            } else if (!canMove()) {
                showGameOver();
            }
        }

        return moved;
    }

    // 檢查是否還能移動
    function canMove() {
        // 有空格
        if (getEmptyCells().length > 0) return true;

        // 檢查相鄰是否有相同數字
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const current = grid[r][c];
                if (r < GRID_SIZE - 1 && grid[r + 1][c] === current) return true;
                if (c < GRID_SIZE - 1 && grid[r][c + 1] === current) return true;
            }
        }

        return false;
    }

    // 顯示遊戲結束
    function showGameOver() {
        gameOver = true;
        finalScoreMsg.innerHTML = `
            <span class="normal-title">最終分數：<strong>${score}</strong></span>
            <span class="ide-title">finalScore: ${score};</span>
        `;
        gameOverScreen.classList.remove('hidden');
    }

    // 顯示勝利
    function showWin() {
        gameWinScreen.classList.remove('hidden');
    }

    // 繼續遊戲
    function continueGame() {
        keepPlaying = true;
        gameWinScreen.classList.add('hidden');
    }

    // 鍵盤控制
    function handleKeyDown(e) {
        const keyMap = {
            ArrowUp: 'up',
            ArrowDown: 'down',
            ArrowLeft: 'left',
            ArrowRight: 'right',
            w: 'up',
            W: 'up',
            s: 'down',
            S: 'down',
            a: 'left',
            A: 'left',
            d: 'right',
            D: 'right'
        };

        const direction = keyMap[e.key];
        if (direction) {
            e.preventDefault();
            move(direction);
        }
    }

    // 觸控控制
    let touchStartX = 0;
    let touchStartY = 0;

    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }

    function handleTouchEnd(e) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;

        const minSwipe = 30;

        if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

        if (Math.abs(dx) > Math.abs(dy)) {
            move(dx > 0 ? 'right' : 'left');
        } else {
            move(dy > 0 ? 'down' : 'up');
        }
    }

    // 事件監聽
    document.addEventListener('keydown', handleKeyDown);

    const gameContainer = document.getElementById('game-container');
    gameContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    gameContainer.addEventListener('touchend', handleTouchEnd, { passive: true });

    newGameBtn.addEventListener('click', initGame);
    retryBtn.addEventListener('click', initGame);
    continueBtn.addEventListener('click', continueGame);
    newGameWinBtn.addEventListener('click', initGame);

    // 初始化
    initGridBackground();
    initGame();
})();
