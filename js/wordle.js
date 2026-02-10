// Wordle 猜單字遊戲
(function () {
    const STATS_KEY = 'rg-wordle-stats';

    // 單字庫（將從 JSON 檔案載入）
    let WORDS = [];
    let VALID_GUESSES = new Set();

    // 載入單字庫
    async function loadWords() {
        try {
            // 嘗試不同路徑（支援從不同位置載入）
            const paths = [
                '../data/wordle-words.json',
                './data/wordle-words.json',
                '/data/wordle-words.json'
            ];

            let data = null;
            for (const path of paths) {
                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        data = await response.json();
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!data) {
                throw new Error('Failed to load word list from all paths');
            }

            WORDS = data.answers;
            // 有效猜測 = 答案單字 + 額外猜測單字
            // 支援新舊格式：物件格式 {word, zh} 或字串格式
            const answerWords = data.answers.map(item => typeof item === 'string' ? item : item.word);
            const extraWords = data.extraGuesses || [];
            VALID_GUESSES = new Set([...answerWords, ...extraWords]);
            console.log(`Wordle 單字庫已載入：${WORDS.length} 個答案，${VALID_GUESSES.size} 個有效猜測`);
            return true;
        } catch (error) {
            console.error('載入單字庫失敗:', error);
            return false;
        }
    }

    // 遊戲設定
    const WORD_LENGTH = 5;
    const MAX_ATTEMPTS = 6;

    // 遊戲狀態
    let targetWord = ''; // 目標單字（英文）
    let targetWordZh = ''; // 目標單字（中文翻譯）
    let currentRow = 0;
    let currentTile = 0;
    let currentGuess = '';
    let gameOver = false;
    let stats = {
        played: 0,
        won: 0,
        currentStreak: 0,
        maxStreak: 0,
        guessDistribution: [0, 0, 0, 0, 0, 0]
    };

    // DOM 元素
    let startScreen, gameBoard, keyboard, messageEl, gameOverScreen;
    let startBtn, restartBtn, shareBtn;

    // 初始化
    async function init() {
        // 載入單字庫
        const loaded = await loadWords();
        if (!loaded) {
            alert('無法載入單字庫，請重新整理頁面');
            return;
        }

        // 獲取 DOM 元素
        startScreen = document.getElementById('start-screen');
        gameBoard = document.getElementById('game-board');
        keyboard = document.getElementById('keyboard');
        messageEl = document.getElementById('message');
        gameOverScreen = document.getElementById('game-over');
        startBtn = document.getElementById('start-btn');
        restartBtn = document.getElementById('restart-btn');
        shareBtn = document.getElementById('share-btn');

        // 載入統計
        loadStats();
        updateStatsDisplay();

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

    // 更新統計顯示
    function updateStatsDisplay() {
        const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
        document.getElementById('win-rate').textContent = `${winRate}%`;
        document.getElementById('streak').textContent = stats.currentStreak;
    }

    // 建立遊戲板
    function createBoard() {
        gameBoard.innerHTML = '';
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            const row = document.createElement('div');
            row.className = 'board-row';
            for (let j = 0; j < WORD_LENGTH; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.dataset.row = i;
                tile.dataset.col = j;
                row.appendChild(tile);
            }
            gameBoard.appendChild(row);
        }
    }

    // 綁定事件
    function bindEvents() {
        // 開始按鈕
        startBtn.addEventListener('click', startGame);

        // 重新開始按鈕
        restartBtn.addEventListener('click', () => {
            gameOverScreen.classList.add('hidden');
            startGame();
        });

        // 分享按鈕
        shareBtn.addEventListener('click', shareResult);

        // 最小化按鈕
        const minimizeBtn = document.getElementById('minimize-btn');
        const restoreBtn = document.getElementById('restore-btn');

        minimizeBtn.addEventListener('click', () => {
            gameOverScreen.classList.add('minimized');
            restoreBtn.classList.remove('hidden');
        });

        // 恢復按鈕
        restoreBtn.addEventListener('click', () => {
            gameOverScreen.classList.remove('minimized');
            restoreBtn.classList.add('hidden');
        });

        // ESC 鍵切換最小化/恢復
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !gameOverScreen.classList.contains('hidden')) {
                if (gameOverScreen.classList.contains('minimized')) {
                    gameOverScreen.classList.remove('minimized');
                    restoreBtn.classList.add('hidden');
                } else {
                    gameOverScreen.classList.add('minimized');
                    restoreBtn.classList.remove('hidden');
                }
            }
        });

        // 點擊背景恢復視窗
        gameOverScreen.addEventListener('click', e => {
            if (e.target === gameOverScreen && gameOverScreen.classList.contains('minimized')) {
                gameOverScreen.classList.remove('minimized');
                restoreBtn.classList.add('hidden');
            }
        });

        // 虛擬鍵盤
        keyboard.addEventListener('click', e => {
            const key = e.target.closest('.key');
            if (key) {
                const keyValue = key.dataset.key;
                if (keyValue === 'ENTER') {
                    submitGuess();
                } else if (keyValue === 'BACKSPACE') {
                    deleteLetter();
                } else {
                    addLetter(keyValue);
                }
            }
        });

        // 實體鍵盤
        document.addEventListener('keydown', e => {
            if (startScreen.classList.contains('hidden') === false) return;
            if (gameOverScreen.classList.contains('hidden') === false) return;
            if (gameOver) return;

            if (e.key === 'Enter') {
                submitGuess();
            } else if (e.key === 'Backspace') {
                deleteLetter();
            } else if (/^[a-zA-Z]$/.test(e.key)) {
                addLetter(e.key.toUpperCase());
            }
        });
    }

    // 開始遊戲
    function startGame() {
        // 選擇隨機單字
        const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
        // 支援新舊格式
        if (typeof randomWord === 'string') {
            targetWord = randomWord;
            targetWordZh = '';
        } else {
            targetWord = randomWord.word;
            targetWordZh = randomWord.zh || '';
        }
        currentRow = 0;
        currentTile = 0;
        currentGuess = '';
        gameOver = false;

        // 重置遊戲板
        const tiles = gameBoard.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.textContent = '';
            tile.className = 'tile';
        });

        // 重置鍵盤
        const keys = keyboard.querySelectorAll('.key');
        keys.forEach(key => {
            key.classList.remove('correct', 'present', 'absent');
        });

        // 隱藏開始畫面，顯示遊戲
        startScreen.classList.add('hidden');
        gameBoard.classList.remove('hidden');
        keyboard.classList.remove('hidden');
        messageEl.classList.add('hidden');

        // 更新嘗試次數
        updateAttempts();
    }

    // 更新嘗試次數顯示
    function updateAttempts() {
        document.getElementById('attempts').textContent = `${currentRow}/${MAX_ATTEMPTS}`;
    }

    // 添加字母
    function addLetter(letter) {
        if (currentTile >= WORD_LENGTH || gameOver) return;

        const tile = getTile(currentRow, currentTile);
        tile.textContent = letter;
        tile.classList.add('filled');
        currentGuess += letter;
        currentTile++;
    }

    // 刪除字母
    function deleteLetter() {
        if (currentTile <= 0 || gameOver) return;

        currentTile--;
        const tile = getTile(currentRow, currentTile);
        tile.textContent = '';
        tile.classList.remove('filled');
        currentGuess = currentGuess.slice(0, -1);
    }

    // 提交猜測
    function submitGuess() {
        if (gameOver) return;

        if (currentGuess.length !== WORD_LENGTH) {
            showMessage('請輸入 5 個字母');
            shakeRow(currentRow);
            return;
        }

        // 驗證是否為有效單字
        if (!VALID_GUESSES.has(currentGuess)) {
            showMessage('不是有效的英文單字');
            shakeRow(currentRow);
            return;
        }

        // 檢查結果
        const result = checkGuess(currentGuess);
        revealResult(result);
    }

    // 檢查猜測結果
    function checkGuess(guess) {
        const result = [];
        const targetLetters = targetWord.split('');
        const guessLetters = guess.split('');

        // 第一輪：標記正確位置（綠色）
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (guessLetters[i] === targetLetters[i]) {
                result[i] = 'correct';
                targetLetters[i] = null;
                guessLetters[i] = null;
            }
        }

        // 第二輪：標記錯誤位置（黃色）和不存在（灰色）
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (guessLetters[i] === null) continue;

            const index = targetLetters.indexOf(guessLetters[i]);
            if (index !== -1) {
                result[i] = 'present';
                targetLetters[index] = null;
            } else {
                result[i] = 'absent';
            }
        }

        return result;
    }

    // 顯示結果
    function revealResult(result) {
        const row = gameBoard.children[currentRow];
        const tiles = row.querySelectorAll('.tile');

        tiles.forEach((tile, i) => {
            setTimeout(() => {
                tile.classList.add('flip');
                setTimeout(() => {
                    tile.classList.add(result[i]);
                    updateKeyboard(currentGuess[i], result[i]);
                }, 250);
            }, i * 300);
        });

        // 等待動畫完成後檢查遊戲狀態
        setTimeout(() => {
            if (currentGuess === targetWord) {
                gameWon();
            } else if (currentRow >= MAX_ATTEMPTS - 1) {
                gameLost();
            } else {
                currentRow++;
                currentTile = 0;
                currentGuess = '';
                updateAttempts();
            }
        }, WORD_LENGTH * 300 + 500);
    }

    // 更新鍵盤顏色
    function updateKeyboard(letter, state) {
        const key = keyboard.querySelector(`[data-key="${letter}"]`);
        if (!key) return;

        // 優先級：correct > present > absent
        if (key.classList.contains('correct')) return;
        if (key.classList.contains('present') && state !== 'correct') return;

        key.classList.remove('absent', 'present', 'correct');
        key.classList.add(state);
    }

    // 遊戲勝利
    function gameWon() {
        gameOver = true;

        // 更新統計
        stats.played++;
        stats.won++;
        stats.currentStreak++;
        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
        stats.guessDistribution[currentRow]++;
        saveStats();
        updateStatsDisplay();

        // 勝利動畫
        const row = gameBoard.children[currentRow];
        const tiles = row.querySelectorAll('.tile');
        tiles.forEach((tile, i) => {
            setTimeout(() => {
                tile.classList.add('bounce');
            }, i * 100);
        });

        // 顯示結束畫面
        setTimeout(() => {
            showGameOver(true);
        }, 1500);
    }

    // 遊戲失敗
    function gameLost() {
        gameOver = true;

        // 更新統計
        stats.played++;
        stats.currentStreak = 0;
        saveStats();
        updateStatsDisplay();

        // 顯示結束畫面
        setTimeout(() => {
            showGameOver(false);
        }, 500);
    }

    // 顯示遊戲結束畫面
    function showGameOver(won) {
        const title = gameOverScreen.querySelector('#game-over-title');
        const normalTitle = title.querySelector('.normal-title');
        const ideTitle = title.querySelector('.ide-title');

        if (won) {
            const messages = ['🎉 天才！', '🎉 太厲害了！', '🎉 好棒！', '🎉 不錯！', '🎉 好險！', '🎉 呼！'];
            normalTitle.textContent = messages[currentRow];
            ideTitle.textContent = '// SUCCESS!';
        } else {
            normalTitle.textContent = '😢 可惜！';
            ideTitle.textContent = '// GAME OVER';
        }

        // 更新答案顯示
        const answerText = targetWordZh ? `${targetWord} (${targetWordZh})` : targetWord;
        document.getElementById('answer-display').textContent = answerText;
        document.getElementById('answer-display-ide').textContent = answerText;
        document.getElementById('final-attempts').textContent = currentRow + 1;
        document.getElementById('final-attempts-ide').textContent = currentRow + 1;

        // 顯示結束畫面並清除最小化狀態
        gameOverScreen.classList.remove('hidden', 'minimized');
        document.getElementById('restore-btn').classList.add('hidden');
    }

    // 分享結果
    function shareResult() {
        // 確保遊戲已結束
        if (!gameOver) return;

        const rows = gameBoard.querySelectorAll('.board-row');
        // 計算實際嘗試次數（失敗時為 MAX_ATTEMPTS，成功時為 currentRow + 1）
        const actualAttempts = currentGuess === targetWord ? currentRow + 1 : MAX_ATTEMPTS;
        let shareText = `Wordle ${actualAttempts}/${MAX_ATTEMPTS}\n\n`;

        // 只複製有填寫內容的行
        for (let i = 0; i < actualAttempts; i++) {
            const tiles = rows[i].querySelectorAll('.tile');
            let hasContent = false;
            let rowText = '';

            tiles.forEach(tile => {
                if (tile.textContent) {
                    hasContent = true;
                    if (tile.classList.contains('correct')) {
                        rowText += '🟩';
                    } else if (tile.classList.contains('present')) {
                        rowText += '🟨';
                    } else if (tile.classList.contains('absent')) {
                        rowText += '⬜';
                    }
                }
            });

            if (hasContent) {
                shareText += rowText + '\n';
            }
        }

        navigator.clipboard.writeText(shareText).then(() => {
            showMessage('已複製到剪貼簿！');
        }).catch(() => {
            showMessage('複製失敗');
        });
    }

    // 顯示訊息
    function showMessage(text) {
        messageEl.textContent = text;
        messageEl.classList.remove('hidden');
        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 2000);
    }

    // 搖動行
    function shakeRow(rowIndex) {
        const row = gameBoard.children[rowIndex];
        row.classList.add('shake');
        setTimeout(() => {
            row.classList.remove('shake');
        }, 500);
    }

    // 取得方塊
    function getTile(row, col) {
        return gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    // 啟動遊戲
    init();
})();
