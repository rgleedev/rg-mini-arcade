// 主題管理
(function() {
    const THEME_KEY = 'rg-arcade-theme';
    const COLOR_KEY = 'rg-arcade-color';
    const themeToggle = document.getElementById('theme-toggle');

    const colorThemes = [
        { id: 'dusty-blue', name: '霧霾藍', class: 'theme-dusty-blue' },
        { id: 'dusty-rose', name: '乾燥玫瑰', class: 'theme-dusty-rose' },
        { id: 'sage-green', name: '鼠尾草綠', class: 'theme-sage-green' },
        { id: 'lavender', name: '薰衣草紫', class: 'theme-lavender' },
        { id: 'warm-taupe', name: '暖灰褐', class: 'theme-warm-taupe' }
    ];

    // 創建主題選擇器
    function createThemePicker() {
        const picker = document.createElement('div');
        picker.className = 'theme-picker';
        picker.innerHTML = `
            <button class="theme-picker-toggle" title="選擇主題色">🎨</button>
            <div class="theme-options">
                ${colorThemes.map(theme => `
                    <button class="theme-option" data-theme="${theme.id}">
                        <span class="color-dot ${theme.id}"></span>
                        <span>${theme.name}</span>
                    </button>
                `).join('')}
            </div>
        `;
        document.body.appendChild(picker);

        // 切換面板
        const toggle = picker.querySelector('.theme-picker-toggle');
        toggle.addEventListener('click', () => {
            picker.classList.toggle('open');
        });

        // 選擇主題色
        const options = picker.querySelectorAll('.theme-option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                const themeId = option.dataset.theme;
                setColorTheme(themeId);
                updateActiveOption(themeId);
                picker.classList.remove('open');
            });
        });

        // 點擊外部關閉
        document.addEventListener('click', (e) => {
            if (!picker.contains(e.target)) {
                picker.classList.remove('open');
            }
        });

        return picker;
    }

    // 設定主題色
    function setColorTheme(themeId) {
        // 移除所有主題色
        colorThemes.forEach(t => {
            document.body.classList.remove(t.class);
        });

        // 加入新主題色
        const theme = colorThemes.find(t => t.id === themeId);
        if (theme) {
            document.body.classList.add(theme.class);
            localStorage.setItem(COLOR_KEY, themeId);
        }
    }

    // 更新選中狀態
    function updateActiveOption(themeId) {
        const options = document.querySelectorAll('.theme-option');
        options.forEach(option => {
            option.classList.toggle('active', option.dataset.theme === themeId);
        });
    }

    // 載入儲存的主題
    function loadTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme === 'ide') {
            document.body.classList.add('ide-mode');
        }

        // 載入主題色
        const savedColor = localStorage.getItem(COLOR_KEY) || 'dusty-blue';
        setColorTheme(savedColor);
    }

    // 切換主題
    function toggleTheme() {
        document.body.classList.toggle('ide-mode');
        const isIDE = document.body.classList.contains('ide-mode');
        localStorage.setItem(THEME_KEY, isIDE ? 'ide' : 'normal');
    }

    // 初始化
    loadTheme();
    createThemePicker();

    // 更新選中狀態
    const savedColor = localStorage.getItem(COLOR_KEY) || 'dusty-blue';
    setTimeout(() => updateActiveOption(savedColor), 0);

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
})();
