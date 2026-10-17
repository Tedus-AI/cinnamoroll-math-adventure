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

## 2026-10-18 平板相容更新

- 自動辨識 iPad／觸控平板，頂端可切換電腦版與平板版；選擇保存在裝置。
- iOS 改用頁面內滿版，避免原生全螢幕的退出叉叉與下滑退出手勢。Safari 工具列與作業系統手勢仍由系統控制；可加入主畫面以獨立視窗啟動。
- 遊戲圖片禁止原生拖圖；平板版抑制長按圖片選單，輸入欄仍可正常編輯。
- 平板動畫透過透明 2D 畫布呈現 WebGL 動畫結果；採一致的預乘透明度，移除角色 SVG 陰影合成，透明角色圖層不攔截擺飾操作。
- 移除擺飾繼承的按鈕按下位移與過渡。放手保存相同座標，不重建房間或重新隨機切換動作。
- 擺飾角落縮放固定對角、保持比例；身上配件維持身體定位，使用同樣的方向性縮放。可縮到原尺寸 5%，縮過對角不會反向放大。
- 身上配件由工具列「調整」按鈕選取，避免透明配件區域擋住後方擺飾；平板四角控制點加大。
- 六世界加入不同配器與節奏：笛音、豎琴三拍圓舞曲、鋼鼓切分節奏、稀疏鐘琴、慢弦樂、號角；各世界魔王曲也使用對應配器。

驗證：24 個單元測試、Worker 整合測試及語法檢查通過。依使用者要求未進行瀏覽器操作測試；iOS 白框與觸控實機效果待使用者驗收。
