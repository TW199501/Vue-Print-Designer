# 安全性評估報告 - Vue Print Designer

- 評估日期：2026-02-28
- 專案路徑：`d:\code\Vue-Print-Designe`
- 評估類型：靜態程式碼審查 + 相依套件弱點掃描
- 參考標準：OWASP Top 10 (2021)、CWE、CVSS、前端安全最佳實務

## 執行摘要

本專案為 Vue 3 + TypeScript 的列印設計器，提供 Web Components 匯出、本地/遠端（WebSocket）列印通道，以及模板/自定義元素的遠端 CRUD 能力。

本次共識別 **5 項安全議題**：

- **Critical（嚴重）**：2 項
- **High（高）**：2 項
- **Medium（中）**：1 項

最主要風險如下：

1. 透過模板 `customScript` + `new Function(...)` 形成的**任意 JavaScript 執行路徑**。
2. Runtime 相依套件 `jspdf@2.5.2` 存在**已公開的 Critical 弱點**。
3. **敏感憑證處理不足**（`localStorage` 持久化與 URL Query 傳遞 Token/Key）。

---

## 範圍與方法

本次審查內容：

- 技術文件：`docs/en/guide/web-components-guide.md`、`docs/en/guide/custom-element.md`、`README_EN.md`
- Runtime 程式碼：`src/**`
- 建置與相依設定：`package.json`、`package-lock.json`

檢查重點：

- 注入/XSS/動態程式執行 sink（`new Function`、`v-html`、`innerHTML`、message 邊界）
- 敏感資料儲存與傳輸
- 本地/遠端列印認證流程
- 相依套件弱點掃描（`npm audit --omit=dev --json`）

---

## 風險明細

### [VPD-SEC-001] 模板 `customScript` 可導致任意程式碼執行

- 嚴重度：**Critical**
- OWASP 對應：A03 Injection
- CWE 對應：CWE-94（Code Injection）、CWE-95（Eval Injection）

#### 位置

- `src/components/elements/TableElement.vue:195`
- `src/components/elements/TableElement.vue:197`
- `src/utils/print.ts:502`
- `src/utils/print.ts:542`
- `src/stores/templates.ts:251`
- `src/stores/templates.ts:258`
- `src/web-component.ts:295`
- `src/web-component.ts:301`

#### 證據

- `customScript` 作為資料直接被執行：
  - `new Function('data', 'footerData', 'columns', 'type', props.element.customScript)`
  - `new Function('data', 'footerData', 'columns', 'type', customScript)`
- 模板內容可由遠端載入並寫入 runtime 狀態，缺少腳本層級信任邊界。

#### 影響（一句話）

若攻擊者可影響模板資料（API 遭入侵、供應鏈污染、惡意共享模板），即可在應用同源內執行任意 JavaScript。

#### 修復建議

1. 移除對不可信模板內容的 `new Function` 執行。
2. 改為受限 DSL / 白名單運算引擎（禁止 runtime JS eval）。
3. 若必須保留腳本擴充，請改為隔離執行（獨立 Worker/隔離 iframe + 嚴格 message schema），並要求模板簽章/信任來源。
4. 新增安全模式：預設關閉 custom script，僅在明確啟用時開放。

#### 誤判說明

若所有模板來源皆可強保證為可信且不可由使用者提供，風險可下降；但此信任邊界本身仍屬高價值攻擊面。

---

### [VPD-SEC-002] Runtime 套件 `jspdf@2.5.2` 存在 Critical 已知弱點

- 嚴重度：**Critical**
- OWASP 對應：A06 Vulnerable and Outdated Components
- CWE 對應：多項（含 CWE-22、CWE-94、CWE-400）

#### 位置

- `package.json:39`
- `package-lock.json:2206`
- `package-lock.json:2208`
- `package-lock.json:1834`
- `package-lock.json:1836`

#### 證據

- `npm audit --omit=dev --json` 顯示：
  - `jspdf` 多項 high/critical 公開弱點（例如 GHSA-f8cm-6447-x5h2、GHSA-9vjf-qc39-jprp、GHSA-p5xg-68wr-hm3m 等）
  - 透過 `jspdf` 帶入的 `dompurify` 弱點（`<3.2.4`）
- 目前安裝版本：
  - `jspdf@2.5.2`
  - `dompurify@2.5.8`（`jspdf` 依賴樹內）

#### 影響（一句話）

已知可利用的套件弱點可能在 PDF 產生流程中導致 DoS 或注入類風險。

#### 修復建議

1. 將 `jspdf` 升級至修補版本線（audit 建議 `4.2.0`）。
2. 升級後執行完整匯出/列印回歸測試。
3. 在 CI 加入 SCA / `npm audit` 門檻，阻擋弱點版本再引入。

#### 誤判說明

實際可利用性取決於功能使用情境，但 runtime 依賴含 Critical CVE 應視為上線阻擋議題。

---

### [VPD-SEC-003] 敏感憑證與 Token 持久化於 `localStorage`

- 嚴重度：**High**
- OWASP 對應：A02 Cryptographic Failures / Sensitive Data Exposure
- CWE 對應：CWE-922（Sensitive Data in Client-Side Storage）

#### 位置

- `src/composables/usePrintSettings.ts:251`
- `src/composables/usePrintSettings.ts:270`
- `src/composables/usePrintSettings.ts:326`
- `src/composables/usePrintSettings.ts:327`
- `src/composables/usePrintSettings.ts:340`
- `src/composables/usePrintSettings.ts:341`

#### 證據

- `remoteSettings` 含 `username`/`password`，並透過 `saveJson(...remoteSettings...)` 持久化。
- `remoteAuthToken` 會從 `localStorage` 讀取並寫回。

#### 影響（一句話）

一旦發生 XSS 或遭惡意瀏覽器擴充存取，攻擊者可直接外流長期憑證並延續帳號控制。

#### 修復建議

1. 停止將 `password` 與長期 auth token 存入 `localStorage`。
2. 改為僅記憶體保存敏感資訊，必要時重新登入。
3. 盡量改用短效 token + 旋轉機制；可行時採安全 cookie 策略。
4. 若業務必須記憶登入，提供明確風險告知與有效期限控管。

#### 誤判說明

即使在內網/桌面情境，瀏覽器端存儲仍為腳本可讀明文，風險依然成立。

---

### [VPD-SEC-004] WebSocket 以 URL Query 傳遞 Secret/Token

- 嚴重度：**High**
- OWASP 對應：A02 Sensitive Data Exposure
- CWE 對應：CWE-598（Sensitive Data in URL Query String）

#### 位置

- `src/composables/usePrintSettings.ts:295`
- `src/composables/usePrintSettings.ts:300`
- `src/composables/usePrintSettings.ts:584`
- `src/composables/usePrintSettings.ts:659`
- `src/utils/print.ts:1309`

#### 證據

- 本地/遠端 WS URL 使用 Query 參數傳遞認證資料：
  - `?key=<secretKey>`
  - `?token=<remoteAuthToken>`
- 這些 URL 直接用於 `new WebSocket(...)`。

#### 影響（一句話）

URL 中的敏感值可能透過日誌、代理、監控、除錯工具等外溢，擴大憑證暴露面。

#### 修復建議

1. 停止在 URL Query 放置認證資訊。
2. 生產環境強制 `wss://`，並在連線建立後做簽章式握手/認證。
3. 若協定支援，可改用 `Sec-WebSocket-Protocol` 承載 bearer，避免 query token。
4. 補上 token 期限、撤銷、輪替機制。

#### 誤判說明

僅 localhost 可降低外網暴露，但仍無法消除日誌/觀測系統中的洩漏風險。

---

### [VPD-SEC-005] `v-html` / `innerHTML` 注入點缺乏明確 Sanitization 契約

- 嚴重度：**Medium**
- OWASP 對應：A03 Injection
- CWE 對應：CWE-79（XSS）

#### 位置

- `src/components/layout/PreviewModal.vue:244`
- `src/utils/print.ts:821`

#### 證據

- 預覽使用 `v-html="htmlContent"`。
- 內容處理路徑支援 `container.innerHTML = content`（字串輸入）。

#### 影響（一句話）

一旦未來有不可信 HTML 進入該路徑，就可能直接形成可利用的 Stored/Reflected XSS。

#### 修復建議

1. 明確定義信任契約：僅允許內部產生 HTML。
2. 在 API 邊界拒絕任意字串 HTML，除非先經過 sanitization。
3. 導入穩定 sanitizer 流程並新增 XSS regression 測試。
4. 優先採 DOM 節點管線，降低 raw HTML 字串處理。

#### 誤判說明

目前多數內容來源為內部產生；是否可實際利用取決於未來是否允許外部/不可信 HTML 輸入。

---

## 補充（非 Runtime、偏建置鏈風險）

- `npm audit --json` 另回報 dev 依賴高風險：
  - `rollup@4.56.0`（path traversal，受影響範圍 `<4.59.0`）
  - `minimatch@9.0.5`（ReDoS，受影響範圍 `<9.0.7`）
- 這類偏 CI/建置鏈風險，不是主要瀏覽器 runtime 漏洞，但仍建議儘速修補。

---

## 建議修補優先順序

1. **P0（立即）**：移除或強隔離 `customScript` 的 runtime 執行。
2. **P0（立即）**：升級 `jspdf` 至修補版本並做相容回歸。
3. **P1（短期）**：移除 `localStorage` 內的 password/token 並輪替既有憑證。
4. **P1（短期）**：移除 WebSocket query-token，改成 `wss://` + 安全握手。
5. **P2（中期）**：強化 HTML 信任邊界並加入 XSS regression 測試。

---

## 結論

本專案功能完整、架構清楚，但目前存在 **Critical 注入面與相依套件風險**，以及 **高影響的憑證處理弱點**。建議至少先完成前 4 項修補，再評估在不可信環境中的正式上線。
