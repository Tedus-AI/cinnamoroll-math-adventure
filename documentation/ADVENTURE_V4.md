# 雲端與換裝更新記錄

## 2026-10-17 發布內容

- API 搬到擁有者的 Cloudflare Worker 與 D1。遷移檢查時舊服務 players、saves、sessions 均為 0；訪客本機存檔不變。
- 管理員驗證由後端 secret 處理，全 59 個收藏與所有關卡可使用。
- 保留原版 cinnamoroll-poses.png，使用網格變形與姿勢切換製作動態。打瞌睡使用原版躺睡姿勢。
- 42 個配件／擺飾圖像使用精確裁切或單獨透明圖；新增 3 頂帽子與 3 件衣服。
- 非身上物件可獨立拖曳、縮放、調整前後層；身上配件跟隨姿勢且可個別縮放。
- 點其他地方取消虛線選取框；拖角落等比例縮放，工具列也提供大小按鈕。
- 漂浮轉圈期間暫時隱藏頸飾、背包與衣服，結束後自動恢復。
- 角色繪製畫布每側增加 64 原圖像素空間，降低動作超出原邊界的裁切。
- 四款單色皮膚向白色調淡一半；彩虹款保留原本色彩。
- 每關三個難度獨立收集三星，依序解鎖，共 324 星；舊進度一次性遷移保留。
- Lv.3、5、8、12、16 解鎖五款異色皮膚與閃動光暈，最後一款為彩虹極光。
- 主畫面、六個世界、六個魔王戰使用不同原創合成背景音樂。

## 素材交付

遊戲圖片位於 public/game/assets/，發布副本位於 docs/assets/：

- collectibles-classic-v4.png：16 個原有配件重新製作。
- collectibles-new-v4.png：12 個新增配件。
- room-props-v4.png：8 個場景擺飾。
- hat-starlight.png、hat-bonnet.png、hat-nightcap.png：星語魔法帽、雛菊蕾絲帽、薄荷晚安帽。
- outfit-sailor.png、outfit-apron.png、outfit-cape.png：晴空水手服、草莓甜心裙、星夜魔法披風。

上述圖像由 imagegen 生成。前三張圖集逐件以 item-crops.js 的像素範圍裁切；衣帽使用單張透明素材。配件採柔和童話水彩、珍珠與金邊細節；角色原圖沒有重繪。

六張單件衣帽的共用生成描述：

> Production transparent paper-doll game wearable asset. One isolated item centered, complete silhouette, occupy only central 72% of image with at least 14% transparent margin. Polished pastel storybook watercolor and pearlescent enamel accents, fine warm caramel outline, soft dimensional shading, satin/fabric texture, tasteful gold details. Designed for an adorable white Cinnamoroll long-eared puppy with a huge head and tiny round belly. Do not draw the puppy, mannequin, skin, hanger, text, labels, ground, shadows outside the item, scenery or other objects. Genuine transparent background, no grid, square.

每張分別指定淡紫星星魔法帽、雛菊粉蝴蝶結藍色蕾絲帽、薄荷睡帽、藍白水手背心、草莓粉雲朵口袋吊帶裙、淡紫星星披風。

## 驗證

- 21 個引擎／收藏／難度／存檔單元測試通過。
- Worker 整合測試通過：帳號、CORS、進度計算、重複操作、版本衝突、復原與管理員權限。
- 正式 Cloudflare health 成功；管理員登入與登出確認成功，取得 59 個收藏。
- 最新調淡、取消選取、角落縮放、轉圈衣飾隱藏與畫布擴大，依使用者要求留待使用者做瀏覽器視覺及操作驗收。
