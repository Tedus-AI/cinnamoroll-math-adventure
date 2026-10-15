# 換裝小屋與音效（2026-10-15）

## 此版本

- 左列「我的收藏」上方新增換裝小屋，使用未裝扮的大耳狗中性姿勢作為固定座標底圖。
- 舊 16 件收藏全部可用；固定位置為頭頂、右耳、頸部、胸前、手邊、身旁、腳邊。同位置替換，不同位置並存。可單獨卸下或全部卸下。
- 五張獨立生成背景：雲朵臥室、甜點咖啡館、彩虹海灘、星光花園、月光城堡。初始提供臥室，其餘由首次完成冒險、25／75 題、彩虹港灣魔王解鎖。
- 初始五種待機：呼吸搖擺、左右探頭、開心跳跳、漂浮轉圈、打瞌睡。每 6.5–9 秒選下一種，至少保留一種，兩種以上不連續重複。50 題解鎖星光舞步、100 道四位數解鎖勇者歡呼。
- 收藏共 28 項，配件、場景、動作都可從收藏或換裝小屋套用。換裝每頁四項，收藏每頁六項。
- Web Audio 合成 13 組提示音，包含按鈕、數字、步驟、答對、答錯、攻擊、受傷、通關、擊敗魔王、失敗、領獎、換裝、出發。音效在手勢後啟用，可靜音與切換三段音量；頁面隱藏時停止聲音。
- 舊存檔缺少 wardrobe 時補入預設；既有配件與收藏保留。後端仍使用版本檢查與操作 ID 去重。沒有資料庫 schema migration，也不刪除任何舊帳號。

## iPad 大畫面限制

原生 Fullscreen API 的關閉 X、系統手勢與時間列屬於 Safari / iPadOS，網站無法強制移除或保證只可用站內按鈕退出。本版清楚告知限制；保留右上角退出全螢幕按鈕，新增僅由站內按鈕切換的「專注模式」，收起品牌及頁腳並減少頁面彈動。專注模式不等於作業系統全螢幕，不會聲稱隱藏瀏覽器工具列。既有 PWA manifest 支援加入主畫面，以獨立視窗啟動；狀態列仍依裝置版本而定。

## 存檔與 Firebase 待辦

目前：GitHub Pages 靜態前端 → Sites Worker /api/game → Cloudflare D1。players 儲存雜湊認證，sessions 儲存雜湊 token，saves 儲存進度 JSON／版本。瀏覽器的帳號存檔只是快取；訪客存檔才僅在 localStorage。

Firebase 官方連接已找到，但本次尚未取得使用者 Firebase 連接或專案；沒有建立 Firestore、沒有修改 Firebase 規則，也沒有宣稱完成遷移。現有 D1 保持運作。

連接後先選用使用者指定專案，再確認 Spark（不啟用計費）。建議 Firebase Auth + Firestore 的帳號進度文件，僅本人 UID 可讀寫，預設拒絕其他路徑；不要將資料庫開放公開。舊 D1 的自訂數字密碼／家長復原碼不等於 Firebase Auth，需獨立遷移與認證橋接方案。先驗證舊帳號、將完整進度與 wardrobe 綁定新 UID、逐筆對照版本並測試跨裝置，再切換正式服務。保留 D1 回復路徑。若要保留伺服器計分，可讓現有 Worker 驗證 Firebase ID token；不要直接信任公開客戶端提交的獎勵。

## 美術生成

以內建 image generation 製作五張 1536×1024 PNG，位於 public/game/assets/room-{bedroom,cafe,beach,garden,castle}.png；docs/assets/ 同步副本供 Pages 使用。

共同提示：Use case: illustration-story. One polished 2D background for a Cinnamoroll dress-up game. Landscape 1536x1024. Authentic kawaii Sanrio picture-book aesthetic, delicate pale blue outlines, pastel watercolor textures, rich edge detail, luminous soft light. Empty central foreground for a separately overlaid white Cinnamoroll. No characters, letters, UI, watermark. Full bleed single continuous scene.

各場景追加：cloud bedroom with long floppy puppy-ear motifs and blue checked curtains; pink/cream dessert cafe with cinnamon rolls; rainbow beach with pastel seashells and cloud islands; starlight garden with glowing star flowers and crescent lanterns; moonlit castle terrace with white towers and pastel banners.

## 驗證

11 項引擎／換裝測試（含 9,000 道題目）、JS 語法、TypeScript 型別與正式建置。PNG 完整解碼及素材路徑檢查。環境未提供 control-browser，依工作流程跳過瀏覽器 QA；實體 iPad Safari、音效聽感、原生全螢幕及實際無捲動版面仍需裝置驗證。
