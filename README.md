# 大耳狗的雲朵除法冒險

> 新版加入換裝小屋、五張場景、隨機待機與音效。詳見 [換裝版本說明](documentation/DRESSING_ROOM_V3.md)。

以四位數除二位數為主、適合 iPad 橫向與直向操作的繁體中文數學遊戲。

- 遊戲：https://tedus-ai.github.io/cinnamoroll-math-adventure/
- 雲端服務與備用遊戲：https://cinnamoroll-math-adventure.bronzelion1.chatgpt.site/game/index.html

## 已實作

- 6 個世界、36 關、6 位原創雲朵魔王；二、三位數暖身可選，四位數主線可直接進入。
- 每關 5 題、魔王 8 題；逐步直式引導。
- 所有數學作答與數字密碼都用遊戲內按鍵，不使用可編輯數字輸入欄位。
- 商中間／末尾的 0、整除、非整除、試商與餘數限制。
- 28 種固定收藏、成就收藏、雲朵幣購買與大耳狗換裝；没有抽卡或付費。
- 3 個每日任務，使用 Asia/Taipei 日期，每天 00:00 重置。
- 訪客試玩：本機儲存、Service Worker 支援曾載入後的離線試玩。
- 雲端帳號：3–24 位英文／數字／底線帳號，暱稱、8–12 位數字密碼、家長復原碼。
- 帳號進度由 Cloudflare D1 持久保存，每題結算後即保存，跨裝置可以續玩同一場冒險。
- 伺服器驗證答案及計算獎勵；操作 idempotency、版本衝突檢查，避免重複獎勵／舊進度覆蓋。
- 錯題本、複習、學習紀錄、XP 與等級。
- 分數、四則混合目前清楚標示尚未開放；擴充介面見 documentation/MATH_MODULES.md。

## 開始遊玩

按「開始 5 題冒險」可立即試玩。要跨裝置存檔，點右上角「登入雲端」建立帳號，保存家長復原碼。雲端帳號會建立新的冒險；訪客進度另外留在原裝置，不會自動搬入帳號。

三種難度皆使用直式。魔王戰分別提供 5／4／3 點生命；每步答錯扣血，生命歸零需重新挑戰。

三星需全題首次答對且未使用提示。直式步驟答錯、查看提示或示範也會記為輔助作答。使用提示仍能通關，不扣已取得的收藏。無錯題時，複習安排 2 道四位數題目。

## 部署結構

GitHub Pages 提供 docs/ 的靜態遊戲；公開 Sites Worker 提供 /api/game/* 帳號及進度 API，D1 資料庫不在此公開儲存庫內。密碼只保存 PBKDF2-SHA256 雜湊（100,000 次、獨立 salt），登入 token 在資料庫只保存 SHA256 雜湊。復原碼只顯示給註冊者。

public/game/ 是遊戲原始檔；docs/ 是同一版本的 Pages 發布檔。修改遊戲後執行：

    node scripts/sync-pages.mjs

GitHub Settings → Pages → Deploy from a branch → main /docs。推送更新後 GitHub 自動發布靜態檔案。雲端 API 的更新使用 Sites 工作流程，需要另外建置及部署。

public/game/config.js 只包含公開 API 位址，沒有金鑰。沒有在 GitHub 存放帳號資料、密碼、token 或測試資料庫。請勿提交 .env、.dev.vars、.wrangler、.sites-runtime、node_modules 或 dist。

## 本機開發與測試

Node >=22.13。

    npm ci
    npm run db:generate
    npm run build
    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_happy_doorman.sql
    npm run dev

本機資料庫 migration 僅需套用一次，不要重複套用。程式首次產生 migration 後，已套用的 SQL 不可直接修改，新增變更應產生新 migration。

    node --test tests/engine.test.mjs
    node tests/api.integration.mjs
    node node_modules/typescript/bin/tsc --noEmit

API integration test 僅允許 localhost，會建立獨立 QA 帳號；不允許對正式環境執行。正式環境可唯讀檢查健康與 CORS。

## 驗證範圍

題目與遊戲引擎、自建帳號／進度 API、自動化型別檢查與生產建置。瀏覽器檢查 1024×768、768×1024 與窄版畫面，以及直式作答與旋轉保留。這些是 Chrome 尺寸模擬，尚未在實體 iPad 的 Safari 驗證。

## 角色與素材

此為非官方粉絲學習作品，非 Sanrio 官方遊戲。Cinnamoroll／大耳狗角色相關權利歸 Sanrio 所有。遊戲使用 AI 生成角色與場景、原創魔王，以及程式動畫與裝備疊圖，沒有使用官方網站下載圖。原創魔王名稱不是三麗鷗官方設定。本儲存庫不對 Sanrio 角色授予額外授權。
