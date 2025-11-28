# RG's Mini Arcade

純前端迷你小遊戲合集，支援一般模式與 IDE 偽裝模式。

**Demo**: https://zzero0522.github.io/rg-mini-arcade/

## 遊戲列表

| 遊戲 | 說明 |
|------|------|
| 找不同顏色 | 找出顏色不同的方塊（禪模式 / 限時模式） |
| 1A2B 猜數字 | 經典猜數字遊戲（3-6位數） |
| Typing Test | 英打速度測試（15/30/60/120秒） |
| 記憶翻牌 | 配對記憶遊戲（4×4 / 4×6 / 4×8） |
| 剪刀石頭布 | 對戰 AI，追求最高連勝 |
| 迷你貪吃蛇 | 經典貪吃蛇（方向鍵 / WASD / 滑動控制） |
| 打地鼠 | 快速點擊地鼠，連擊加分（15/30/60秒） |
| 2048 | 滑動合併數字，挑戰 2048 |
| 終極密碼 | 猜隱藏數字，範圍逐步縮小（1-50 / 100 / 500 / 1000） |
| 反應力測試 | 測試反應速度（開發中） |
| Wordle | 猜單字遊戲（開發中） |

## 技術

- 純 HTML / CSS / JavaScript，無框架依賴
- localStorage 保存分數與設定
- 響應式設計

## 專案結構

```
rg-mini-arcade/
├── index.html          # 主選單
├── css/                # 樣式檔
├── js/                 # 遊戲邏輯
└── games/              # 各遊戲頁面
```

---

## Commit 規範

採用 [Conventional Commits](https://www.conventionalcommits.org/) 規範。

### 格式

```
<type>(<scope>): <subject>
```

### Type

| Type | 說明 |
|------|------|
| `feat` | 新增功能 |
| `fix` | 修復 bug |
| `docs` | 文件變更 |
| `style` | 程式碼格式（不影響邏輯） |
| `refactor` | 重構 |
| `perf` | 效能優化 |
| `chore` | 建置或工具變動 |

### Scope

遊戲：`color-diff`、`1a2b`、`typing-test`、`memory-cards`、`rps`、`snake`、`whack-a-mole`、`2048`、`number-range`

模組：`theme`、`menu`、`css`

### 範例

```
feat(rps): add win streak tracking
fix(1a2b): fix input validation
docs: update README
```

---

MIT License