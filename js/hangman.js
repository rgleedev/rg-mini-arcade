// Hangman 猜單字遊戲
(function() {
    // 單字庫（將從 JSON 檔案載入）
    let WORDS = [];

    // 載入單字庫
    async function loadWords() {
        try {
            const paths = [
                '../data/hangman-words.json',
                './data/hangman-words.json',
                '/data/hangman-words.json'
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
                throw new Error('Failed to load word list');
            }

            WORDS = data.words;
            console.log(`Hangman 單字庫已載入：${WORDS.length} 個單字`);
            return true;
        } catch (error) {
            console.error('載入單字庫失敗:', error);
            // 備用單字
            WORDS = [
                { word: 'APPLE', hint: '紅色的水果' },
                { word: 'BANANA', hint: '黃色彎彎的水果' },
                { word: 'ORANGE', hint: '橘色的水果' },
                { word: 'HAPPY', hint: '開心的' },
                { word: 'MUSIC', hint: '用耳朵聽的藝術' }
            ];
            return false;
        }
    }

    const BODY_PARTS = ['head', 'body', 'left-arm', 'right-arm', 'left-leg', 'right-leg'];
    const MAX_LIVES = 6;

    // 遊戲狀態
    let currentWord = '';
    let currentHint = '';
    let guessedLetters = [];
    let lives = MAX_LIVES;
    let streak = 0;
    let isPlaying = false;

    // DOM 元素
    const startScreen = document.getElementById('start-screen');
    const gameStats = document.getElementById('game-stats');
    const gameContent = document.getElementById('game-content');
    const gameOverScreen = document.getElementById('game-over');
    const winScreen = document.getElementById('win-screen');
    const wordDisplay = document.getElementById('word-display');
    const hintDisplay = document.getElementById('hint');
    const keyboard = document.getElementById('keyboard');
    const livesDisplay = document.getElementById('lives');
    const streakDisplay = document.getElementById('streak');
    const gameOverMsg = document.getElementById('game-over-msg');
    const winMsg = document.getElementById('win-msg');

    // 建立虛擬鍵盤
    function createKeyboard() {
        keyboard.innerHTML = '';
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        letters.split('').forEach(letter => {
            const btn = document.createElement('button');
            btn.className = 'key-btn';
            btn.textContent = letter;
            btn.dataset.letter = letter;
            btn.addEventListener('click', () => handleGuess(letter));
            keyboard.appendChild(btn);
        });
    }

    // 選擇隨機單字
    function selectWord() {
        const randomIndex = Math.floor(Math.random() * WORDS.length);
        const selected = WORDS[randomIndex];
        currentWord = selected.word;
        currentHint = selected.hint;
    }

    // 更新單字顯示
    function updateWordDisplay() {
        wordDisplay.innerHTML = '';

        currentWord.split('').forEach(letter => {
            const box = document.createElement('div');
            box.className = 'letter-box';
            box.textContent = guessedLetters.includes(letter) ? letter : '';
            wordDisplay.appendChild(box);
        });
    }

    // 更新吊人圖
    function updateHangman() {
        const wrongCount = MAX_LIVES - lives;

        BODY_PARTS.forEach((part, index) => {
            const element = document.querySelector(`.${part}`);
            if (element) {
                if (index < wrongCount) {
                    element.classList.add('visible');
                } else {
                    element.classList.remove('visible');
                }
            }
        });
    }

    // 處理猜測
    function handleGuess(letter) {
        if (!isPlaying) return;
        if (guessedLetters.includes(letter)) return;

        guessedLetters.push(letter);

        const btn = keyboard.querySelector(`[data-letter="${letter}"]`);

        if (currentWord.includes(letter)) {
            // 猜對
            btn.classList.add('correct');
            btn.disabled = true;
            updateWordDisplay();

            // 檢查是否獲勝
            if (checkWin()) {
                win();
            }
        } else {
            // 猜錯
            btn.classList.add('wrong');
            btn.disabled = true;
            lives--;
            livesDisplay.textContent = lives;
            updateHangman();

            // 檢查是否失敗
            if (lives <= 0) {
                gameOver();
            }
        }
    }

    // 檢查是否獲勝
    function checkWin() {
        return currentWord.split('').every(letter => guessedLetters.includes(letter));
    }

    // 重置吊人圖
    function resetHangman() {
        BODY_PARTS.forEach(part => {
            const element = document.querySelector(`.${part}`);
            if (element) {
                element.classList.remove('visible');
            }
        });
    }

    // 開始遊戲
    function startGame() {
        selectWord();
        guessedLetters = [];
        lives = MAX_LIVES;
        isPlaying = true;

        livesDisplay.textContent = lives;
        streakDisplay.textContent = streak;
        hintDisplay.textContent = `💡 提示：${currentHint}`;

        createKeyboard();
        updateWordDisplay();
        resetHangman();

        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        winScreen.classList.add('hidden');
        gameStats.classList.remove('hidden');
        gameContent.classList.remove('hidden');
    }

    // 繼續下一題
    function nextRound() {
        selectWord();
        guessedLetters = [];
        lives = MAX_LIVES;
        isPlaying = true;

        livesDisplay.textContent = lives;
        hintDisplay.textContent = `💡 提示：${currentHint}`;

        createKeyboard();
        updateWordDisplay();
        resetHangman();

        winScreen.classList.add('hidden');
    }

    // 遊戲結束
    function gameOver() {
        isPlaying = false;
        streak = 0;
        streakDisplay.textContent = streak;

        const isIDE = document.body.classList.contains('ide-mode');
        if (isIDE) {
            gameOverMsg.innerHTML = `<span class="ide-title">// Answer: "${currentWord}"</span>`;
        } else {
            gameOverMsg.innerHTML = `<span class="normal-title">答案是：<strong>${currentWord}</strong></span>`;
        }

        gameContent.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
    }

    // 獲勝
    function win() {
        isPlaying = false;
        streak++;
        streakDisplay.textContent = streak;

        const isIDE = document.body.classList.contains('ide-mode');
        if (isIDE) {
            winMsg.innerHTML = `<span class="ide-title">// Streak: ${streak}</span>`;
        } else {
            winMsg.innerHTML = `<span class="normal-title">連勝：${streak} 題！</span>`;
        }

        winScreen.classList.remove('hidden');
    }

    // 返回開始畫面
    function backToStart() {
        streak = 0;
        gameContent.classList.add('hidden');
        gameStats.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        winScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    }

    // 鍵盤輸入支援
    document.addEventListener('keydown', (e) => {
        if (!isPlaying) return;

        const letter = e.key.toUpperCase();
        if (/^[A-Z]$/.test(letter)) {
            handleGuess(letter);
        }
    });

    // 事件綁定
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('retry-btn').addEventListener('click', startGame);
    document.getElementById('next-btn').addEventListener('click', nextRound);
    document.getElementById('back-btn').addEventListener('click', backToStart);
    document.getElementById('back-win-btn').addEventListener('click', backToStart);

    // 初始化：載入單字庫
    loadWords();
})();
