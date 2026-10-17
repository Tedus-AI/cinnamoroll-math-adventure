# 大耳狗的雲朵除法冒險

[開始遊玩](https://tedus-ai.github.io/cinnamoroll-math-adventure/)

6 個世界、36 關，每關依序解鎖簡單、普通、困難，每個難度各收集 3 星，共 324 星。包含直式引導、錯題複習、每日任務與學習紀錄。

換裝小屋保留原版角色圖並加入眨眼、嘴巴、耳朵與肢體動態。59 個收藏包含配件、可自由擺放的裝飾、場景、動作與 5 款升級皮膚。配件及擺飾可拖曳角落等比例縮放；身上配件跟隨角色。主畫面、各世界與魔王戰使用不同背景音樂。

Lv.3／5／8／12／16 分別獲得櫻花奶霜、薄荷精靈、星夜紫羅蘭、晨曦蜜糖、彩虹極光皮膚與光暈。

## 雲端與管理員

GitHub Pages 從 main 分支的 docs/ 發布靜態遊戲；帳號及進度由擁有者自己的 Cloudflare Worker 與 D1 保存。

API：https://cinnamoroll-math-api.tedus-ai-games.workers.dev/api/game

點「登入雲端」可建立帳號或進入管理員入口。管理員 PIN 由 Cloudflare ADMIN_PIN secret 設定，不放在公開原始碼。管理員可使用全部關卡與收藏；不為一般玩家偽造星數或學習成績。

訪客進度留在裝置本機；雲端帳號另外保存。資料庫不在公開儲存庫。密碼及登入 token 以雜湊保存；伺服器驗證答案、獎勵與操作版本。

## 本機與發布

使用 Node 22.13 或更新版本。現行後端在 worker/；根目錄的 Sites 框架保留為舊版歷史，不是目前正式 API。

    npm --prefix worker ci
    node --test tests/*.test.mjs
    npm --prefix worker test

本機預覽前設定 LOCAL_ADMIN_PIN 環境變數為預期的四位數 PIN，再執行 npm --prefix worker run preview。本機預覽使用獨立測試資料庫。

更新前端後執行 node scripts/sync-pages.mjs，提交 public/game/ 與 docs/ 再合併到 main。Pages 設定為 main /docs。

後端設定在 wrangler.jsonc。取得 Cloudflare 授權後，透過 Wrangler 套用 worker/migrations/、設定 ADMIN_PIN secret，再執行 npm --prefix worker run deploy。現有正式資料庫已套用初始 migration，勿重建或清空。

請勿提交 .env、.dev.vars、.wrangler、本機資料庫、憑證或 node_modules。

## 更新與驗證

詳見 [本次更新記錄](documentation/ADVENTURE_V4.md)。最新一輪依使用者要求只做程式與服務檢查，瀏覽器畫面及操作驗收交由使用者。

此為非官方粉絲學習作品。Cinnamoroll／大耳狗相關權利歸 Sanrio 所有。本儲存庫不授予角色相關權利。
