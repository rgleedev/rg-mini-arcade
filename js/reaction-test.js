// 反應力測試遊戲
(function () {
    const BEST_RECORD_KEY = 'rg-reaction-best';

    // 遊戲狀態
    let totalRounds = 5;
    let currentRound = 0;
    let reactionTimes = [];
    let isWaiting = false;
    let isReady = false;
    let startTime = 0;
    let timeoutId = null;

    // DOM 元素
    const startScreen = document.getElementById('start-screen');
    const gameOver = document.getElementById('game-over');
    const reactionArea = document.getElementById('reaction-area');
    const reactionText = document.getElementById('reaction-text');
    const reactionTime = document.getElementById('reaction-time');
    const resultsSection = document.getElementById('results-section');
    const resultsContainer = document.getElementById('results');
    const roundDisplay = document.getElementById('round');
    const avgTimeDisplay = document.getElementById('avg-time');
    const bestRecordDisplay = document.getElementById('best-record');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const changeRoundsBtn = document.getElementById('change-rounds-btn');
    const roundsButtons = document.querySelectorAll('.rounds-btn');

    // 結果顯示元素
    const finalAvg = document.getElementById('final-avg');
    const finalAvgIDE = document.getElementById('final-avg-ide');
    const finalBest = document.getElementById('final-best');
    const finalBestIDE = document.getElementById('final-best-ide');
    const finalWorst = document.getElementById('final-worst');
    const finalWorstIDE = document.getElementById('final-worst-ide');
    const ratingDisplay = document.getElementById('rating');

    // 載入最佳紀錄
    function loadBestRecord() {
        const record = localStorage.getItem(BEST_RECORD_KEY);
        if (record) {
            bestRecordDisplay.textContent = record + ' ms';
        } else {
            bestRecordDisplay.textContent = '- ms';
        }
    }

    // 儲存最佳紀錄
    function saveBestRecord(avgTime) {
        const currentBest = localStorage.getItem(BEST_RECORD_KEY);
        if (!currentBest || avgTime < parseInt(currentBest)) {
            localStorage.setItem(BEST_RECORD_KEY, avgTime);
            bestRecordDisplay.textContent = avgTime + ' ms';
        }
    }

    // 開始遊戲
    function startGame() {
        currentRound = 0;
        reactionTimes = [];

        roundDisplay.textContent = `0/${totalRounds}`;
        avgTimeDisplay.textContent = '- ms';
        resultsContainer.innerHTML = '';

        loadBestRecord();

        startScreen.classList.add('hidden');
        gameOver.classList.add('hidden');
        reactionArea.classList.remove('hidden');
        resultsSection.classList.remove('hidden');

        startRound();
    }

    // 開始回合
    function startRound() {
        currentRound++;
        roundDisplay.textContent = `${currentRound}/${totalRounds}`;

        isWaiting = true;
        isReady = false;

        reactionArea.className = 'reaction-area waiting';
        reactionText.innerHTML = `
            <span class="normal-title">等待綠色...</span>
            <span class="ide-title">await greenSignal();</span>
        `;
        reactionTime.classList.add('hidden');

        // 隨機等待 1-5 秒
        const waitTime = Math.random() * 4000 + 1000;
        timeoutId = setTimeout(showGreen, waitTime);
    }

    // 顯示綠色（可以點擊）
    function showGreen() {
        isWaiting = false;
        isReady = true;
        startTime = Date.now();

        reactionArea.className = 'reaction-area ready';
        reactionText.innerHTML = `
            <span class="normal-title">點擊！</span>
            <span class="ide-title">click();</span>
        `;
    }

    // 處理點擊
    function handleClick() {
        if (isWaiting) {
            // 太早點擊
            clearTimeout(timeoutId);
            isWaiting = false;

            reactionArea.className = 'reaction-area too-early';
            reactionText.innerHTML = `
                <span class="normal-title">太早了！點擊重試</span>
                <span class="ide-title">// Error: Too early!</span>
            `;

            // 點擊後重試該回合
            currentRound--;
            setTimeout(() => {
                startRound();
            }, 1000);
        } else if (isReady) {
            // 正確時機點擊
            const endTime = Date.now();
            const time = endTime - startTime;
            isReady = false;

            reactionTimes.push(time);
            addResult(time);
            updateAverage();

            reactionArea.className = 'reaction-area result';
            reactionText.innerHTML = `
                <span class="normal-title">反應時間</span>
                <span class="ide-title">reactionTime:</span>
            `;
            reactionTime.textContent = time + ' ms';
            reactionTime.classList.remove('hidden');

            // 下一回合或結束
            if (currentRound < totalRounds) {
                setTimeout(startRound, 1500);
            } else {
                setTimeout(endGame, 1500);
            }
        }
    }

    // 新增結果
    function addResult(time) {
        const item = document.createElement('div');
        let speedClass = 'medium';
        if (time < 250) speedClass = 'fast';
        else if (time > 400) speedClass = 'slow';

        item.className = `result-item ${speedClass}`;
        item.innerHTML = `
            <span class="result-round">#${currentRound}</span>
            <span class="result-time">${time} ms</span>
        `;

        resultsContainer.appendChild(item);
    }

    // 更新平均值
    function updateAverage() {
        if (reactionTimes.length > 0) {
            const avg = Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length);
            avgTimeDisplay.textContent = avg + ' ms';
        }
    }

    // 獲取評分
    function getRating(avgTime) {
        if (avgTime < 200) {
            return { class: 'excellent', text: '⚡ 閃電反應！', textIDE: '// EXCELLENT!' };
        } else if (avgTime < 250) {
            return { class: 'good', text: '🎯 反應敏捷！', textIDE: '// GOOD!' };
        } else if (avgTime < 350) {
            return { class: 'average', text: '👍 表現不錯！', textIDE: '// AVERAGE' };
        } else {
            return { class: 'slow', text: '🐢 還需練習！', textIDE: '// NEEDS PRACTICE' };
        }
    }

    // 結束遊戲
    function endGame() {
        const avg = Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length);
        const best = Math.min(...reactionTimes);
        const worst = Math.max(...reactionTimes);

        saveBestRecord(avg);

        finalAvg.textContent = avg;
        finalAvgIDE.textContent = avg;
        finalBest.textContent = best;
        finalBestIDE.textContent = best;
        finalWorst.textContent = worst;
        finalWorstIDE.textContent = worst;

        const rating = getRating(avg);
        ratingDisplay.className = `rating ${rating.class}`;
        ratingDisplay.innerHTML = `
            <div class="rating-title">
                <span class="normal-title">評價</span>
                <span class="ide-title">// Rating</span>
            </div>
            <div class="rating-value">
                <span class="normal-title">${rating.text}</span>
                <span class="ide-title">${rating.textIDE}</span>
            </div>
        `;

        reactionArea.classList.add('hidden');
        resultsSection.classList.add('hidden');
        gameOver.classList.remove('hidden');
    }

    // 返回選單
    function backToMenu() {
        clearTimeout(timeoutId);
        isWaiting = false;
        isReady = false;

        reactionArea.classList.add('hidden');
        resultsSection.classList.add('hidden');
        gameOver.classList.add('hidden');
        startScreen.classList.remove('hidden');
    }

    // 選擇回合數
    function selectRounds(e) {
        const btn = e.target.closest('.rounds-btn');
        if (!btn) return;

        roundsButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        totalRounds = parseInt(btn.dataset.rounds);
    }

    // 事件監聽
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    changeRoundsBtn.addEventListener('click', backToMenu);
    reactionArea.addEventListener('click', handleClick);
    roundsButtons.forEach(btn => btn.addEventListener('click', selectRounds));

    // 防止手機雙擊縮放
    reactionArea.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleClick();
    });

    // 初始化
    function init() {
        loadBestRecord();
        reactionArea.classList.add('hidden');
        resultsSection.classList.add('hidden');
        gameOver.classList.add('hidden');
        startScreen.classList.remove('hidden');
    }

    init();
})();
