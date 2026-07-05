# ⚾ Super Mega Baseball 4 球員資料庫

一個為 **Super Mega Baseball 4** 打造的互動式球員資料視覺化平台，支援球員查詢、球隊統計、打線規劃與技能總覽。

![Platform](https://img.shields.io/badge/platform-Web-blue)
![Framework](https://img.shields.io/badge/framework-React%20%2B%20Vite-646cff)
![Language](https://img.shields.io/badge/language-TypeScript-3178c6)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎮 功能特色

### 🧑 球員總覽（Players View）
- 完整球員名單列表，支援搜尋、篩選與排序
- 可依球隊、守備位置、聯盟、分區進行多重篩選
- 點選球員查看詳細屬性雷達圖（能力值視覺化）

### 🏟️ 球隊統計（Teams View）
- 各球隊整體平均能力值一覽
- 點選球隊查看球隊屬性雷達圖
- 依聯盟 / 分區篩選

### 📋 打線規劃（Lineup Builder）
- 拖曳式打線與守備位置配置
- 自動化評估打線強度
- 互動式棒球場守備示意圖

### ⭐ 技能總覽（Traits View）
- 所有球員技能的完整說明與分類
- 支援中英文切換

### 🌐 多語言支援
- 支援 **繁體中文** / **English** 即時切換

---

## 🛠️ 技術架構

| 類別 | 技術 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 建置工具 | Vite 8 |
| 圖表 | ECharts / Recharts / Chart.js |
| 圖示 | Lucide React |
| 樣式 | Vanilla CSS（glassmorphism 設計風格）|

---

## 🚀 本地開發

### 環境需求
- Node.js 18+
- npm 9+

### 安裝與啟動

```bash
# 進入前端資料夾
cd frontend

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

開啟瀏覽器並前往 `http://localhost:5173`

### 建置生產版本

```bash
npm run build
```

---

## 📁 專案結構

```
mega baseball/
├── frontend/                  # 前端 Web 應用
│   ├── src/
│   │   ├── components/        # React 元件
│   │   │   ├── PlayerGrid.tsx      # 球員列表
│   │   │   ├── PlayerRadar.tsx     # 球員雷達圖
│   │   │   ├── TeamGrid.tsx        # 球隊列表
│   │   │   ├── TeamRadar.tsx       # 球隊雷達圖
│   │   │   ├── LineupBuilder.tsx   # 打線規劃器
│   │   │   ├── TraitsDashboard.tsx # 技能總覽
│   │   │   ├── ChemistryGuide.tsx  # 默契說明
│   │   │   └── StatGuide.tsx       # 屬性說明
│   │   ├── data/              # 球員 / 技能 JSON 資料
│   │   ├── context/           # 語言 Context
│   │   ├── locales/           # 翻譯文字
│   │   └── utils/             # 工具函式
│   └── public/                # 靜態資源
├── extract_new_rosters.py     # 資料擷取腳本
├── merge_data.py              # 資料合併腳本
├── parse_traits.py            # 技能解析腳本
└── 球員資料.xlsx              # 原始球員資料
```

---

## 📊 資料來源

球員資料整理自 **Super Mega Baseball 4** 遊戲內數據，包含：
- 球員基本屬性（打擊、投球、守備、跑壘）
- 球隊與聯盟分組
- 特殊技能（Traits）

---

## 📄 授權

本專案以 [MIT License](LICENSE) 授權釋出，僅供個人學習與非商業用途使用。

Super Mega Baseball 4 為 Metalhead Software 之商標，本專案與官方無關。
