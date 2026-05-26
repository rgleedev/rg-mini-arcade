(function () {
    'use strict';

    const WRONG_KEY = 'rg-thai-flash-wrong';
    const BEST_KEY_PREFIX = 'rg-thai-flash-best-';
    const FONT_KEY = 'rg-thai-font';
    const TIMER_SECONDS = 10;
    const CIRCUMFERENCE = 2 * Math.PI * 34; // r=34

    // ===== 狀態 =====
    let allConsonants = [];
    let currentSet = [];
    let queue = [];
    let current = null;
    let correctCount = 0;
    let totalAnswered = 0;
    let streak = 0;
    let bestStreak = 0;
    let wrongIds = [];
    let selectedSet = 'starter';
    let timerOn = false;
    let selectedFont = localStorage.getItem(FONT_KEY) || 'leelawadee';
    let timerInterval = null;
    let timeLeft = TIMER_SECONDS;
    let answering = false;
    let history = [];

    // ===== DOM =====
    const startScreen     = document.getElementById('start-screen');
    const gameScreen      = document.getElementById('game-screen');
    const resultScreen    = document.getElementById('result-screen');
    const startBtn        = document.getElementById('start-btn');
    const restartBtn      = document.getElementById('restart-btn');
    const changeSettingsBtn = document.getElementById('change-settings-btn');
    const setSelector     = document.getElementById('set-selector');
    const timerSelector   = document.getElementById('timer-selector');
    const fontSelector    = document.getElementById('font-selector');
    const streakEl        = document.getElementById('streak');
    const correctCountEl  = document.getElementById('correct-count');
    const progressText    = document.getElementById('progress-text');
    const progressBar     = document.getElementById('progress-bar');
    const timerWrap       = document.getElementById('timer-wrap');
    const timerRing       = document.getElementById('timer-ring');
    const timerNum        = document.getElementById('timer-num');
    const currentCharEl   = document.getElementById('current-char');
    const charDisplay     = document.querySelector('.char-display');
    const optionBtns      = document.querySelectorAll('.option-answer-btn');
    const feedbackEl      = document.getElementById('feedback');
    const resultIcon      = document.getElementById('result-icon');
    const resultAccuracy  = document.getElementById('result-accuracy');
    const resultScore     = document.getElementById('result-score');
    const resultStreakEl  = document.getElementById('result-streak');
    const resultBestEl    = document.getElementById('result-best');
    const wrongNote       = document.getElementById('wrong-note');
    const historyTbody    = document.getElementById('history-tbody');

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

    function loadWrongIds() {
        try {
            return JSON.parse(localStorage.getItem(WRONG_KEY) || '[]');
        } catch (_) {
            return [];
        }
    }

    function saveWrongIds() {
        localStorage.setItem(WRONG_KEY, JSON.stringify(wrongIds));
    }

    function loadBestAccuracy(setKey) {
        return parseFloat(localStorage.getItem(BEST_KEY_PREFIX + setKey) || '0');
    }

    function saveBestAccuracy(setKey, accuracy) {
        const current = loadBestAccuracy(setKey);
        if (accuracy > current) {
            localStorage.setItem(BEST_KEY_PREFIX + setKey, accuracy.toFixed(1));
        }
    }

    // ===== 計時器 =====
    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = TIMER_SECONDS;
        updateTimerUI();
        timerInterval = setInterval(function () {
            timeLeft--;
            updateTimerUI();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                handleTimeout();
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function updateTimerUI() {
        const ratio = timeLeft / TIMER_SECONDS;
        const offset = CIRCUMFERENCE * (1 - ratio);
        timerRing.style.strokeDashoffset = offset;
        timerNum.textContent = timeLeft;
        if (timeLeft <= 3) {
            timerRing.classList.add('urgent');
        } else {
            timerRing.classList.remove('urgent');
        }
    }

    function handleTimeout() {
        if (!answering) return;
        history.push({ char: current.char, full_name: current.full_name, keyword_zh: current.keyword_zh, isCorrect: false, playerAnswer: '⏱️ 超時' });
        // Time up = wrong
        showFeedback(false, null);
        streak = 0;
        if (!wrongIds.includes(current.id)) wrongIds.push(current.id);
        saveWrongIds();
        totalAnswered++;
        updateStats();
        highlightOptions(null);
        setTimeout(nextQuestion, 1200);
    }

    // ===== 遊戲流程 =====
    function startGame() {
        currentSet = getSet(selectedSet);
        wrongIds = loadWrongIds();

        // 錯題優先，其餘打亂
        const wrongInSet = currentSet.filter(c => wrongIds.includes(c.id));
        const rest = currentSet.filter(c => !wrongIds.includes(c.id));
        queue = [...shuffle(wrongInSet), ...shuffle(rest)];

        correctCount = 0;
        totalAnswered = 0;
        streak = 0;
        bestStreak = 0;
        answering = false;
        history = [];

        showScreen('game');
        nextQuestion();
    }

    function nextQuestion() {
        if (queue.length === 0) {
            showResult();
            return;
        }
        current = queue.shift();
        answering = true;
        renderQuestion();
        if (timerOn) startTimer();
    }

    function renderQuestion() {
        const total = currentSet.length;

        // 字母與進度
        currentCharEl.textContent = current.char;

        // 進度
        const questionNum = totalAnswered + 1;
        progressText.textContent = `${questionNum}/${total}`;
        progressBar.style.width = `${((questionNum - 1) / total) * 100}%`;

        // 生成 4 個選項（1 正確 + 3 干擾）
        const options = generateOptions(current);
        optionBtns.forEach(function (btn, i) {
            btn.textContent = options[i].full_name;
            btn.dataset.id = options[i].id;
            btn.className = 'option-answer-btn';
            btn.disabled = false;
        });

        // 清除回饋
        feedbackEl.className = 'feedback hidden';
        feedbackEl.textContent = '';

        // 字母跳動
        charDisplay.classList.remove('bounce');
        void charDisplay.offsetWidth;
        charDisplay.classList.add('bounce');
    }

    function generateOptions(correct) {
        // 從全部 44 字母中選 3 個干擾選項（full_name 不同）
        const others = allConsonants.filter(c => c.id !== correct.id);
        const shuffled = shuffle(others).slice(0, 3);
        const all4 = shuffle([correct, ...shuffled]);
        return all4;
    }

    function handleAnswer(btn) {
        if (!answering) return;
        answering = false;
        stopTimer();

        const selectedId = parseInt(btn.dataset.id);
        const isCorrect = selectedId === current.id;

        totalAnswered++;
        if (isCorrect) {
            correctCount++;
            streak++;
            if (streak > bestStreak) bestStreak = streak;
            wrongIds = wrongIds.filter(id => id !== current.id);
        } else {
            streak = 0;
            if (!wrongIds.includes(current.id)) wrongIds.push(current.id);
        }
        saveWrongIds();
        updateStats();
        highlightOptions(btn);
        const playerAnswered = allConsonants.find(function (c) { return c.id === parseInt(btn.dataset.id); });
        history.push({
            char: current.char,
            full_name: current.full_name,
            keyword_zh: current.keyword_zh,
            isCorrect: isCorrect,
            playerAnswer: isCorrect ? null : (playerAnswered ? playerAnswered.full_name : '?')
        });
        showFeedback(isCorrect, current);

        setTimeout(nextQuestion, isCorrect ? 800 : 1400);
    }

    function highlightOptions(clickedBtn) {
        optionBtns.forEach(function (btn) {
            btn.disabled = true;
            if (parseInt(btn.dataset.id) === current.id) {
                btn.classList.add('correct');
            } else if (btn === clickedBtn) {
                btn.classList.add('wrong');
            }
        });
    }

    function showFeedback(isCorrect, consonant) {
        feedbackEl.classList.remove('hidden', 'correct-msg', 'wrong-msg');
        if (isCorrect) {
            feedbackEl.classList.add('correct-msg');
            const msgs = ['✅ 正確！', '✅ 答對了！', '✅ 太棒了！', '✅ 完美！'];
            feedbackEl.innerHTML = `<span class="normal-title">${msgs[Math.floor(Math.random() * msgs.length)]}<br><small>${consonant.full_name}　${consonant.keyword_zh}</small></span><span class="ide-title">// correct! ${consonant.keyword_zh}</span>`;
        } else if (consonant) {
            feedbackEl.classList.add('wrong-msg');
            feedbackEl.innerHTML = `<span class="normal-title">❌ 答錯了！<br><small>正確：${consonant.full_name}　${consonant.keyword_zh}</small></span><span class="ide-title">// wrong: ${consonant.full_name}</span>`;
        } else {
            feedbackEl.classList.add('wrong-msg');
            feedbackEl.innerHTML = `<span class="normal-title">⏱️ 時間到！<br><small>正確：${current ? current.full_name : ''}　${current ? current.keyword_zh : ''}</small></span><span class="ide-title">// timeout!</span>`;
        }
    }

    function updateStats() {
        streakEl.textContent = streak;
        correctCountEl.textContent = correctCount;
    }

    // ===== 結果 =====
    function showResult() {
        stopTimer();
        const accuracy = totalAnswered > 0
            ? Math.round((correctCount / totalAnswered) * 100)
            : 0;

        saveBestAccuracy(selectedSet, accuracy);
        const best = loadBestAccuracy(selectedSet);

        resultAccuracy.textContent = accuracy + '%';
        resultScore.textContent = `${correctCount} / ${totalAnswered}`;
        resultStreakEl.textContent = bestStreak;
        resultBestEl.textContent = best.toFixed(0) + '%';

        // 結果圖示
        if (accuracy >= 90)      resultIcon.textContent = '🏆';
        else if (accuracy >= 70) resultIcon.textContent = '🎉';
        else if (accuracy >= 50) resultIcon.textContent = '💪';
        else                     resultIcon.textContent = '📚';

        // 提示有錯題
        if (wrongIds.filter(id => currentSet.some(c => c.id === id)).length > 0) {
            wrongNote.classList.remove('hidden');
        } else {
            wrongNote.classList.add('hidden');
        }

        // 本局詳情表
        historyTbody.innerHTML = '';
        history.forEach(function (h, i) {
            const tr = document.createElement('tr');
            tr.className = h.isCorrect ? 'hist-correct' : 'hist-wrong';
            let resultHtml;
            if (h.isCorrect) {
                resultHtml = '\u2705';
            } else {
                resultHtml = `<span class="hist-wrong-answer">\u274c ${h.playerAnswer}</span>`;
            }
            tr.innerHTML = `<td>${i + 1}</td><td class="hist-thai">${h.char}</td><td>${h.full_name}<br><small style="color:var(--text-secondary)">${h.keyword_zh}</small></td><td>${resultHtml}</td>`;
            historyTbody.appendChild(tr);
        });

        showScreen('result');
    }

    // ===== 切換畫面 =====
    function showScreen(name) {
        startScreen.classList.add('hidden');
        gameScreen.classList.add('hidden');
        resultScreen.classList.add('hidden');
        if (name === 'start')  startScreen.classList.remove('hidden');
        if (name === 'game')   gameScreen.classList.remove('hidden');
        if (name === 'result') resultScreen.classList.remove('hidden');
    }

    // ===== 事件 =====
    // 字母範圍選擇
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

    // 計時模式選擇
    timerSelector.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-timer]');
        if (!btn) return;
        timerSelector.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        timerOn = btn.dataset.timer === 'on';
        if (timerOn) {
            timerWrap.classList.remove('hidden');
        } else {
            timerWrap.classList.add('hidden');
        }
    });

    // 開始
    startBtn.addEventListener('click', function () {
        if (timerOn) {
            timerWrap.classList.remove('hidden');
        } else {
            timerWrap.classList.add('hidden');
        }
        startGame();
    });

    // 重新開始（同設定）
    restartBtn.addEventListener('click', startGame);

    // 更換設定
    changeSettingsBtn.addEventListener('click', function () {
        stopTimer();
        showScreen('start');
    });

    // 選項按鈕點擊
    optionBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            handleAnswer(btn);
        });
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
