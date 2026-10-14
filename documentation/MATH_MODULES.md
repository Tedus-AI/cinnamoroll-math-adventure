# 數學題型擴充

第一版只開放 division；mixed / fractions 為規劃項目，不能作答。

## 程式責任

- public/game/math-modules.js：題型註冊與查找介面。
- public/game/modules/division.js：除法出題、直式步驟與答案驗證。
- public/game/engine.js：世界解鎖、題目場次、遊戲獎勵、任務、收藏、紀錄與 idempotency。
- public/game/app.js：畫面、數字盤、題型的作答介面。
- app/api/game/[action]/route.ts：身分驗證、伺服器結算、D1 進度版本檢查。
- db/schema.ts / drizzle：持久資料 schema 及可追蹤 migration。

## 題型介面

註冊物件必須含 id、generate、validate。建議加入 version、answerFields、steps：

    registerMathModule({
      id: "fractions",
      title: "分數樂園",
      version: 1,
      answerFields: ["numerator", "denominator"],
      generate(options, rng) { /* 產生完整題目 */ },
      validate(question, answer) { /* 精確判定 */ },
      steps(question) { /* 提示及步驟 */ }
    });

generate 返回的題目須含 id 和 topic。伺服器保存完整題目；publicState 應針對新題型加入公開序列化，移除標準答案。新題型在伺服器與訪客模式使用相同驗證器。分數需用有理數／整數運算，不應用浮點近似當作相等判定。

除法第一版呼叫 mathModule("division").generate / validate，XP、收藏、結算仍由遊戲引擎處理。

## 加入新題型的實際工作

1. 新增 modules/fractions.js 或 modules/mixed.js 與精確出題／驗證器。
2. 註冊新模組並開放 MODULES manifest；目前 UI 沒有承諾該題型已完成。
3. 加入新題型 renderer。數字盤通用；分數可用分子／分母按鈕欄位，四則混合可用結果欄位。
4. 加入新世界與題型專屬難度規則。
5. 將存檔 schema 升至 2：關卡 key 改成 topic:world:stage、錯題依 topic 分組、各題型任務獨立，並保留全局收藏與貨幣。
6. 對舊存檔提供顯式 migration；第一版舊 key 例如 2:0 需要遷移為 division:2:0。不要只改 key 而使既有進度失效。
7. 擴充 publicState、API 答案格式驗證及每日任務，避免新題型被套用除法 quotient/remainder 的欄位限制。
8. 測試等價分數、0、負數、括號優先序、重複提交、版本衝突與兩種方向版面。

第一版的介面與資料紀錄已有 topic 欄位；新題型仍需自己的教學／作答 renderer 及 schema 升級，並非只改題目文字。
