// Wordle 猜單字遊戲
(function () {
    const STATS_KEY = 'rg-wordle-stats';

    // 單字庫（將從 JSON 檔案載入）
    let WORDS = [];
    let VALID_GUESSES = new Set();

    // 載入單字庫
    async function loadWords() {
        try {
            const response = await fetch('../data/wordle-words.json');
            if (!response.ok) {
                throw new Error('Failed to load word list');
            }
            const data = await response.json();
            WORDS = data.answers;
            // 有效猜測 = 答案單字 + 額外猜測單字
            VALID_GUESSES = new Set([...data.answers, ...data.extraGuesses]);
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
    let targetWord = '';
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
    let boardEl, keyboardEl, messageEl, newGameBtn, statsBtn, helpBtn;
    let modalEl, modalContentEl, modalCloseBtn;

    // 初始化遊戲
    async function init() {
        // 先載入單字庫
        const loaded = await loadWords();
        if (!loaded) {
            alert('無法載入單字庫，請重新整理頁面');
            return;
        }

        // 獲取 DOM 元素
        boardEl = document.getElementById('board');
        keyboardEl = document.getElementById('keyboard');
        messageEl = document.getElementById('message');
        newGameBtn = document.getElementById('newGameBtn');
        statsBtn = document.getElementById('statsBtn');
        helpBtn = document.getElementById('helpBtn');
        modalEl = document.getElementById('modal');
        modalContentEl = document.getElementById('modalContent');
        modalCloseBtn = document.getElementById('modalClose');

        // 載入統計資料
        loadStats();

        // 建立遊戲板
        createBoard();

        // 建立鍵盤
        createKeyboard();

        // 綁定事件
        bindEvents();

        // 開始新遊戲
        startNewGame();
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
        boardEl.innerHTML = '';
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            const row = document.createElement('div');
            row.className = 'row';
            for (let j = 0; j < WORD_LENGTH; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.dataset.row = i;
                tile.dataset.col = j;
                row.appendChild(tile);
            }
            boardEl.appendChild(row);
        }
    }

    // 建立鍵盤
    function createKeyboard() {
        const rows = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
        ];

        keyboardEl.innerHTML = '';
        rows.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'keyboard-row';
            row.forEach(key => {
                const keyEl = document.createElement('button');
                keyEl.className = 'key';
                keyEl.textContent = key;
                keyEl.dataset.key = key;
                if (key === 'ENTER' || key === '⌫') {
                    keyEl.classList.add('wide');
                }
                rowEl.appendChild(keyEl);
            });
            keyboardEl.appendChild(rowEl);
        });
    }

    // 綁定事件
    function bindEvents() {
        // 鍵盤點擊
        keyboardEl.addEventListener('click', e => {
            if (e.target.classList.contains('key')) {
                handleKeyPress(e.target.dataset.key);
            }
        });

        // 實體鍵盤
        document.addEventListener('keydown', e => {
            if (modalEl.classList.contains('active')) return;
            
            if (e.key === 'Enter') {
                handleKeyPress('ENTER');
            } else if (e.key === 'Backspace') {
                handleKeyPress('⌫');
            } else if (/^[a-zA-Z]$/.test(e.key)) {
                handleKeyPress(e.key.toUpperCase());
            }
        });

        // 按鈕
        newGameBtn.addEventListener('click', startNewGame);
        statsBtn.addEventListener('click', showStats);
        helpBtn.addEventListener('click', showHelp);
        modalCloseBtn.addEventListener('click', closeModal);
        modalEl.addEventListener('click', e => {
            if (e.target === modalEl) closeModal();
        });
    }

    // 開始新遊戲
    function startNewGame() {
        targetWord = WORDS[Math.floor(Math.random() * WORDS.length)];
        currentRow = 0;
        currentTile = 0;
        currentGuess = '';
        gameOver = false;

        // 重置遊戲板
        const tiles = boardEl.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.textContent = '';
            tile.className = 'tile';
        });

        // 重置鍵盤
        const keys = keyboardEl.querySelectorAll('.key');
        keys.forEach(key => {
            key.className = 'key';
            if (key.dataset.key === 'ENTER' || key.dataset.key === '⌫') {
                key.classList.add('wide');
            }
        });

        // 清除訊息
        showMessage('');
        closeModal();
    }

    // 處理按鍵
    function handleKeyPress(key) {
        if (gameOver) return;

        if (key === 'ENTER') {
            submitGuess();
        } else if (key === '⌫') {
            deleteLetter();
        } else if (currentTile < WORD_LENGTH) {
            addLetter(key);
        }
    }

    // 添加字母
    function addLetter(letter) {
        if (currentTile >= WORD_LENGTH) return;

        const tile = getTile(currentRow, currentTile);
        tile.textContent = letter;
        tile.classList.add('filled');
        currentGuess += letter;
        currentTile++;
    }

    // 刪除字母
    function deleteLetter() {
        if (currentTile <= 0) return;

        currentTile--;
        const tile = getTile(currentRow, currentTile);
        tile.textContent = '';
        tile.classList.remove('filled');
        currentGuess = currentGuess.slice(0, -1);
    }

    // 提交猜測
    function submitGuess() {
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
        const row = boardEl.children[currentRow];
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
            }
        }, WORD_LENGTH * 300 + 500);
    }

    // 更新鍵盤顏色
    function updateKeyboard(letter, state) {
        const key = keyboardEl.querySelector(`[data-key="${letter}"]`);
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
        const messages = ['天才！', '太厲害了！', '好棒！', '不錯！', '好險！', '呼！'];
        showMessage(messages[currentRow]);

        // 更新統計
        stats.played++;
        stats.won++;
        stats.currentStreak++;
        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
        stats.guessDistribution[currentRow]++;
        saveStats();

        // 勝利動畫
        const row = boardEl.children[currentRow];
        const tiles = row.querySelectorAll('.tile');
        tiles.forEach((tile, i) => {
            setTimeout(() => {
                tile.classList.add('bounce');
            }, i * 100);
        });

        setTimeout(showStats, 2000);
    }

    // 遊戲失敗
    function gameLost() {
        gameOver = true;
        showMessage(`答案是：${targetWord}`);

        // 更新統計
        stats.played++;
        stats.currentStreak = 0;
        saveStats();

        setTimeout(showStats, 2000);
    }

    // 顯示訊息
    function showMessage(text) {
        messageEl.textContent = text;
    }

    // 搖動行
    function shakeRow(rowIndex) {
        const row = boardEl.children[rowIndex];
        row.classList.add('shake');
        setTimeout(() => {
            row.classList.remove('shake');
        }, 500);
    }

    // 取得方塊
    function getTile(row, col) {
        return boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    // 顯示統計
    function showStats() {
        const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
        const maxDist = Math.max(...stats.guessDistribution, 1);

        let html = `
            <h2>統計資料</h2>
            <div class="stats-grid">
                <div class="stat">
                    <div class="stat-value">${stats.played}</div>
                    <div class="stat-label">遊戲次數</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${winRate}</div>
                    <div class="stat-label">勝率 %</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${stats.currentStreak}</div>
                    <div class="stat-label">目前連勝</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${stats.maxStreak}</div>
                    <div class="stat-label">最高連勝</div>
                </div>
            </div>
            <h3>猜測分布</h3>
            <div class="distribution">
        `;

        for (let i = 0; i < 6; i++) {
            const count = stats.guessDistribution[i];
            const width = Math.max((count / maxDist) * 100, 8);
            const isLast = gameOver && i === currentRow && currentGuess === targetWord;
            html += `
                <div class="dist-row">
                    <div class="dist-label">${i + 1}</div>
                    <div class="dist-bar ${isLast ? 'highlight' : ''}" style="width: ${width}%">${count}</div>
                </div>
            `;
        }

        html += '</div>';
        showModal(html);
    }

    // 顯示說明
    function showHelp() {
        const html = `
            <h2>遊戲規則</h2>
            <p>在 6 次嘗試內猜出 5 個字母的英文單字。</p>
            <p>每次猜測後，方塊顏色會改變以顯示你的猜測與答案的接近程度。</p>
            
            <div class="example">
                <div class="example-row">
                    <div class="tile correct">W</div>
                    <div class="tile">E</div>
                    <div class="tile">A</div>
                    <div class="tile">R</div>
                    <div class="tile">Y</div>
                </div>
                <p><strong>W</strong> 在正確的位置（綠色）</p>
            </div>
            
            <div class="example">
                <div class="example-row">
                    <div class="tile">P</div>
                    <div class="tile present">I</div>
                    <div class="tile">L</div>
                    <div class="tile">O</div>
                    <div class="tile">T</div>
                </div>
                <p><strong>I</strong> 在單字中但位置錯誤（黃色）</p>
            </div>
            
            <div class="example">
                <div class="example-row">
                    <div class="tile">V</div>
                    <div class="tile">A</div>
                    <div class="tile">G</div>
                    <div class="tile absent">U</div>
                    <div class="tile">E</div>
                </div>
                <p><strong>U</strong> 不在單字中（灰色）</p>
            </div>
            
            <p>📝 只能輸入真正的英文單字！</p>
        `;
        showModal(html);
    }

    // 顯示彈窗
    function showModal(content) {
        modalContentEl.innerHTML = content;
        modalEl.classList.add('active');
    }

    // 關閉彈窗
    function closeModal() {
        modalEl.classList.remove('active');
    }

    // 啟動遊戲
    init();
})();
