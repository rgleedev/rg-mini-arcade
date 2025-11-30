// Wordle 猜單字遊戲
(function () {
    const STATS_KEY = 'rg-wordle-stats';

    // 單字庫（常見的 5 字母英文單字）
    const WORDS = [
        'APPLE', 'BEACH', 'BRAIN', 'BREAD', 'BRUSH',
        'CHAIR', 'CHARM', 'CHASE', 'CHESS', 'CHILD',
        'CLEAN', 'CLEAR', 'CLIMB', 'CLOCK', 'CLOSE',
        'CLOUD', 'COACH', 'COAST', 'CORAL', 'COUCH',
        'COVER', 'CRAFT', 'CRASH', 'CRAZY', 'CREAM',
        'CRISP', 'CROSS', 'CROWD', 'DANCE', 'DEPTH',
        'DRAFT', 'DRAIN', 'DRAMA', 'DREAM', 'DRESS',
        'DRINK', 'DRIVE', 'EARTH', 'ENJOY', 'ENTER',
        'EVENT', 'EVERY', 'EXACT', 'EXTRA', 'FAITH',
        'FALSE', 'FANCY', 'FAVOR', 'FEAST', 'FIELD',
        'FIGHT', 'FINAL', 'FIRST', 'FLAME', 'FLASH',
        'FLOOR', 'FLUID', 'FOCUS', 'FORCE', 'FORUM',
        'FRAME', 'FRANK', 'FRESH', 'FRONT', 'FRUIT',
        'GIANT', 'GLASS', 'GLOBE', 'GLOVE', 'GRACE',
        'GRADE', 'GRAIN', 'GRAND', 'GRANT', 'GRAPE',
        'GRAPH', 'GRASP', 'GRASS', 'GREAT', 'GREEN',
        'GREET', 'GROUP', 'GROVE', 'GROWN', 'GUARD',
        'GUESS', 'GUEST', 'GUIDE', 'HABIT', 'HAPPY',
        'HARSH', 'HAVEN', 'HEART', 'HEAVY', 'HELLO',
        'HENCE', 'HONEY', 'HONOR', 'HORSE', 'HOTEL',
        'HOUSE', 'HUMAN', 'HUMOR', 'IDEAL', 'IMAGE',
        'INDEX', 'INNER', 'INPUT', 'ISSUE', 'JAPAN',
        'JEWEL', 'JOINT', 'JUDGE', 'JUICE', 'KNIFE',
        'KNOWN', 'LABEL', 'LARGE', 'LASER', 'LATER',
        'LAUGH', 'LAYER', 'LEARN', 'LEASE', 'LEAST',
        'LEAVE', 'LEGAL', 'LEMON', 'LEVEL', 'LEVER',
        'LIGHT', 'LIMIT', 'LINUX', 'LIVING','LOBBY',
        'LOCAL', 'LOGIC', 'LOOSE', 'LOTUS', 'LOWER',
        'LUCKY', 'LUNCH', 'MAGIC', 'MAJOR', 'MAKER',
        'MARCH', 'MATCH', 'MAYBE', 'MAYOR', 'MEDIA',
        'METAL', 'MIGHT', 'MINOR', 'MINUS', 'MIXED',
        'MODEL', 'MONEY', 'MONTH', 'MORAL', 'MOTOR',
        'MOUNT', 'MOUSE', 'MOUTH', 'MOVIE', 'MUSIC',
        'NAVAL', 'NEVER', 'NIGHT', 'NOISE', 'NORTH',
        'NOTED', 'NOVEL', 'NURSE', 'OCCUR', 'OCEAN',
        'OFFER', 'OFTEN', 'OLIVE', 'ONION', 'OPERA',
        'ORDER', 'ORGAN', 'OTHER', 'OUGHT', 'OUTER',
        'OWNER', 'PAINT', 'PANEL', 'PAPER', 'PARTY',
        'PASTA', 'PATCH', 'PAUSE', 'PEACE', 'PEACH',
        'PEARL', 'PHASE', 'PHONE', 'PHOTO', 'PIANO',
        'PIECE', 'PILOT', 'PITCH', 'PIZZA', 'PLACE',
        'PLAIN', 'PLANE', 'PLANT', 'PLATE', 'PLAZA',
        'POINT', 'POLAR', 'POUND', 'POWER', 'PRESS',
        'PRICE', 'PRIDE', 'PRIME', 'PRINT', 'PRIOR',
        'PRIZE', 'PROBE', 'PROOF', 'PROUD', 'PROVE',
        'PROXY', 'PUPIL', 'QUEEN', 'QUERY', 'QUEST',
        'QUICK', 'QUIET', 'QUITE', 'QUOTA', 'QUOTE',
        'RADAR', 'RADIO', 'RAISE', 'RALLY', 'RANCH',
        'RANGE', 'RAPID', 'RATIO', 'REACH', 'REACT',
        'READY', 'REALM', 'REBEL', 'REFER', 'RELAX',
        'REPLY', 'RIGHT', 'RIVER', 'ROBOT', 'ROCKY',
        'ROMAN', 'ROUGH', 'ROUND', 'ROUTE', 'ROYAL',
        'RUGBY', 'RURAL', 'SALAD', 'SALON', 'SAUCE',
        'SCALE', 'SCENE', 'SCOPE', 'SCORE', 'SENSE',
        'SERVE', 'SEVEN', 'SHADE', 'SHAKE', 'SHALL',
        'SHAME', 'SHAPE', 'SHARE', 'SHARK', 'SHARP',
        'SHEEP', 'SHEET', 'SHELF', 'SHELL', 'SHIFT',
        'SHINE', 'SHIRT', 'SHOCK', 'SHOOT', 'SHORT',
        'SHOUT', 'SIGHT', 'SIGMA', 'SILLY', 'SINCE',
        'SKILL', 'SKULL', 'SLASH', 'SLAVE', 'SLEEP',
        'SLICE', 'SLIDE', 'SLOPE', 'SMART', 'SMELL',
        'SMILE', 'SMOKE', 'SNAKE', 'SOLAR', 'SOLID',
        'SOLVE', 'SORRY', 'SOUND', 'SOUTH', 'SPACE',
        'SPARE', 'SPARK', 'SPEAK', 'SPEED', 'SPELL',
        'SPEND', 'SPICY', 'SPINE', 'SPLIT', 'SPORT',
        'SPRAY', 'SQUAD', 'STACK', 'STAFF', 'STAGE',
        'STAIR', 'STAKE', 'STAMP', 'STAND', 'START',
        'STATE', 'STEAM', 'STEEL', 'STEEP', 'STEER',
        'STICK', 'STILL', 'STOCK', 'STONE', 'STORE',
        'STORM', 'STORY', 'STRIP', 'STUCK', 'STUDY',
        'STUFF', 'STYLE', 'SUGAR', 'SUITE', 'SUNNY',
        'SUPER', 'SURGE', 'SWEET', 'SWIFT', 'SWING',
        'SWORD', 'TABLE', 'TASTE', 'TEACH', 'TEETH',
        'TEMPO', 'TENSE', 'TERMS', 'THANK', 'THEFT',
        'THEIR', 'THEME', 'THERE', 'THESE', 'THICK',
        'THIEF', 'THING', 'THINK', 'THIRD', 'THOSE',
        'THREE', 'THROW', 'THUMB', 'TIGER', 'TIGHT',
        'TIMER', 'TITLE', 'TODAY', 'TOKEN', 'TOPIC',
        'TOTAL', 'TOUCH', 'TOUGH', 'TOWER', 'TRACE',
        'TRACK', 'TRADE', 'TRAIL', 'TRAIN', 'TRAIT',
        'TRASH', 'TREAT', 'TREND', 'TRIAL', 'TRIBE',
        'TRICK', 'TRIED', 'TRUCK', 'TRULY', 'TRUMP',
        'TRUNK', 'TRUST', 'TRUTH', 'TUMOR', 'TUTOR',
        'TWICE', 'TWIST', 'ULTRA', 'UNCLE', 'UNDER',
        'UNION', 'UNITE', 'UNITY', 'UNTIL', 'UPPER',
        'UPSET', 'URBAN', 'USAGE', 'USUAL', 'VALID',
        'VALUE', 'VALVE', 'VIDEO', 'VIGOR', 'VIRAL',
        'VIRUS', 'VISIT', 'VITAL', 'VIVID', 'VOCAL',
        'VOICE', 'VOTER', 'WAGON', 'WASTE', 'WATCH',
        'WATER', 'WEIGH', 'WEIRD', 'WHALE', 'WHEAT',
        'WHEEL', 'WHERE', 'WHICH', 'WHILE', 'WHITE',
        'WHOLE', 'WHOSE', 'WOMAN', 'WORLD', 'WORRY',
        'WORSE', 'WORST', 'WORTH', 'WOULD', 'WOUND',
        'WRIST', 'WRITE', 'WRONG', 'WROTE', 'YACHT',
        'YOUNG', 'YOUTH', 'ZEBRA', 'ZONES'
    ];

    // 遊戲狀態
    let targetWord = '';
    let currentRow = 0;
    let currentTile = 0;
    let guesses = [];
    let isGameOver = false;
    let stats = { played: 0, won: 0, streak: 0, maxStreak: 0 };

    // DOM 元素
    const startScreen = document.getElementById('start-screen');
    const gameOver = document.getElementById('game-over');
    const gameBoard = document.getElementById('game-board');
    const keyboard = document.getElementById('keyboard');
    const messageDisplay = document.getElementById('message');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const shareBtn = document.getElementById('share-btn');
    const attemptsDisplay = document.getElementById('attempts');
    const winRateDisplay = document.getElementById('win-rate');
    const streakDisplay = document.getElementById('streak');
    const gameOverTitle = document.getElementById('game-over-title');
    const answerDisplay = document.getElementById('answer-display');
    const answerDisplayIDE = document.getElementById('answer-display-ide');
    const finalAttempts = document.getElementById('final-attempts');
    const finalAttemptsIDE = document.getElementById('final-attempts-ide');

    // 載入統計
    function loadStats() {
        const saved = localStorage.getItem(STATS_KEY);
        if (saved) {
            stats = JSON.parse(saved);
        }
        updateStatsDisplay();
    }

    // 儲存統計
    function saveStats() {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }

    // 更新統計顯示
    function updateStatsDisplay() {
        const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
        winRateDisplay.textContent = winRate + '%';
        streakDisplay.textContent = stats.streak;
    }

    // 建立遊戲板
    function createBoard() {
        gameBoard.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('div');
            row.className = 'board-row';
            row.dataset.row = i;
            for (let j = 0; j < 5; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.dataset.row = i;
                tile.dataset.col = j;
                row.appendChild(tile);
            }
            gameBoard.appendChild(row);
        }
    }

    // 選擇隨機單字
    function selectWord() {
        return WORDS[Math.floor(Math.random() * WORDS.length)];
    }

    // 開始遊戲
    function startGame() {
        targetWord = selectWord();
        currentRow = 0;
        currentTile = 0;
        guesses = [];
        isGameOver = false;

        attemptsDisplay.textContent = '0/6';
        loadStats();
        createBoard();
        resetKeyboard();

        startScreen.classList.add('hidden');
        gameOver.classList.add('hidden');
        gameBoard.classList.remove('hidden');
        keyboard.classList.remove('hidden');

        // Debug 用（正式版移除）
        // console.log('Target:', targetWord);
    }

    // 重置鍵盤
    function resetKeyboard() {
        const keys = keyboard.querySelectorAll('.key');
        keys.forEach(key => {
            key.classList.remove('correct', 'present', 'absent');
        });
    }

    // 處理按鍵輸入
    function handleKey(key) {
        if (isGameOver) return;

        if (key === 'ENTER') {
            submitGuess();
        } else if (key === 'BACKSPACE') {
            deleteLetter();
        } else if (/^[A-Z]$/.test(key)) {
            addLetter(key);
        }
    }

    // 新增字母
    function addLetter(letter) {
        if (currentTile >= 5) return;

        const tile = gameBoard.querySelector(`[data-row="${currentRow}"][data-col="${currentTile}"]`);
        tile.textContent = letter;
        tile.classList.add('filled');
        currentTile++;
    }

    // 刪除字母
    function deleteLetter() {
        if (currentTile <= 0) return;

        currentTile--;
        const tile = gameBoard.querySelector(`[data-row="${currentRow}"][data-col="${currentTile}"]`);
        tile.textContent = '';
        tile.classList.remove('filled');
    }

    // 取得目前行的猜測
    function getCurrentGuess() {
        let guess = '';
        for (let i = 0; i < 5; i++) {
            const tile = gameBoard.querySelector(`[data-row="${currentRow}"][data-col="${i}"]`);
            guess += tile.textContent;
        }
        return guess;
    }

    // 提交猜測
    function submitGuess() {
        const guess = getCurrentGuess();

        if (guess.length !== 5) {
            showMessage('請輸入 5 個字母！');
            shakeRow();
            return;
        }

        // 驗證是否為有效單字（簡化版：只檢查是否在單字庫中）
        // 若要更嚴格可加入完整字典驗證
        
        guesses.push(guess);
        revealRow(guess);
    }

    // 揭示結果
    function revealRow(guess) {
        const row = gameBoard.querySelector(`[data-row="${currentRow}"]`);
        const tiles = row.querySelectorAll('.tile');
        const targetLetters = targetWord.split('');
        const guessLetters = guess.split('');
        const result = new Array(5).fill('absent');

        // 第一輪：找出完全正確的
        for (let i = 0; i < 5; i++) {
            if (guessLetters[i] === targetLetters[i]) {
                result[i] = 'correct';
                targetLetters[i] = null;
                guessLetters[i] = null;
            }
        }

        // 第二輪：找出位置錯誤但存在的
        for (let i = 0; i < 5; i++) {
            if (guessLetters[i] !== null) {
                const index = targetLetters.indexOf(guessLetters[i]);
                if (index !== -1) {
                    result[i] = 'present';
                    targetLetters[index] = null;
                }
            }
        }

        // 動畫揭示
        tiles.forEach((tile, i) => {
            setTimeout(() => {
                tile.classList.add('reveal', result[i]);
                updateKeyboard(guess[i], result[i]);

                // 最後一個 tile 揭示後檢查結果
                if (i === 4) {
                    setTimeout(() => checkResult(guess), 300);
                }
            }, i * 300);
        });
    }

    // 更新鍵盤顏色
    function updateKeyboard(letter, status) {
        const key = keyboard.querySelector(`[data-key="${letter}"]`);
        if (!key) return;

        // 只能升級狀態：absent -> present -> correct
        if (key.classList.contains('correct')) return;
        if (key.classList.contains('present') && status !== 'correct') return;

        key.classList.remove('absent', 'present', 'correct');
        key.classList.add(status);
    }

    // 檢查結果
    function checkResult(guess) {
        if (guess === targetWord) {
            // 贏了
            isGameOver = true;
            stats.played++;
            stats.won++;
            stats.streak++;
            if (stats.streak > stats.maxStreak) {
                stats.maxStreak = stats.streak;
            }
            saveStats();
            showGameOver(true);
        } else if (currentRow >= 5) {
            // 輸了
            isGameOver = true;
            stats.played++;
            stats.streak = 0;
            saveStats();
            showGameOver(false);
        } else {
            // 繼續
            currentRow++;
            currentTile = 0;
            attemptsDisplay.textContent = `${currentRow}/6`;
        }
    }

    // 顯示遊戲結束畫面
    function showGameOver(won) {
        answerDisplay.textContent = targetWord;
        answerDisplayIDE.textContent = targetWord;
        finalAttempts.textContent = currentRow + 1;
        finalAttemptsIDE.textContent = currentRow + 1;

        if (won) {
            gameOverTitle.classList.remove('lose');
            gameOverTitle.innerHTML = `
                <span class="normal-title">🎉 太棒了！</span>
                <span class="ide-title">// SUCCESS!</span>
            `;
        } else {
            gameOverTitle.classList.add('lose');
            gameOverTitle.innerHTML = `
                <span class="normal-title">😢 可惜！</span>
                <span class="ide-title">// FAILED!</span>
            `;
        }

        setTimeout(() => {
            gameOver.classList.remove('hidden');
        }, 500);
    }

    // 顯示訊息
    function showMessage(text) {
        messageDisplay.textContent = text;
        messageDisplay.classList.remove('hidden');
        setTimeout(() => {
            messageDisplay.classList.add('hidden');
        }, 1500);
    }

    // 抖動行
    function shakeRow() {
        const row = gameBoard.querySelector(`[data-row="${currentRow}"]`);
        row.classList.add('shake');
        setTimeout(() => row.classList.remove('shake'), 300);
    }

    // 複製結果
    function copyResult() {
        const emojis = guesses.map(guess => {
            let row = '';
            for (let i = 0; i < 5; i++) {
                if (guess[i] === targetWord[i]) {
                    row += '🟩';
                } else if (targetWord.includes(guess[i])) {
                    row += '🟨';
                } else {
                    row += '⬜';
                }
            }
            return row;
        }).join('\n');

        const result = `RG's Wordle\n${guesses.length}/6\n\n${emojis}`;

        navigator.clipboard.writeText(result).then(() => {
            showMessage('已複製到剪貼簿！');
        }).catch(() => {
            showMessage('複製失敗');
        });
    }

    // 事件監聽：虛擬鍵盤
    keyboard.addEventListener('click', (e) => {
        const key = e.target.closest('.key');
        if (key) {
            handleKey(key.dataset.key);
        }
    });

    // 事件監聽：實體鍵盤
    document.addEventListener('keydown', (e) => {
        if (startScreen.classList.contains('hidden') && gameOver.classList.contains('hidden')) {
            if (e.key === 'Enter') {
                handleKey('ENTER');
            } else if (e.key === 'Backspace') {
                handleKey('BACKSPACE');
            } else if (/^[a-zA-Z]$/.test(e.key)) {
                handleKey(e.key.toUpperCase());
            }
        }
    });

    // 事件監聽：按鈕
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    shareBtn.addEventListener('click', copyResult);

    // 初始化
    function init() {
        loadStats();
        gameBoard.classList.add('hidden');
        keyboard.classList.add('hidden');
        gameOver.classList.add('hidden');
        startScreen.classList.remove('hidden');
    }

    init();
})();
