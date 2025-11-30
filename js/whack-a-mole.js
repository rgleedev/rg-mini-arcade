// 打地鼠遊戲
(function () {
    const BEST_SCORE_KEY = 'rg-whack-best-';

    // 遊戲設定
    const MOLE_MIN_TIME = 500;   // 地鼠最短出現時間
    const MOLE_MAX_TIME = 1500;  // 地鼠最長出現時間
    const SPAWN_MIN_DELAY = 400; // 最短生成間隔
    const SPAWN_MAX_DELAY = 1000; // 最長生成間隔
    const BOMB_CHANCE = 0.25;    // 炸彈出現機率 (25%)
    const BOMB_PENALTY = 20;     // 打到炸彈扣分

    // 遊戲狀態
    let score = 0;
    let bestScore = 0;
    let hits = 0;
    let combo = 0;
    let maxCombo = 0;
    let bombHits = 0;
    let duration = 30;
    let timeLeft = 30;
    let timer = null;
    let spawnTimer = null;
    let isPlaying = false;
    let activeMoles = new Set();
    let activeTypes = new Map(); // 記錄每個洞的類型 (mole 或 bomb)

    // DOM 元素
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over');
    const gameBoard = document.getElementById('game-board');
    const comboDisplay = document.getElementById('combo-display');
    const scoreDisplay = document.getElementById('score');
    const bestScoreDisplay = document.getElementById('best-score');
    const timerDisplay = document.getElementById('timer');
    const comboStatDisplay = document.getElementById('combo');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const changeTimeBtn = document.getElementById('change-time-btn');
    const timeButtons = document.querySelectorAll('.time-btn');
    const holes = document.querySelectorAll('.hole');
    const finalScore = document.getElementById('final-score');
    const finalScoreIDE = document.getElementById('final-score-ide');
    const finalHits = document.getElementById('final-hits');
    const finalHitsIDE = document.getElementById('final-hits-ide');
    const finalCombo = document.getElementById('final-combo');
    const finalComboIDE = document.getElementById('final-combo-ide');

    // 隨機數
    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 隨機選擇一個洞
    function getRandomHole() {
        const availableHoles = [];
        holes.forEach((hole, index) => {
            if (!activeMoles.has(index)) {
                availableHoles.push(index);
            }
        });

        if (availableHoles.length === 0) return null;
        return availableHoles[random(0, availableHoles.length - 1)];
    }

    // 顯示地鼠或炸彈
    function showMole() {
        if (!isPlaying) return;

        const holeIndex = getRandomHole();
        if (holeIndex === null) {
            // 所有洞都有地鼠，稍後再試
            scheduleNextMole();
            return;
        }

        const hole = holes[holeIndex];
        const isBomb = Math.random() < BOMB_CHANCE;

        activeMoles.add(holeIndex);
        activeTypes.set(holeIndex, isBomb ? 'bomb' : 'mole');

        hole.classList.add('active');
        if (isBomb) {
            hole.classList.add('bomb');
        }

        // 設定自動隱藏
        const showTime = random(MOLE_MIN_TIME, MOLE_MAX_TIME);
        setTimeout(() => {
            if (hole.classList.contains('active') && !hole.classList.contains('hit')) {
                hideMole(holeIndex);
                // 沒打中地鼠，重置連擊（炸彈不影響）
                if (!isBomb) {
                    combo = 0;
                    comboStatDisplay.textContent = combo;
                }
            }
        }, showTime);

        scheduleNextMole();
    }

    // 隱藏地鼠
    function hideMole(index) {
        const hole = holes[index];
        const wasBomb = hole.classList.contains('bomb') || hole.classList.contains('bomb-hit');

        hole.classList.remove('active');
        hole.classList.remove('hit');
        activeMoles.delete(index);
        activeTypes.delete(index);

        // 延遲移除 bomb class，讓下降動畫完成後才移除
        if (wasBomb) {
            setTimeout(() => {
                hole.classList.remove('bomb');
                hole.classList.remove('bomb-hit');
            }, 200);
        }
    }

    // 安排下一個地鼠
    function scheduleNextMole() {
        if (!isPlaying) return;

        const delay = random(SPAWN_MIN_DELAY, SPAWN_MAX_DELAY);
        spawnTimer = setTimeout(showMole, delay);
    }

    // 打擊地鼠
    function whackMole(e) {
        if (!isPlaying) return;

        const hole = e.target.closest('.hole');
        if (!hole) return;

        const index = parseInt(hole.dataset.index);
        const type = activeTypes.get(index);

        // 檢查是否有地鼠/炸彈且沒被打過
        if (hole.classList.contains('active') && !hole.classList.contains('hit') && !hole.classList.contains('bomb-hit')) {

            if (type === 'bomb') {
                // 打到炸彈！
                hole.classList.add('bomb-hit');
                bombHits++;
                combo = 0; // 重置連擊

                // 扣分（但不低於0）
                score = Math.max(0, score - BOMB_PENALTY);
                updateStats();

                // 顯示扣分飄動
                showScorePopup(hole, -BOMB_PENALTY, true);

                // 短暫延遲後隱藏
                setTimeout(() => {
                    hideMole(index);
                }, 200);
            } else {
                // 命中地鼠！
                hole.classList.add('hit');
                hits++;
                combo++;

                if (combo > maxCombo) {
                    maxCombo = combo;
                }

                // 計算分數（含連擊加成）
                let points = 10;
                if (combo >= 10) {
                    points = 30;
                } else if (combo >= 5) {
                    points = 20;
                } else if (combo >= 3) {
                    points = 15;
                }

                score += points;
                updateStats();

                // 顯示分數飄動
                showScorePopup(hole, points, false);

                // 顯示連擊提示
                if (combo >= 3) {
                    showComboDisplay(combo);
                }

                // 短暫延遲後隱藏
                setTimeout(() => {
                    hideMole(index);
                }, 150);
            }
        }
    }

    // 顯示分數飄動
    function showScorePopup(hole, points, isPenalty) {
        const popup = document.createElement('div');
        popup.className = 'score-popup' + (isPenalty ? ' penalty' : '');
        popup.textContent = isPenalty ? `${points}` : `+${points}`;

        const rect = hole.getBoundingClientRect();
        popup.style.left = rect.left + rect.width / 2 + 'px';
        popup.style.top = rect.top + 'px';

        document.body.appendChild(popup);

        setTimeout(() => {
            popup.remove();
        }, 800);
    }

    // 顯示連擊提示
    function showComboDisplay(comboCount) {
        comboDisplay.textContent = `${comboCount} COMBO!`;
        comboDisplay.classList.remove('hidden');

        // 移除舊的動畫
        comboDisplay.style.animation = 'none';
        comboDisplay.offsetHeight; // 觸發 reflow
        comboDisplay.style.animation = 'comboPopup 0.5s ease-out forwards';

        setTimeout(() => {
            comboDisplay.classList.add('hidden');
        }, 500);
    }

    // 更新統計
    function updateStats() {
        scoreDisplay.textContent = score;
        comboStatDisplay.textContent = combo;
    }

    // 載入最高分
    function loadBestScore() {
        bestScore = parseInt(localStorage.getItem(BEST_SCORE_KEY + duration)) || 0;
        bestScoreDisplay.textContent = bestScore;
    }

    // 儲存最高分
    function saveBestScore() {
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem(BEST_SCORE_KEY + duration, bestScore);
            bestScoreDisplay.textContent = bestScore;
        }
    }

    // 開始倒數計時
    function startTimer() {
        timer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;

            // 時間快到時加速生成
            if (timeLeft <= 10) {
                // 可以在這裡調整生成速度
            }

            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    // 開始遊戲
    function startGame() {
        // 重置狀態
        score = 0;
        hits = 0;
        combo = 0;
        maxCombo = 0;
        bombHits = 0;
        timeLeft = duration;
        isPlaying = true;
        activeMoles.clear();
        activeTypes.clear();

        // 清除所有地鼠
        holes.forEach(hole => {
            hole.classList.remove('active');
            hole.classList.remove('hit');
            hole.classList.remove('bomb');
            hole.classList.remove('bomb-hit');
        });

        loadBestScore();
        updateStats();
        timerDisplay.textContent = timeLeft;

        // 切換畫面
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        gameBoard.classList.remove('hidden');

        // 開始遊戲
        startTimer();
        showMole();
    }

    // 結束遊戲
    function endGame() {
        isPlaying = false;
        clearInterval(timer);
        clearTimeout(spawnTimer);

        // 清除所有地鼠
        holes.forEach(hole => {
            hole.classList.remove('active');
            hole.classList.remove('hit');
            hole.classList.remove('bomb');
            hole.classList.remove('bomb-hit');
        });
        activeMoles.clear();
        activeTypes.clear();

        saveBestScore();

        // 更新結果
        finalScore.textContent = score;
        finalScoreIDE.textContent = score;
        finalHits.textContent = hits;
        finalHitsIDE.textContent = hits;
        finalCombo.textContent = maxCombo;
        finalComboIDE.textContent = maxCombo;

        // 顯示結束畫面
        setTimeout(() => {
            gameOverScreen.classList.remove('hidden');
        }, 300);
    }

    // 返回時間選擇
    function backToMenu() {
        isPlaying = false;
        clearInterval(timer);
        clearTimeout(spawnTimer);
        gameOverScreen.classList.add('hidden');
        gameBoard.classList.add('hidden');
        startScreen.classList.remove('hidden');
    }

    // 選擇時間
    function selectTime(e) {
        const btn = e.target.closest('.time-btn');
        if (!btn) return;

        timeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        duration = parseInt(btn.dataset.time);
        timerDisplay.textContent = duration;
    }

    // 初始化
    function init() {
        loadBestScore();
        timerDisplay.textContent = duration;
    }

    // 事件監聽
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    changeTimeBtn.addEventListener('click', backToMenu);
    timeButtons.forEach(btn => btn.addEventListener('click', selectTime));
    gameBoard.addEventListener('click', whackMole);

    // 防止觸控延遲
    gameBoard.addEventListener('touchstart', (e) => {
        e.preventDefault();
        whackMole(e);
    }, { passive: false });

    init();
})();
