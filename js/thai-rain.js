(function () {
    'use strict';

    const BEST_KEY_PREFIX = 'rg-thai-rain-best-';
    const FONT_KEY = 'rg-thai-font';
    const BUBBLE_COUNT = 4;       // 每波氣泡數量
    const BASE_FALL_DURATION = 5; // 秒（最快不低於 2s）
    const SPEED_STEP = 0.08;      // 每分加速
    const MIN_FALL_DURATION = 2;

    // ===== 狀態 =====
    let allConsonants = [];
    let currentSet = [];
    let selectedSet = 'starter';
    let selectedFont = localStorage.getItem(FONT_KEY) || 'leelawadee';
    let score = 0;
    let lives = 3;
    let bestScore = 0;
    let currentTarget = null;
    let activeBubbles = [];    // {el, consonant, escaped}
    let gameRunning = false;
    let waveTimeout = null;
    let waveHistory = [];

    // ===== DOM =====
    const startScreen      = document.getElementById('start-screen');
    const gameScreen       = document.getElementById('game-screen');
    const gameOver         = document.getElementById('game-over');
    const startBtn         = document.getElementById('start-btn');
    const restartBtn       = document.getElementById('restart-btn');
    const changeSettingsBtn = document.getElementById('change-settings-btn');
    const setSelector      = document.getElementById('set-selector');
    const fontSelector     = document.getElementById('font-selector');
    const livesDisplay     = document.getElementById('lives-display');
    const scoreEl          = document.getElementById('score');
    const bestScoreEl      = document.getElementById('best-score');
    const targetDisplay    = document.getElementById('target-display');
    const targetHint       = document.getElementById('target-hint');
    const rainField        = document.getElementById('rain-field');
    const finalScore       = document.getElementById('final-score');
    const finalBest        = document.getElementById('final-best');
    const resultIcon       = document.getElementById('result-icon');
    const waveLog          = document.getElementById('wave-log');

    // ===== 工具 =====
    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function getSet(name) {
        switch (name) {
            case 'starter':  return allConsonants.filter(c => c.starter);
            case 'all':      return [...allConsonants];
            case 'random10': return shuffle([...allConsonants]).slice(0, 10);
            default:         return allConsonants.filter(c => c.starter);
        }
    }

    function loadBest(setKey) {
        return parseInt(localStorage.getItem(BEST_KEY_PREFIX + setKey) || '0');
    }

    function saveBest(setKey, val) {
        const cur = loadBest(setKey);
        if (val > cur) localStorage.setItem(BEST_KEY_PREFIX + setKey, val);
    }

    function fallDuration() {
        return Math.max(MIN_FALL_DURATION, BASE_FALL_DURATION - score * SPEED_STEP);
    }

    // ===== 遊戲流程 =====
    function startGame() {
        currentSet = getSet(selectedSet);
        bestScore = loadBest(selectedSet);
        score = 0;
        lives = 3;
        activeBubbles = [];
        gameRunning = true;
        waveHistory = [];

        updateHUD();
        renderLives();
        clearRainField();

        showScreen('game');
        nextWave();
    }

    function nextWave() {
        if (!gameRunning) return;

        // 選目標（從 currentSet 隨機，避免連續重複）
        const pool = currentSet.filter(c => !currentTarget || c.id !== currentTarget.id);
        currentTarget = pool[Math.floor(Math.random() * pool.length)];

        // 顯示目標
        targetDisplay.textContent = currentTarget.romanized;
        targetDisplay.classList.remove('new-target');
        void targetDisplay.offsetWidth;
        targetDisplay.classList.add('new-target');
        targetHint.textContent = `${currentTarget.full_name} · ${currentTarget.keyword_zh}`;

        // 清除舊氣泡
        clearRainField();
        activeBubbles = [];

        // 生成氣泡：1 正確 + (BUBBLE_COUNT-1) 干擾
        const others = allConsonants.filter(c => c.id !== currentTarget.id);
        const distractors = shuffle(others).slice(0, BUBBLE_COUNT - 1);
        const bubbleData = shuffle([currentTarget, ...distractors]);

        // 分配 X 位置（等分，避免重疊）
        const fieldWidth = rainField.offsetWidth || 300;
        const bubbleSize = 64;
        const margin = 8;
        const slots = distributeXSlots(bubbleData.length, fieldWidth, bubbleSize, margin);

        bubbleData.forEach(function (consonant, i) {
            spawnBubble(consonant, slots[i]);
        });
    }

    function distributeXSlots(count, fieldWidth, bubbleSize, margin) {
        const maxX = fieldWidth - bubbleSize - margin;
        const step = (maxX - margin) / count;
        const slots = [];
        for (let i = 0; i < count; i++) {
            // Add slight random offset within the slot
            const base = margin + step * i + Math.random() * (step * 0.6);
            slots.push(Math.min(Math.max(margin, base), maxX));
        }
        return shuffle(slots);
    }

    function spawnBubble(consonant, xPos) {
        const el = document.createElement('div');
        el.className = 'bubble';

        const charSpan = document.createElement('span');
        charSpan.className = 'bubble-char';
        charSpan.textContent = consonant.char;
        el.appendChild(charSpan);

        el.style.left = xPos + 'px';
        el.style.top = '-80px';

        const dur = fallDuration();
        el.style.animationDuration = dur + 's';
        el.style.animationDelay = (Math.random() * 0.8) + 's';

        const bubbleObj = { el: el, consonant: consonant, escaped: false, handled: false };
        activeBubbles.push(bubbleObj);

        el.addEventListener('click', function (e) {
            e.stopPropagation();
            handleBubbleClick(bubbleObj);
        });
        el.addEventListener('touchstart', function (e) {
            e.preventDefault();
            handleBubbleClick(bubbleObj);
        }, { passive: false });

        el.addEventListener('animationend', function () {
            if (!bubbleObj.handled) {
                bubbleObj.escaped = true;
                // Only penalise if it was the correct bubble
                if (consonant.id === currentTarget.id) {
                    el.remove();
                    bubbleObj.handled = true;
                    onCorrectEscaped();
                } else {
                    el.remove();
                    bubbleObj.handled = true;
                    checkWaveCleared();
                }
            }
        });

        rainField.appendChild(el);
    }

    function handleBubbleClick(bubbleObj) {
        if (!gameRunning || bubbleObj.handled) return;
        bubbleObj.handled = true;

        if (bubbleObj.consonant.id === currentTarget.id) {
            // 正確
            bubbleObj.el.classList.add('pop-correct');
            waveHistory.push({ char: currentTarget.char, romanized: currentTarget.romanized, full_name: currentTarget.full_name, keyword_zh: currentTarget.keyword_zh, result: 'correct' });
            score++;
            updateHUD();
            setTimeout(function () {
                bubbleObj.el.remove();
                if (gameRunning) {
                    // 清掉剩餘氣泡，進下一波
                    clearRainField();
                    activeBubbles = [];
                    nextWave();
                }
            }, 360);
        } else {
            // 錯誤
            bubbleObj.el.classList.add('pop-wrong');
            loseLife();
            setTimeout(function () {
                if (!bubbleObj.el.parentNode) return;
                bubbleObj.el.classList.remove('pop-wrong');
                bubbleObj.handled = false; // allow re-tap if still alive
            }, 420);
        }
    }

    function onCorrectEscaped() {
        waveHistory.push({ char: currentTarget.char, romanized: currentTarget.romanized, full_name: currentTarget.full_name, keyword_zh: currentTarget.keyword_zh, result: 'missed' });
        loseLife();
        if (gameRunning) {
            clearRainField();
            activeBubbles = [];
            nextWave();
        }
    }

    function checkWaveCleared() {
        // If all distractors have fallen off but correct still alive — do nothing
        // (correct bubble still falling, let it play out)
    }

    function loseLife() {
        if (!gameRunning) return;
        lives = Math.max(0, lives - 1);
        renderLives();

        // 場地閃紅
        rainField.classList.add('life-lost');
        setTimeout(function () { rainField.classList.remove('life-lost'); }, 420);

        if (lives <= 0) {
            endGame();
        }
    }

    function renderLives() {
        const hearts = livesDisplay.querySelectorAll('.heart');
        hearts.forEach(function (h, i) {
            if (i < lives) {
                h.classList.remove('lost');
            } else {
                h.classList.add('lost');
            }
        });
    }

    function updateHUD() {
        scoreEl.textContent = score;
        if (score > bestScore) bestScore = score;
        bestScoreEl.textContent = bestScore;
    }

    function clearRainField() {
        clearTimeout(waveTimeout);
        while (rainField.firstChild) rainField.removeChild(rainField.firstChild);
    }

    function endGame() {
        gameRunning = false;
        clearRainField();
        activeBubbles = [];

        saveBest(selectedSet, score);
        const best = loadBest(selectedSet);

        finalScore.textContent = score;
        finalBest.textContent = best;

        if (score >= 20)     resultIcon.textContent = '🏆';
        else if (score >= 10) resultIcon.textContent = '🎉';
        else if (score >= 5)  resultIcon.textContent = '💪';
        else                   resultIcon.textContent = '💧';

        // 波次記錄
        waveLog.innerHTML = '';
        waveHistory.forEach(function (w) {
            const div = document.createElement('div');
            div.className = 'wave-entry ' + w.result;
            div.innerHTML = `<span class="wave-entry-icon">${w.result === 'correct' ? '✅' : '❌'}</span><span class="wave-thai">${w.char}</span><span class="wave-info">${w.romanized} · ${w.keyword_zh}</span>`;
            waveLog.appendChild(div);
        });

        showScreen('gameover');
    }

    // ===== 切換畫面 =====
    function showScreen(name) {
        startScreen.classList.add('hidden');
        gameScreen.classList.add('hidden');
        gameOver.classList.add('hidden');
        if (name === 'start')    startScreen.classList.remove('hidden');
        if (name === 'game')     gameScreen.classList.remove('hidden');
        if (name === 'gameover') gameOver.classList.remove('hidden');
    }

    // ===== 事件 =====
    setSelector.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-set]');
        if (!btn) return;
        setSelector.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSet = btn.dataset.set;
    });

    // 字型選擇
    fontSelector.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-font]');
        if (!btn) return;
        fontSelector.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedFont = btn.dataset.font;
        localStorage.setItem(FONT_KEY, selectedFont);
        document.body.classList.toggle('font-leelawadee', selectedFont === 'leelawadee');
    });

    startBtn.addEventListener('click', startGame);

    restartBtn.addEventListener('click', startGame);

    changeSettingsBtn.addEventListener('click', function () {
        gameRunning = false;
        clearRainField();
        showScreen('start');
    });

    // ===== 載入資料 =====
    fetch('../data/thai-alphabet.json')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            allConsonants = data.consonants;
            // 套用已儲存字型
            document.body.classList.toggle('font-leelawadee', selectedFont === 'leelawadee');
            fontSelector.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
            const savedFontBtn = fontSelector.querySelector('[data-font="' + selectedFont + '"]');
            if (savedFontBtn) savedFontBtn.classList.add('active');
            showScreen('start');
        })
        .catch(function () {
            startScreen.innerHTML = '<p style="color:red;text-align:center">⚠️ 無法載入字母資料，請確認 data/thai-alphabet.json 存在。</p>';
            startScreen.classList.remove('hidden');
        });

})();
