// Typing Test 打字測試遊戲
(function () {
    const BEST_WPM_KEY = 'rg-typing-best-';

    // 動態載入的題庫
    let WORDS = [];
    let ARTICLES = [];

    // 載入題庫
    async function loadData() {
        try {
            const paths = [
                '../data/typing-words.json',
                './data/typing-words.json',
                '/data/typing-words.json'
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

            if (data.words && Array.isArray(data.words)) {
                WORDS = data.words;
            }
            if (data.articles && Array.isArray(data.articles)) {
                ARTICLES = data.articles;
            }
            console.log(`Typing Test 題庫已載入：${WORDS.length} 個單字，${ARTICLES.length} 篇文章`);
        } catch (error) {
            console.error('載入題庫失敗:', error);
        }
    }

    // 遊戲狀態
    let duration = 60;
    let timeLeft = 60;
    let timer = null;
    let isPlaying = false;
    let currentText = '';
    let typedText = '';
    let correctChars = 0;
    let incorrectChars = 0;
    let totalTyped = 0;
    let bestWPM = 0;
    let gameMode = 'random'; // 'random', 'custom', or 'article'
    let selectedArticle = null;
    let customText = '';

    // DOM 元素
    const startScreen = document.getElementById('start-screen');
    const resultScreen = document.getElementById('result-screen');
    const gameContent = document.getElementById('game-content');
    const textDisplay = document.getElementById('text-display');
    const typingInput = document.getElementById('typing-input');
    const timerDisplay = document.getElementById('timer');
    const wpmDisplay = document.getElementById('wpm');
    const accuracyDisplay = document.getElementById('accuracy');
    const bestWpmDisplay = document.getElementById('best-wpm');
    const correctCharsDisplay = document.getElementById('correct-chars');
    const errorCharsDisplay = document.getElementById('error-chars');
    const startBtn = document.getElementById('start-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const changeTimeBtn = document.getElementById('change-time-btn');
    const timeButtons = document.querySelectorAll('.time-btn');
    const modeButtons = document.querySelectorAll('.mode-btn');
    const customTextSection = document.getElementById('custom-text-section');
    const customTextInput = document.getElementById('custom-text-input');
    const articleSection = document.getElementById('article-section');
    const articleList = document.getElementById('article-list');
    const finalWpm = document.getElementById('final-wpm');
    const finalAccuracy = document.getElementById('final-accuracy');
    const finalCorrect = document.getElementById('final-correct');
    const finalErrors = document.getElementById('final-errors');

    // 初始化文章列表
    function initArticleList() {
        articleList.innerHTML = '';
        ARTICLES.forEach((article, index) => {
            const btn = document.createElement('button');
            btn.className = 'article-btn' + (index === 0 ? ' active' : '');
            btn.dataset.id = article.id;
            btn.innerHTML = `
                <span class="article-title">
                    <span class="normal-title">${article.title}</span>
                    <span class="ide-title">${article.titleIDE}</span>
                </span>
                <span class="article-length">
                    <span class="normal-title">${article.text.length} 字元</span>
                    <span class="ide-title">${article.text.length} chars</span>
                </span>
            `;
            btn.addEventListener('click', () => selectArticle(article.id));
            articleList.appendChild(btn);
        });
        selectedArticle = ARTICLES[0];
    }

    // 選擇文章
    function selectArticle(id) {
        const article = ARTICLES.find(a => a.id === id);
        if (!article) return;

        selectedArticle = article;
        articleList.querySelectorAll('.article-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.id === id);
        });
    }

    // 生成隨機文字
    function generateText(wordCount = 100) {
        const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
        const selected = [];

        for (let i = 0; i < wordCount; i++) {
            selected.push(shuffled[i % shuffled.length]);
        }

        return selected.join(' ');
    }

    // 處理自訂文章
    function processCustomText(text) {
        // 清理文章：移除多餘空白、換行符轉空格
        return text
            .replace(/[\r\n]+/g, ' ')  // 換行轉空格
            .replace(/\s+/g, ' ')       // 多個空格合併
            .trim();
    }

    // 選擇模式
    function selectMode(e) {
        const btn = e.target.closest('.mode-btn');
        if (!btn) return;

        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameMode = btn.dataset.mode;

        // 顯示/隱藏對應區域
        customTextSection.classList.add('hidden');
        articleSection.classList.add('hidden');

        if (gameMode === 'custom') {
            customTextSection.classList.remove('hidden');
        } else if (gameMode === 'article') {
            articleSection.classList.remove('hidden');
        }
    }

    // 渲染文字顯示
    function renderText() {
        const typedChars = typedText.split('');

        // 將文字按單字分割
        const words = currentText.split(' ');
        let charIndex = 0;
        let html = '';

        words.forEach((word, wordIndex) => {
            // 開始一個單字容器
            html += '<span class="word">';

            // 處理單字中的每個字符
            for (let i = 0; i < word.length; i++) {
                let className = 'char';

                if (charIndex < typedChars.length) {
                    if (typedChars[charIndex] === word[i]) {
                        className += ' correct typed';
                    } else {
                        className += ' incorrect typed';
                    }
                } else if (charIndex === typedChars.length) {
                    className += ' current';
                }

                html += `<span class="${className}">${word[i]}</span>`;
                charIndex++;
            }

            html += '</span>';

            // 處理單字後的空格（最後一個單字不加）
            if (wordIndex < words.length - 1) {
                let spaceClassName = 'char';

                if (charIndex < typedChars.length) {
                    if (typedChars[charIndex] === ' ') {
                        spaceClassName += ' correct typed';
                    } else {
                        spaceClassName += ' incorrect typed';
                    }
                } else if (charIndex === typedChars.length) {
                    spaceClassName += ' current';
                }

                html += `<span class="${spaceClassName}">&nbsp;</span>`;
                charIndex++;
            }
        });

        textDisplay.innerHTML = html;

        // 自動滾動到當前位置，確保當前字符可見
        const currentChar = textDisplay.querySelector('.current');
        if (currentChar) {
            const containerRect = textDisplay.getBoundingClientRect();
            const charRect = currentChar.getBoundingClientRect();

            // 如果當前字符超出可視區域，進行滾動
            if (charRect.top < containerRect.top || charRect.bottom > containerRect.bottom) {
                const scrollTop = currentChar.offsetTop - textDisplay.offsetTop - (textDisplay.clientHeight / 3);
                textDisplay.scrollTop = Math.max(0, scrollTop);
            }
        }
    }

    // 處理輸入
    function handleInput(e) {
        if (!isPlaying) return;

        typedText = e.target.value;

        // 計算正確和錯誤字數
        let correct = 0;
        let incorrect = 0;

        for (let i = 0; i < typedText.length; i++) {
            if (i < currentText.length) {
                if (typedText[i] === currentText[i]) {
                    correct++;
                } else {
                    incorrect++;
                }
            }
        }

        correctChars = correct;
        incorrectChars = incorrect;
        totalTyped = typedText.length;

        updateStats();
        renderText();

        // 如果打完所有文字
        if (typedText.length >= currentText.length - 20) {
            if (gameMode === 'random') {
                // 隨機模式：生成更多單字
                currentText += ' ' + generateText(50);
                renderText();
            } else if (typedText.length >= currentText.length) {
                // 文章模式（精選或自訂）：打完就結束
                endGame();
            }
        }
    }

    // 更新統計
    function updateStats() {
        // 計算 WPM (每分鐘字數，以 5 個字符為一個「字」)
        const timeElapsed = duration - timeLeft;
        const minutes = timeElapsed / 60;
        const wpm = minutes > 0 ? Math.round((correctChars / 5) / minutes) : 0;

        // 計算準確率
        const accuracy = totalTyped > 0 ? Math.round((correctChars / totalTyped) * 100) : 100;

        wpmDisplay.textContent = wpm;
        accuracyDisplay.textContent = accuracy + '%';
        correctCharsDisplay.textContent = correctChars;
        errorCharsDisplay.textContent = incorrectChars;
    }

    // 載入最佳紀錄
    function loadBestWPM() {
        bestWPM = parseInt(localStorage.getItem(BEST_WPM_KEY + duration)) || 0;
        bestWpmDisplay.textContent = bestWPM;
    }

    // 儲存最佳紀錄
    function saveBestWPM(wpm) {
        if (wpm > bestWPM) {
            bestWPM = wpm;
            localStorage.setItem(BEST_WPM_KEY + duration, wpm);
            bestWpmDisplay.textContent = bestWPM;
        }
    }

    // 開始計時器
    function startTimer() {
        timer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;
            updateStats();

            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    // 開始遊戲
    function startGame() {
        // 根據模式設定文字
        if (gameMode === 'custom') {
            const rawText = customTextInput.value.trim();
            if (!rawText || rawText.length < 10) {
                alert('請輸入至少 10 個字元的文章！');
                return;
            }
            currentText = processCustomText(rawText);
        } else if (gameMode === 'article') {
            if (!selectedArticle) {
                alert('請選擇一篇文章！');
                return;
            }
            currentText = selectedArticle.text;
        } else {
            currentText = generateText(100);
        }

        typedText = '';
        correctChars = 0;
        incorrectChars = 0;
        totalTyped = 0;
        timeLeft = duration;
        isPlaying = true;

        loadBestWPM();

        timerDisplay.textContent = timeLeft;
        wpmDisplay.textContent = '0';
        accuracyDisplay.textContent = '100%';
        correctCharsDisplay.textContent = '0';
        errorCharsDisplay.textContent = '0';
        typingInput.value = '';

        startScreen.classList.add('hidden');
        resultScreen.classList.add('hidden');
        gameContent.classList.remove('hidden');

        renderText();
        typingInput.focus();
        startTimer();
    }

    // 結束遊戲
    function endGame() {
        isPlaying = false;
        clearInterval(timer);

        // 計算最終結果
        const minutes = duration / 60;
        const wpm = Math.round((correctChars / 5) / minutes);
        const accuracy = totalTyped > 0 ? Math.round((correctChars / totalTyped) * 100) : 0;

        // 儲存最佳紀錄
        saveBestWPM(wpm);

        // 顯示結果
        finalWpm.textContent = wpm;
        finalAccuracy.textContent = accuracy + '%';
        finalCorrect.textContent = correctChars;
        finalErrors.textContent = incorrectChars;

        resultScreen.classList.remove('hidden');
    }

    // 返回時間選擇
    function backToMenu() {
        isPlaying = false;
        clearInterval(timer);
        resultScreen.classList.add('hidden');
        gameContent.classList.add('hidden');
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
    async function init() {
        await loadData();
        gameContent.classList.add('hidden');
        resultScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        initArticleList();
        loadBestWPM();
    }

    // 事件監聽
    startBtn.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', startGame);
    changeTimeBtn.addEventListener('click', backToMenu);
    timeButtons.forEach(btn => btn.addEventListener('click', selectTime));
    modeButtons.forEach(btn => btn.addEventListener('click', selectMode));
    typingInput.addEventListener('input', handleInput);

    // 防止輸入框失焦
    typingInput.addEventListener('blur', () => {
        if (isPlaying) {
            typingInput.focus();
        }
    });

    // 執行初始化
    init();
})();
