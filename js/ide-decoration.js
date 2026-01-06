// IDE 裝飾元素動態加載
(function() {
    // 確保在 DOM 加載後執行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectIDEDecoration);
    } else {
        injectIDEDecoration();
    }

    function injectIDEDecoration() {
        // 檢查是否已經有裝飾元素
        if (document.querySelector('.ide-decoration')) {
            return;
        }

        // 檢測當前頁面類型
        const isGamePage = window.location.pathname.includes('/games/');
        const gameName = isGamePage ? getGameName() : 'index.html';

        const decorationHTML = `
            <!-- IDE 裝飾元素 (僅在 IDE 模式顯示) -->
            <div class="ide-decoration">
                <!-- 左側活動欄 -->
                <div class="ide-activity-bar">
                    <div class="activity-icon active" title="Explorer">📁</div>
                    <div class="activity-icon" title="Search">🔍</div>
                    <div class="activity-icon" title="Source Control">🔀</div>
                    <div class="activity-icon" title="Extensions">🧩</div>
                    <div class="activity-icon bottom" title="Settings">⚙️</div>
                </div>

                <!-- 左側文件管理器 -->
                <div class="ide-sidebar">
                    <div class="ide-sidebar-header">
                        <span>EXPLORER</span>
                        <div class="sidebar-actions">
                            <span class="sidebar-action" title="New File">📄</span>
                            <span class="sidebar-action" title="New Folder">📁</span>
                            <span class="sidebar-action" title="Refresh">🔄</span>
                        </div>
                    </div>
                    <div class="ide-file-tree">
                        <div class="ide-folder expanded">
                            <span class="folder-arrow">▼</span>
                            <span class="ide-folder-icon">📁</span>
                            <span class="folder-name">RG-MINI-ARCADE</span>
                        </div>
                        <div class="ide-file-group">
                            <div class="ide-file ${!isGamePage ? 'active' : ''}">
                                <span class="file-indent"></span>
                                <span class="ide-file-icon">🌐</span> index.html
                            </div>
                            <div class="ide-folder">
                                <span class="file-indent"></span>
                                <span class="folder-arrow">▶</span>
                                <span class="ide-folder-icon">📁</span> games
                                <span class="folder-badge">23</span>
                            </div>
                            ${isGamePage ? `
                            <div class="ide-file active" style="padding-left: 40px;">
                                <span class="ide-file-icon">🎮</span> ${gameName}
                            </div>
                            ` : ''}
                            <div class="ide-folder">
                                <span class="file-indent"></span>
                                <span class="folder-arrow">▶</span>
                                <span class="ide-folder-icon">📁</span> css
                                <span class="folder-badge">24</span>
                            </div>
                            <div class="ide-folder">
                                <span class="file-indent"></span>
                                <span class="folder-arrow">▶</span>
                                <span class="ide-folder-icon">📁</span> js
                                <span class="folder-badge">24</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 右側 Minimap -->
                <div class="ide-minimap">
                    <div class="minimap-content">
                        ${generateMinimapLines()}
                        <div class="minimap-viewport"></div>
                    </div>
                </div>

                <!-- 右側 AI 助手 -->
                <div class="ide-ai-panel">
                    <div class="ide-ai-header">
                        <span class="ai-icon">🤖</span>
                        <span>Copilot</span>
                        <div class="ai-actions">
                            <span class="ai-action">⚡</span>
                            <span class="ai-action">⋯</span>
                        </div>
                    </div>
                    <div class="ide-ai-content">
                        <div class="ai-suggestion">
                            <div class="ai-label">
                                <span class="ai-label-icon">💡</span> Suggestion
                            </div>
                            <div class="ai-code">${getAISuggestion(gameName)}</div>
                        </div>
                        <div class="ai-chat">
                            <div class="chat-message">
                                <span class="chat-avatar">🤖</span>
                                <div class="chat-content">
                                    <strong>Copilot</strong>
                                    <p>Ready to help you build amazing games! 🎮</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 下方終端機 -->
                <div class="ide-terminal">
                    <div class="ide-terminal-header">
                        <div class="terminal-tabs">
                            <span class="terminal-tab active">🖥️ TERMINAL</span>
                            <span class="terminal-tab">📤 OUTPUT</span>
                            <span class="terminal-tab">🐛 DEBUG CONSOLE</span>
                            <span class="terminal-tab">⚠️ PROBLEMS</span>
                        </div>
                        <div class="terminal-actions">
                            <span class="terminal-action" title="Split Terminal">⊞</span>
                            <span class="terminal-action" title="Trash">🗑️</span>
                            <span class="terminal-action" title="Close">×</span>
                        </div>
                    </div>
                    <div class="ide-terminal-content">
                        <div class="terminal-line">
                            <span class="terminal-prompt">PS C:\\Projects\\rg-mini-arcade></span>
                            <span class="terminal-command">npm run dev</span>
                        </div>
                        <div class="terminal-line">
                            <span class="terminal-success">✓</span>
                            <span class="terminal-output">Server running at http://localhost:3000</span>
                        </div>
                        <div class="terminal-line">
                            <span class="terminal-info">ℹ</span>
                            <span class="terminal-output">Watching for file changes...</span>
                        </div>
                        <div class="terminal-line">
                            <span class="terminal-prompt">PS C:\\Projects\\rg-mini-arcade></span>
                            <span class="terminal-cursor">_</span>
                        </div>
                    </div>
                </div>

                <!-- 頂部文件標籤列 -->
                <div class="ide-tabs">
                    <div class="ide-breadcrumb">
                        <span class="breadcrumb-item">RG-MINI-ARCADE</span>
                        <span class="breadcrumb-separator">›</span>
                        ${isGamePage ? '<span class="breadcrumb-item">games</span><span class="breadcrumb-separator">›</span>' : ''}
                        <span class="breadcrumb-item">${gameName}</span>
                    </div>
                    <div class="ide-tab-bar">
                        <div class="ide-tab ${!isGamePage ? 'active' : ''}">
                            <span class="tab-icon">🌐</span>
                            <span class="tab-name">index.html</span>
                            ${!isGamePage ? '<span class="tab-modified">●</span>' : ''}
                            <span class="tab-close">×</span>
                        </div>
                        ${isGamePage ? `
                        <div class="ide-tab active">
                            <span class="tab-icon">🎮</span>
                            <span class="tab-name">${gameName}</span>
                            <span class="tab-modified">●</span>
                            <span class="tab-close">×</span>
                        </div>
                        ` : ''}
                        <div class="ide-tab">
                            <span class="tab-icon">🎨</span>
                            <span class="tab-name">style.css</span>
                            <span class="tab-close">×</span>
                        </div>
                    </div>
                </div>

                <!-- 底部狀態欄 -->
                <div class="ide-statusbar">
                    <div class="statusbar-left">
                        <span class="status-item" title="Branch">🔀 main</span>
                        <span class="status-item" title="Sync">↻ 0↓ 0↑</span>
                        <span class="status-item status-error" title="Errors">✕ 0</span>
                        <span class="status-item status-warning" title="Warnings">⚠ 0</span>
                    </div>
                    <div class="statusbar-right">
                        <span class="status-item">UTF-8</span>
                        <span class="status-item">LF</span>
                        <span class="status-item">HTML</span>
                        <span class="status-item">Ln 42, Col 12</span>
                        <span class="status-item">Spaces: 4</span>
                    </div>
                </div>
            </div>
        `;

        // 插入到 body 的開頭
        document.body.insertAdjacentHTML('afterbegin', decorationHTML);
    }

    function getGameName() {
        const path = window.location.pathname;
        const match = path.match(/\/games\/(.+\.html)/);
        return match ? match[1] : 'game.html';
    }

    function generateMinimapLines() {
        let lines = '';
        for (let i = 0; i < 20; i++) {
            const isShort = i % 3 === 2;
            lines += `<div class="minimap-line ${isShort ? 'short' : ''}"></div>`;
        }
        return lines;
    }

    function getAISuggestion(filename) {
        const suggestions = {
            'index.html': 'function loadGames() {<br>&nbsp;&nbsp;// Display game menu...<br>}',
            'color-diff.html': 'function generateColors() {<br>&nbsp;&nbsp;return randomColor();<br>}',
            '1a2b.html': 'function checkGuess(num) {<br>&nbsp;&nbsp;// Calculate A and B...<br>}',
            'snake.html': 'function moveSnake() {<br>&nbsp;&nbsp;// Update position...<br>}',
            'default': 'function initGame() {<br>&nbsp;&nbsp;// Start the game...<br>}'
        };
        return suggestions[filename] || suggestions['default'];
    }
})();
