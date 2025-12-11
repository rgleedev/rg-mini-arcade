// 數獨遊戲
(function () {
    const STATS_KEY = 'rg-sudoku-stats';

    // 遊戲狀態
    let board = [];
    let solution = [];
    let initialBoard = [];
    let selectedCell = null;
    let noteMode = false;
    let difficulty = 'easy';
    let timer = 0;
    let timerInterval = null;
    let hintsUsed = 0;
    let history = [];
    let stats = {
        played: 0,
        completed: 0,
        bestTimes: { easy: null, medium: null, hard: null }
    };

    // DOM 元素
    let startScreen, gameBoard, gameControls, numberPad, messageEl, gameOverScreen;
    let timerEl, difficultyDisplayEl;
    let noteModeBtn, hintBtn, undoBtn, eraseBtn, newGameBtn, restartBtn;

    // 初始化
    function init() {
        // 獲取 DOM 元素
        startScreen = document.getElementById('start-screen');
        gameBoard = document.getElementById('game-board');
        gameControls = document.getElementById('game-controls');
        numberPad = document.getElementById('number-pad');
        messageEl = document.getElementById('message');
        gameOverScreen = document.getElementById('game-over');
        timerEl = document.getElementById('timer');
        difficultyDisplayEl = document.getElementById('difficulty-display');
        noteModeBtn = document.getElementById('note-mode-btn');
        hintBtn = document.getElementById('hint-btn');
        undoBtn = document.getElementById('undo-btn');
        eraseBtn = document.getElementById('erase-btn');
        newGameBtn = document.getElementById('new-game-btn');
        restartBtn = document.getElementById('restart-btn');

        // 載入統計
        loadStats();

        // 建立遊戲板
        createBoard();

        // 綁定事件
        bindEvents();
    }

    // 載入統計資料
    function loadStats() {
        const saved = localStorage.getItem(STATS_KEY);
        if (saved) {
            stats = JSON.parse(saved);
        }
    }

    // 儲存統計資料
    function saveStats() {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }

    // 建立遊戲板
    function createBoard() {
        gameBoard.innerHTML = '';
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                // 添加宮格邊框
                if (col % 3 === 2 && col < 8) cell.classList.add('border-right');
                if (row % 3 === 2 && row < 8) cell.classList.add('border-bottom');

                gameBoard.appendChild(cell);
            }
        }
    }

    // 綁定事件
    function bindEvents() {
        // 難度選擇按鈕
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                difficulty = btn.dataset.difficulty;
                startGame();
            });
        });

        // 遊戲板點擊
        gameBoard.addEventListener('click', e => {
            const cell = e.target.closest('.cell');
            if (cell && !cell.classList.contains('initial')) {
                selectCell(cell);
            }
        });

        // 點擊遊戲板外部取消選取
        document.addEventListener('click', e => {
            if (startScreen.classList.contains('hidden') === false) return;
            if (gameOverScreen.classList.contains('hidden') === false) return;

            // 如果點擊的不是遊戲板、數字鍵盤、控制按鈕，則取消選取
            if (!gameBoard.contains(e.target) &&
                !numberPad.contains(e.target) &&
                !gameControls.contains(e.target)) {
                deselectCell();
            }
        });

        // 數字鍵盤
        numberPad.addEventListener('click', e => {
            const btn = e.target.closest('.num-btn');
            if (btn && selectedCell) {
                const num = parseInt(btn.dataset.num);
                if (noteMode) {
                    toggleNote(num);
                } else {
                    placeNumber(num);
                }
            }
        });

        // 鍵盤輸入
        document.addEventListener('keydown', e => {
            if (startScreen.classList.contains('hidden') === false) return;
            if (gameOverScreen.classList.contains('hidden') === false) return;

            if (e.key >= '1' && e.key <= '9') {
                const num = parseInt(e.key);
                if (selectedCell) {
                    if (noteMode) {
                        toggleNote(num);
                    } else {
                        placeNumber(num);
                    }
                }
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                if (selectedCell) {
                    eraseCell();
                }
            } else if (e.key === 'n' || e.key === 'N') {
                toggleNoteMode();
            }
        });

        // 控制按鈕
        noteModeBtn.addEventListener('click', toggleNoteMode);
        hintBtn.addEventListener('click', giveHint);
        undoBtn.addEventListener('click', undo);
        eraseBtn.addEventListener('click', eraseCell);
        newGameBtn.addEventListener('click', () => {
            startScreen.classList.remove('hidden');
            gameBoard.classList.add('hidden');
            gameControls.classList.add('hidden');
            numberPad.classList.add('hidden');
            stopTimer();
        });
        restartBtn.addEventListener('click', () => {
            gameOverScreen.classList.add('hidden');
            startGame();
        });
    }

    // 開始遊戲
    function startGame() {
        // 生成數獨
        generateSudoku();

        // 重置狀態
        hintsUsed = 0;
        history = [];
        noteMode = false;
        selectedCell = null;
        timer = 0;

        // 更新顯示
        updateDifficultyDisplay();
        noteModeBtn.classList.remove('active');

        // 隱藏開始畫面，顯示遊戲
        startScreen.classList.add('hidden');
        gameBoard.classList.remove('hidden');
        gameControls.classList.remove('hidden');
        numberPad.classList.remove('hidden');

        // 渲染遊戲板
        renderBoard();

        // 開始計時
        startTimer();
    }

    // 生成數獨
    function generateSudoku() {
        // 生成完整的解答
        solution = generateFullBoard();

        // 複製解答作為初始板
        board = solution.map(row => [...row]);
        initialBoard = solution.map(row => [...row]);

        // 根據難度移除數字
        const cellsToRemove = {
            easy: 40,
            medium: 50,
            hard: 60
        }[difficulty];

        let removed = 0;
        while (removed < cellsToRemove) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            if (board[row][col] !== 0) {
                board[row][col] = 0;
                initialBoard[row][col] = 0;
                removed++;
            }
        }
    }

    // 生成完整的數獨板
    function generateFullBoard() {
        const board = Array(9).fill(0).map(() => Array(9).fill(0));

        function fillBoard(row, col) {
            if (col === 9) {
                row++;
                col = 0;
            }
            if (row === 9) return true;

            const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            shuffleArray(numbers);

            for (const num of numbers) {
                if (isValid(board, row, col, num)) {
                    board[row][col] = num;
                    if (fillBoard(row, col + 1)) return true;
                    board[row][col] = 0;
                }
            }
            return false;
        }

        fillBoard(0, 0);
        return board;
    }

    // 檢查數字是否有效
    function isValid(board, row, col, num) {
        // 檢查行
        for (let c = 0; c < 9; c++) {
            if (board[row][c] === num) return false;
        }

        // 檢查列
        for (let r = 0; r < 9; r++) {
            if (board[r][col] === num) return false;
        }

        // 檢查 3×3 宮格
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (board[r][c] === num) return false;
            }
        }

        return true;
    }

    // 洗牌陣列
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // 渲染遊戲板
    function renderBoard() {
        const cells = gameBoard.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = board[row][col];

            cell.textContent = value || '';
            cell.classList.remove('initial', 'error', 'selected', 'highlight', 'same-number');

            if (initialBoard[row][col] !== 0) {
                cell.classList.add('initial');
            }
        });
    }

    // 選擇格子
    function selectCell(cell) {
        // 清除之前的選擇
        const cells = gameBoard.querySelectorAll('.cell');
        cells.forEach(c => {
            c.classList.remove('selected', 'highlight', 'same-number');
        });

        selectedCell = cell;
        cell.classList.add('selected');

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const value = board[row][col];

        // 只高亮同行和同列（不包括九宮格）
        cells.forEach(c => {
            const r = parseInt(c.dataset.row);
            const co = parseInt(c.dataset.col);
            if (r === row || co === col) {
                c.classList.add('highlight');
            }

            // 高亮相同數字
            if (value !== 0 && board[r][co] === value) {
                c.classList.add('same-number');
            }
        });
    }

    // 取消選取
    function deselectCell() {
        if (!selectedCell) return;
        const cells = gameBoard.querySelectorAll('.cell');
        cells.forEach(c => {
            c.classList.remove('selected', 'highlight', 'same-number');
        });
        selectedCell = null;
    }

    // 放置數字
    function placeNumber(num) {
        if (!selectedCell) return;

        const row = parseInt(selectedCell.dataset.row);
        const col = parseInt(selectedCell.dataset.col);

        // 保存歷史
        history.push({
            row, col,
            oldValue: board[row][col],
            newValue: num
        });

        board[row][col] = num;
        selectedCell.textContent = num;

        // 檢查是否正確
        if (num !== solution[row][col]) {
            selectedCell.classList.add('error');
            showMessage('❌ 錯誤！');

            setTimeout(() => {
                selectedCell.classList.remove('error');
            }, 1000);
        } else {
            // 檢查是否完成
            if (checkComplete()) {
                gameOver(true);
            }
        }

        // 重新選擇以更新高亮
        selectCell(selectedCell);
    }

    // 切換筆記
    function toggleNote(num) {
        if (!selectedCell) return;

        const row = parseInt(selectedCell.dataset.row);
        const col = parseInt(selectedCell.dataset.col);

        if (board[row][col] !== 0) return;

        let notes = selectedCell.dataset.notes ? selectedCell.dataset.notes.split(',') : [];
        const numStr = num.toString();

        if (notes.includes(numStr)) {
            notes = notes.filter(n => n !== numStr);
        } else {
            notes.push(numStr);
            notes.sort();
        }

        selectedCell.dataset.notes = notes.join(',');

        // 顯示筆記
        if (notes.length > 0) {
            selectedCell.innerHTML = `<div class="notes">${notes.map(n => `<span>${n}</span>`).join('')}</div>`;
        } else {
            selectedCell.innerHTML = '';
        }
    }

    // 切換筆記模式
    function toggleNoteMode() {
        noteMode = !noteMode;
        noteModeBtn.classList.toggle('active', noteMode);
        showMessage(noteMode ? '✏️ 筆記模式開啟' : '✏️ 筆記模式關閉');
    }

    // 給提示
    function giveHint() {
        if (!selectedCell) {
            showMessage('💡 請先選擇一個格子');
            return;
        }

        const row = parseInt(selectedCell.dataset.row);
        const col = parseInt(selectedCell.dataset.col);

        if (board[row][col] !== 0) {
            showMessage('💡 這個格子已填入數字');
            return;
        }

        const correctNum = solution[row][col];
        board[row][col] = correctNum;
        selectedCell.textContent = correctNum;
        selectedCell.classList.add('initial');
        hintsUsed++;

        showMessage(`💡 提示：${correctNum}`);

        if (checkComplete()) {
            gameOver(true);
        }
    }

    // 撤銷
    function undo() {
        if (history.length === 0) {
            showMessage('↶ 沒有可撤銷的操作');
            return;
        }

        const lastMove = history.pop();
        board[lastMove.row][lastMove.col] = lastMove.oldValue;

        const cell = gameBoard.querySelector(`[data-row="${lastMove.row}"][data-col="${lastMove.col}"]`);
        cell.textContent = lastMove.oldValue || '';

        if (selectedCell === cell) {
            selectCell(cell);
        }

        showMessage('↶ 已撤銷');
    }

    // 清除格子
    function eraseCell() {
        if (!selectedCell) return;

        const row = parseInt(selectedCell.dataset.row);
        const col = parseInt(selectedCell.dataset.col);

        if (initialBoard[row][col] !== 0) return;

        history.push({
            row, col,
            oldValue: board[row][col],
            newValue: 0
        });

        board[row][col] = 0;
        selectedCell.textContent = '';
        delete selectedCell.dataset.notes;
    }

    // 檢查是否完成
    function checkComplete() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0 || board[row][col] !== solution[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }

    // 遊戲結束
    function gameOver(won) {
        stopTimer();

        if (won) {
            stats.completed++;
            const timeKey = difficulty;
            if (!stats.bestTimes[timeKey] || timer < stats.bestTimes[timeKey]) {
                stats.bestTimes[timeKey] = timer;
            }
            saveStats();

            document.getElementById('final-time').textContent = formatTime(timer);
            document.getElementById('final-time-ide').textContent = formatTime(timer);
            document.getElementById('final-difficulty').textContent = getDifficultyText();
            document.getElementById('final-difficulty-ide').textContent = difficulty.toUpperCase();

            gameOverScreen.classList.remove('hidden');
        } else {
            showMessage('😢 錯誤太多，遊戲結束！');
            setTimeout(() => {
                startScreen.classList.remove('hidden');
                gameBoard.classList.add('hidden');
                gameControls.classList.add('hidden');
                numberPad.classList.add('hidden');
            }, 2000);
        }

        stats.played++;
        saveStats();
    }

    // 計時器
    function startTimer() {
        timer = 0;
        timerInterval = setInterval(() => {
            timer++;
            timerEl.textContent = formatTime(timer);
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // 更新顯示
    function updateDifficultyDisplay() {
        difficultyDisplayEl.textContent = getDifficultyText();
    }

    function getDifficultyText() {
        return { easy: '簡單', medium: '中等', hard: '困難' }[difficulty];
    }

    // 顯示訊息
    function showMessage(text) {
        messageEl.textContent = text;
        messageEl.classList.remove('hidden');
        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 2000);
    }

    // 啟動遊戲
    init();
})();
