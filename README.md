# 朝霧大陸 H5 原型 + 地圖 POC

- `index.html`：原型 App（首次進入、今日、信件、收藏、我），底部 tab 保留
- `world.html`：地圖 POC，嵌在「世界」tab 裡（全螢幕到底部 tab 上緣；切走時暫停渲染、切回保留狀態）
- `public/atlas.html`：七大行政區百科（獨立頁）

地圖 POC 驗證「全部點擊 + 轉場」的場景層級、右側返回、低耗電環境動畫。只針對手機直式。

## 部署

push 到 `main` 會由 `.github/workflows/deploy.yml` 自動 build 並部署到 GitHub Pages
（repo Settings → Pages → Source 需選 **GitHub Actions**）。

## 執行

```bash
npm install
npm run dev
```

手機同網段測試：`npm run dev` 已開 `--host`，用終端機印出的 Network 網址開啟。

## 流程

（世界 tab）世界（朝霧大陸）→ 點暖谷領 → 點映河書院（書院大街，可左右拖曳）→ 點數理學院 → 點學遠教室 → 點同學開啟互動。

- 右側：🌐 回世界、↑ 上一層、＋／－ 縮放
- 左上：麵包屑，可點上層
- 左下：實際渲染 fps 與環境動畫開關（比較耗電用）
- 每層都是一個路由（hash），瀏覽器返回鍵可用

## 架構

| 檔案 | 用途 |
|---|---|
| `src/stage/Stage.ts` | 全 App 唯一的 Pixi Application、場景切換轉場、手勢、render loop 節能策略 |
| `src/stage/Viewport.ts` | 單一場景內的拖曳／雙指縮放／慣性／邊界 |
| `src/stage/BaseScene.ts` | 熱區（多邊形）點擊、可暫停的環境動畫 |
| `src/stage/windMap.ts` | 樹葉擺動＋水面波光 shader（整張圖一次 draw call） |
| `src/scenes/*` | 各場景；地圖用真實底圖，室內為程式繪製的占位圖 |
| `src/data/maps.ts` | 熱區座標資料（正式版改由 Figma 匯出 SVG 產生） |
| `src/router.ts` | 場景層級 = 路由層級 |

### 耗電策略

- 互動或轉場中：60fps
- 只有環境動畫：30fps
- 環境動畫關閉且無互動：不渲染
- `prefers-reduced-motion` 預設關閉環境動畫；devicePixelRatio 上限 2

## Live2D 角色

書院大街、數理學院走廊、學遠教室各兩位角色，點角色開啟對話。

- 引擎：`untitled-pixi-live2d-engine`（Pixi v8 原生 render pipe，角色依圖層順序繪製、可被桌子等前景遮擋）
- 延遲載入：第一次進入有角色的場景才載入 Cubism Core 與引擎（`src/stage/live2d.ts`）
- 自然感（`src/scenes/Character.ts`）：
  - 模型內建 Idle（呼吸、眨眼）
  - 視線每 2.5–6 秒換注視點：看同場另一位角色／看鏡頭／隨意看看，頭與身體跟著轉
  - 頭髮、衣服、飾品：模型的 physics3.json 依頭身動作自然擺動
  - 偶爾的小動作與被點時的反應動作
  - 進場前先跑約 1 秒更新，避免出場時看到手臂切換的殘影
- 角色資料與台詞：`src/data/characters.ts`

### Cubism Core 版本

- `public/live2d/live2dcubismcore.min.js`：**Core 5.1.0**（目前使用）
- `public/live2d/live2dcubismcore-6.0.1.min.js`：Core 6.0.1，引擎內建的 Framework 尚不支援（draw order API 改了），保留待引擎更新
- 範例模型 Ren（Cubism 5.3、moc3 v6）需要 Core 6，先以 Haru 受付版代替

### 授權提醒

- 模型為 Live2D 官方範例：一般使用者／小規模事業者可商用，中大規模事業者僅限非公開測試
- Cubism Core 依 Live2D Proprietary Software License Agreement 使用

## POC 的捷徑（正式版要換掉）

- **wind / water mask 由程式依顏色自動推算**（偏暗綠＝樹、偏藍＝水），會誤判；正式版由美術畫灰階 mask。
- `continent.png` 只有 842×595，手機上偏糊；正式版需 2000px 以上。
- 世界圖的區域多邊形是手量的近似值，霧罩邊緣不精準。
- 書院大街、數理學院、學遠教室、同學都是程式畫的占位圖；同學台詞為示意。
- 開發模式下 `window.__stage` 可在 console 檢查。
