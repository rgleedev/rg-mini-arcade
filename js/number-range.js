// 終極密碼遊戲
(function () {
    const BEST_RECORD_KEY = 'rg-number-range-best-';

    // 遊戲狀態
    let secretNumber = 0;
    let lowBound = 1;
    let highBound = 100;
    let maxRange = 100;
    let attempts = 0;
    let bestRecord = 0;
    let history = [];
    let gameActive = false;

    // DOM 元素
    const startScreen = document.getElementById('start-screen');
    const gameBoard = document.getElementById('game-board');
    const gameOverScreen = document.getElementById('game-over');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const changeRangeBtn = document.getElementById('change-range-btn');
    const rangeButtons = document.querySelectorAll('.range-btn');
    const guessInput = document.getElementById('guess-input');
    const guessBtn = document.getElementById('guess-btn');
    const lowBoundDisplay = document.getElementById('low-bound');
    const highBoundDisplay = document.getElementById('high-bound');
    const hintDisplay = document.getElementById('hint');
    const attemptsDisplay = document.getElementById('attempts');
    const bestRecordDisplay = document.getElementById('best-record');
    const historyList = document.getElementById('history-list');
    const finalAnswer = document.getElementById('final-answer');
    const finalAnswerIDE = document.getElementById('final-answer-ide');
    const finalAttempts = document.getElementById('final-attempts');
    const finalAttemptsIDE = document.getElementById('final-attempts-ide');
    const newRecordMsg = document.getElementById('new-record');

    // 載入最佳紀錄
    function loadBestRecord() {
        bestRecord = parseInt(localStorage.getItem(BEST_RECORD_KEY + maxRange)) || 0;
        bestRecordDisplay.textContent = bestRecord > 0 ? bestRecord : '-';
    }

    // 儲存最佳紀錄
    function saveBestRecord() {
        if (bestRecord === 0 || attempts < bestRecord) {
            bestRecord = attempts;
            localStorage.setItem(BEST_RECORD_KEY + maxRange, bestRecord);
            bestRecordDisplay.textContent = bestRecord;
            return true;
        }
        return false;
    }

    // 產生秘密數字
    function generateSecretNumber() {
        secretNumber = Math.floor(Math.random() * maxRange) + 1;
    }

    // 開始遊戲
    function startGame() {
        lowBound = 1;
        highBound = maxRange;
        attempts = 0;
        history = [];
        gameActive = true;

        generateSecretNumber();
        loadBestRecord();

        // 更新 UI
        lowBoundDisplay.textContent = lowBound;
        highBoundDisplay.textContent = highBound;
        attemptsDisplay.textContent = attempts;
        hintDisplay.textContent = '';
        hintDisplay.className = 'hint';
        historyList.innerHTML = '';
        guessInput.value = '';
        guessInput.placeholder = `${lowBound} ~ ${highBound}`;

        // 切換畫面
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        gameBoard.classList.remove('hidden');

        guessInput.focus();
    }

    // 猜測
    function makeGuess() {
        if (!gameActive) return;

        const guess = parseInt(guessInput.value);

        // 驗證輸入
        if (isNaN(guess)) {
            showHint('請輸入有效數字！', '');
            return;
        }

        if (guess < lowBound || guess > highBound) {
            showHint(`請輸入 ${lowBound} ~ ${highBound} 之間的數字！`, '');
            return;
        }

        attempts++;
        attemptsDisplay.textContent = attempts;

        // 加入歷史紀錄
        addHistory(guess);

        // 判斷結果
        if (guess === secretNumber) {
            // 答對！
            gameActive = false;
            showHint('🎉 答對了！', 'correct');
            setTimeout(() => {
                showGameOver();
            }, 800);
        } else if (guess < secretNumber) {
            // 太小
            lowBound = guess + 1;
            lowBoundDisplay.textContent = lowBound;
            showHint('📈 太小了！往上猜', 'too-low');
        } else {
            // 太大
            highBound = guess - 1;
            highBoundDisplay.textContent = highBound;
            showHint('📉 太大了！往下猜', 'too-high');
        }

        // 更新 placeholder
        guessInput.value = '';
        guessInput.placeholder = `${lowBound} ~ ${highBound}`;
        guessInput.focus();
    }

    // 顯示提示
    function showHint(message, type) {
        hintDisplay.innerHTML = `
            <span class="normal-title">${message}</span>
            <span class="ide-title">${getIDEHint(message, type)}</span>
        `;
        hintDisplay.className = 'hint ' + type;
    }

    // IDE 模式提示
    function getIDEHint(message, type) {
        if (type === 'too-low') return '// value < secret';
        if (type === 'too-high') return '// value > secret';
        if (type === 'correct') return '// value === secret';
        return '// Invalid input';
    }

    // 加入歷史紀錄
    function addHistory(guess) {
        const type = guess < secretNumber ? 'low' : (guess > secretNumber ? 'high' : 'correct');
        history.push({ guess, type });

        const item = document.createElement('span');
        item.className = `history-item ${type}`;
        item.textContent = guess;
        historyList.appendChild(item);
    }

    // 顯示遊戲結束
    function showGameOver() {
        const isNewRecord = saveBestRecord();

        finalAnswer.textContent = secretNumber;
        finalAnswerIDE.textContent = secretNumber;
        finalAttempts.textContent = attempts;
        finalAttemptsIDE.textContent = attempts;

        if (isNewRecord) {
            newRecordMsg.classList.remove('hidden');
        } else {
            newRecordMsg.classList.add('hidden');
        }

        gameBoard.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
    }

    // 返回範圍選擇
    function backToMenu() {
        gameOverScreen.classList.add('hidden');
        gameBoard.classList.add('hidden');
        startScreen.classList.remove('hidden');
    }

    // 選擇範圍
    function selectRange(e) {
        const btn = e.target.closest('.range-btn');
        if (!btn) return;

        rangeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        maxRange = parseInt(btn.dataset.max);
    }

    // 鍵盤 Enter 猜測
    function handleKeyDown(e) {
        if (e.key === 'Enter' && gameActive) {
            makeGuess();
        }
    }

    // 事件監聽
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    changeRangeBtn.addEventListener('click', backToMenu);
    guessBtn.addEventListener('click', makeGuess);
    guessInput.addEventListener('keydown', handleKeyDown);
    rangeButtons.forEach(btn => btn.addEventListener('click', selectRange));
})();
