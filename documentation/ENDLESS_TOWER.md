# 天梯無盡模式・第一季（2026-10-20）

入口：首頁「天梯無盡」卡片及側邊選單。第一季 1～100 層，逐層開啟；一般層 3 題、每 10 層魔王 5 題與 5 點生命。每層最多 3 星，天梯星數與六個世界分開保存。

魔王採「整場」倒數，考量直式輸入需要逐步填商、乘、減，題目越長給越多時間：

| 層數 | 時間 | 首通限定獎勵 |
|---|---|---|
| 10 | 5 分鐘 | 極光雲端觀測台（極光與星光） |
| 20 | 6 分鐘 | 卡布奇諾 |
| 30 | 7 分鐘 | 櫻花流水庭園（飄落花瓣） |
| 40 | 7 分鐘 | 摩卡 |
| 50 | 8 分鐘 | 流星祈願露台（劃過夜空的流星） |
| 60 | 8 分鐘 | 戚風 |
| 70 | 9 分鐘 | 彩虹水晶潟湖（水波與上升氣泡） |
| 80 | 9 分鐘 | 濃縮咖啡 |
| 90 | 10 分鐘 | 天界星光宮殿（光束與閃爍星光） |
| 100 | 10 分鐘 | 牛奶 |

普通樓層不限時。魔王的倒數包含提示、離開畫面及關閉瀏覽器的時間；重新整理不能重置，雲端以伺服器時間驗證，失敗可從當層重新開始。訪客模式保留在本機，登入帳號則存到原有 Cloudflare D1 存檔，沒有重建或清空資料庫。

每題雲朵幣為原基礎獎勵加上 floor((層數−1)/10)。首通一般層獎勵 20+2×層數，魔王 100+5×層數；重玩通關幣為首次四分之一（無條件捨去）。通關 XP 為 20+5×ceil(層數/10)，答題 XP 另計。限定物品每帳號一次；已有物品不重複發送。每層都保留星數與通關紀錄，管理員可試玩所有樓層但不虛構一般玩家學習成果。

小屋增加「角色」分類，原版喜拿保留，五位朋友使用各自的透明圖、動態變形與配件對位。特殊場景使用獨立背景圖、非攔截觸控的動畫圖層與各自專屬曲目。減少動態效果偏好會停用場景動畫。

角色識別參考使用者提供的文章：https://www.popdaily.com.tw/forum/japan/1531331 。角色及品牌屬 Sanrio，本站沿用非官方粉絲學習作品標示。

## 素材及提示詞

使用內建 imagegen；每個資產各一次生成，五位角色依該文章個別圖片做參考。保留生成原檔並複製到 `public/game/assets/`，發布副本在 `docs/assets/`。角色 `character-{cappuccino,mocha,chiffon,espresso,milk}.png`，場景 `room-tower-{aurora,blossom,meteor,lagoon,palace}.png`。角色為 1254×1254 RGBA，場景為 1536×1024 PNG。原版 cinnamoroll-poses.png 不變。

角色共同提示（將名字替換為各角色）：

> Use case: identity-preserve. Asset type: transparent game paper-doll character. Reference image is the precise identity of Sanrio Cinnamoroll friend [name]. Recreate ONLY this one character as a clean full-body front-facing neutral standing sprite, preserve exact recognizable colors, ear shape, eye color, signature face/muzzle/bows/pacifier, warm tan outlines and flat pastel official-like 2D linework. No added clothing, no scene, no text, no ground or cast shadow. Square transparent canvas. Fit entire silhouette with generous transparent margins (at least 10% all sides). Normalize layout: head centered at x50% y43%, eye level46%, head bottom58%, body from58 to78%, feet at82%, ear tips within8..92% width. Arms resting beside belly; Milk may sit. One character only. Polished smooth linework, preserve charming simple original form, not realistic, not 3D.

場景共同提示：

> Use case: illustration-story. Asset type: premium fantasy paper-doll room background. [scene]. Beautiful detailed dreamy pastel watercolor storybook illustration, delicate golden ornament outlines, luminous soft lighting, elegant composition. Landscape 3:2 composition, entire room environment. Keep large clear central lower area for a character, furnishings concentrated edges and distance. NO characters, NO text, no interface, no border. Complete background edge to edge. Elaborate but legible and airy, soft ivory pearlescent textures, high quality cute fantasy game environment.

五種 scene：

- aurora: An aurora cloud observatory, mint violet aurora ribbons above white floating cloud balconies and crystalline telescopes, starry midnight blue sky
- blossom: A pink cherry blossom cloud garden with a little creek and a delicate arched white bridge, flowering cherry trees framing left and right, warm spring sunrise
- meteor: A dreamy purple meteor observatory terrace, crescent moon above a distant cloud sea, ornate gold star telescope on one side and crystal star lamps
- lagoon: A magical rainbow lagoon pavilion, luminous turquoise water, pearl arches and rainbow waterfall in distance, translucent bubbles and seashell details
- palace: A glorious celestial cloud palace ballroom, blue and gold domed architecture, pastel rainbow glass windows, golden star chandeliers, ornate white cloud marble floor

## 驗證

- Node 單元測試包含百層依序通關、300 星、獎勵唯一性、重玩、失敗、逾時、序列化、無權穿戴、管理員解鎖。
- 本地隔離 Workers/D1 整合測試包含伺服器樓層限制、倒數、過期答案拒絕、角色領獎與保存。
- 圖片逐一目視檢查，角色透明角落 alpha=0，沒有更動原版角色圖。
- 依使用者要求，未操作瀏覽器做遊玩驗收；iPad 上的實際動畫、配件位置與操作感由使用者確認。

## 2026-10-21 場景動態加強

櫻花原效果保留。極光改為三層高亮光幕，以不同週期左右擺動；流星加上長尾並縮短到約 4～5 秒一輪；潟湖增加 28～64px 氣泡、流動波紋及擴散漣漪；宮殿新增三束掃動光柱與較大的旋轉浮動星光。所有動畫圖層不接收指標事件，保留減少動態效果設定。未操作瀏覽器，實際視覺驗收交由使用者。


### 潟湖視覺調整

依使用者回饋移除彩虹水晶潟湖的流動水波與擴散漣漪，保留原背景及上升泡泡。
