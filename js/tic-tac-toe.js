// 井字遊戲 (Tic-Tac-Toe)
(function() {
    const WINNING_COMBOS = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // 橫
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // 直
        [0, 4, 8], [2, 4, 6]             // 斜
    ];

    const PLAYER = 'O';
    const AI = 'X';

    // 遊戲狀態
    let board = [];
    let difficulty = 'medium';
    let isPlaying = false;
    let isPlayerTurn = true;
    let playerScore = 0;
    let aiScore = 0;
    let drawScore = 0;

    // DOM 元素
    const startScreen = document.getElementById('start-screen');
    const gameStats = document.getElementById('game-stats');
    const gameStatus = document.getElementById('game-status');
    const gameBoard = document.getElementById('game-board');
    const gameControls = document.getElementById('game-controls');
    const resultScreen = document.getElementById('result-screen');
    const resultTitle = document.getElementById('result-title');
    const resultMsg = document.getElementById('result-msg');
    const cells = document.querySelectorAll('.ttt-cell');
    const playerScoreDisplay = document.getElementById('player-score');
    const aiScoreDisplay = document.getElementById('ai-score');
    const drawScoreDisplay = document.getElementById('draw-score');
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');

    // 更新狀態提示
    function updateStatus(text, ideText) {
        const normalTitle = gameStatus.querySelector('.normal-title');
        const ideTitle = gameStatus.querySelector('.ide-title');
        normalTitle.textContent = text;
        ideTitle.textContent = ideText;
    }

    // 檢查勝利
    function checkWinner(boardState) {
        for (const combo of WINNING_COMBOS) {
            const [a, b, c] = combo;
            if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
                return { winner: boardState[a], combo };
            }
        }
        return null;
    }

    // 檢查平手
    function checkDraw(boardState) {
        return boardState.every(cell => cell !== '');
    }

    // AI 移動
    function aiMove() {
        if (!isPlaying) return;

        let move;

        if (difficulty === 'easy') {
            move = getRandomMove();
        } else if (difficulty === 'medium') {
            // 50% 機率用最佳策略，50% 隨機
            move = Math.random() < 0.5 ? getBestMove() : getRandomMove();
        } else {
            move = getBestMove();
        }

        if (move !== null) {
            makeMove(move, AI);
        }
    }

    // 隨機移動
    function getRandomMove() {
        const available = board.map((cell, i) => cell === '' ? i : null).filter(i => i !== null);
        if (available.length === 0) return null;
        return available[Math.floor(Math.random() * available.length)];
    }

    // Minimax 演算法 - 最佳移動
    function getBestMove() {
        let bestScore = -Infinity;
        let bestMove = null;

        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = AI;
                const score = minimax(board, 0, false);
                board[i] = '';

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }

        return bestMove;
    }

    // Minimax 遞迴
    function minimax(boardState, depth, isMaximizing) {
        const result = checkWinner(boardState);

        if (result) {
            return result.winner === AI ? 10 - depth : depth - 10;
        }

        if (checkDraw(boardState)) {
            return 0;
        }

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (boardState[i] === '') {
                    boardState[i] = AI;
                    const score = minimax(boardState, depth + 1, false);
                    boardState[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (boardState[i] === '') {
                    boardState[i] = PLAYER;
                    const score = minimax(boardState, depth + 1, true);
                    boardState[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    // 執行移動
    function makeMove(index, player) {
        board[index] = player;
        cells[index].textContent = player;
        cells[index].disabled = true;
        cells[index].classList.add(player.toLowerCase());

        const result = checkWinner(board);

        if (result) {
            endGame(result.winner, result.combo);
            return;
        }

        if (checkDraw(board)) {
            endGame('draw');
            return;
        }

        isPlayerTurn = !isPlayerTurn;

        if (isPlayerTurn) {
            updateStatus('輪到你了！', '// Your turn');
        } else {
            updateStatus('AI 思考中...', '// AI thinking...');
            setTimeout(aiMove, 500);
        }
    }

    // 玩家點擊
    function handleCellClick(index) {
        if (!isPlaying || !isPlayerTurn || board[index] !== '') return;
        makeMove(index, PLAYER);
    }

    // 結束遊戲
    function endGame(winner, combo = null) {
        isPlaying = false;

        // 標記獲勝格子
        if (combo) {
            combo.forEach(i => cells[i].classList.add('winner'));
        }

        const isIDE = document.body.classList.contains('ide-mode');

        setTimeout(() => {
            if (winner === PLAYER) {
                playerScore++;
                playerScoreDisplay.textContent = playerScore;
                resultTitle.innerHTML = isIDE
                    ? '<span class="ide-title">// You Win!</span>'
                    : '<span class="normal-title">🎉 你贏了！</span>';
                resultMsg.innerHTML = isIDE
                    ? '<span class="ide-title">// Great job!</span>'
                    : '<span class="normal-title">太厲害了！</span>';
            } else if (winner === AI) {
                aiScore++;
                aiScoreDisplay.textContent = aiScore;
                resultTitle.innerHTML = isIDE
                    ? '<span class="ide-title">// AI Wins</span>'
                    : '<span class="normal-title">🤖 AI 贏了</span>';
                resultMsg.innerHTML = isIDE
                    ? '<span class="ide-title">// Try again</span>'
                    : '<span class="normal-title">再試一次吧！</span>';
            } else {
                drawScore++;
                drawScoreDisplay.textContent = drawScore;
                resultTitle.innerHTML = isIDE
                    ? '<span class="ide-title">// Draw</span>'
                    : '<span class="normal-title">🤝 平手</span>';
                resultMsg.innerHTML = isIDE
                    ? '<span class="ide-title">// Well matched</span>'
                    : '<span class="normal-title">勢均力敵！</span>';
            }

            gameBoard.classList.add('hidden');
            gameControls.classList.add('hidden');
            gameStatus.classList.add('hidden');
            resultScreen.classList.remove('hidden');
        }, 800);
    }

    // 開始遊戲
    function startGame() {
        board = Array(9).fill('');
        isPlaying = true;
        isPlayerTurn = true;

        cells.forEach(cell => {
            cell.textContent = '';
            cell.disabled = false;
            cell.classList.remove('winner', 'x', 'o');
        });

        updateStatus('輪到你了！', '// Your turn');

        startScreen.classList.add('hidden');
        resultScreen.classList.add('hidden');
        gameStats.classList.remove('hidden');
        gameStatus.classList.remove('hidden');
        gameBoard.classList.remove('hidden');
        gameControls.classList.remove('hidden');
    }

    // 返回開始畫面
    function backToStart() {
        playerScore = 0;
        aiScore = 0;
        drawScore = 0;
        playerScoreDisplay.textContent = '0';
        aiScoreDisplay.textContent = '0';
        drawScoreDisplay.textContent = '0';

        resultScreen.classList.add('hidden');
        gameStats.classList.add('hidden');
        gameStatus.classList.add('hidden');
        gameBoard.classList.add('hidden');
        gameControls.classList.add('hidden');
        startScreen.classList.remove('hidden');
    }

    // 選擇難度
    function selectDifficulty(e) {
        const btn = e.target.closest('.difficulty-btn');
        if (!btn) return;

        difficultyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        difficulty = btn.dataset.difficulty;
    }

    // 事件綁定
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', startGame);
    document.getElementById('play-again-btn').addEventListener('click', startGame);
    document.getElementById('back-btn').addEventListener('click', backToStart);
    difficultyBtns.forEach(btn => btn.addEventListener('click', selectDifficulty));
    cells.forEach((cell, index) => {
        cell.addEventListener('click', () => handleCellClick(index));
    });
})();
