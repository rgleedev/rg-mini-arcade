/**
 * 版本號動態加載器
 * 從 config/version.json 加載版本號並更新頁面上的所有版本號元素
 */

(async function loadVersion() {
    try {
        // 根據當前路徑選擇正確的配置文件路徑
        const currentPath = window.location.pathname;
        const isInGamesDir = currentPath.includes('/games/');
        const versionPath = isInGamesDir ? '../config/version.json' : './config/version.json';

        const response = await fetch(versionPath);
        if (!response.ok) {
            throw new Error(`Failed to load version.json from ${versionPath}`);
        }

        const versionData = await response.json();
        const version = versionData.version;

        // 更新所有有 data-version 屬性的元素
        document.querySelectorAll('[data-version]').forEach(element => {
            element.textContent = version;
        });

        // 更新版本號 badge 和 display
        document.querySelectorAll('.version-badge, .version-display').forEach(element => {
            element.textContent = version;
        });

        // 更新版本號標籤 (但不更新 changelog 頁面中的歷史版本號)
        if (!currentPath.includes('changelog')) {
            document.querySelectorAll('.version-tag').forEach(element => {
                if (element.textContent.startsWith('v')) {
                    element.textContent = version;
                }
            });
        }

        // 將版本號存儲在 window 物件
        window.APP_VERSION = version;
        window.APP_VERSION_DATA = versionData;

    } catch (error) {
        console.error('Error loading version:', error);
    }
})();
