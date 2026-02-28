# Vue-Print-Designe 資安修補實作與驗證報告（2026-03-01）

## 1. 範圍與目標
本文件對應修補計畫 VPD-SEC-001 ~ VPD-SEC-005，重點是：
- 先移除 Critical / High 風險預設路徑
- 以可重複命令證明風險下降
- 確保核心列印流程仍可建置與封裝

## 2. 修補前證據（基線）
- 任意程式碼執行：`new Function(...)`
  - `src/components/elements/TableElement.vue:197`（舊）
  - `src/utils/print.ts:542`（舊）
- 高風險相依：`jspdf@^2.5.2`
  - `package.json:39`（舊）
  - `package-lock.json:2208`（舊）
- Token / Password 持久化與 Query Auth
  - `src/composables/usePrintSettings.ts:295,300,327,341`（舊）
- HTML 注入 sink
  - `src/components/layout/PreviewModal.vue:244`（舊，`v-html`）
  - `src/utils/print.ts:821`（舊，`innerHTML = content`）

## 3. 修補落地證據（修補後）

### VPD-SEC-001：`customScript` 預設關閉 + 白名單哈希
- 新增安全策略型別：`src/types/index.ts:18-25`
- 新增安全策略實作：`src/utils/securityPolicy.ts:3-47,142-147`
- `TableElement` 僅允許 policy 通過腳本：
  - `src/components/elements/TableElement.vue:204,229,502`
- 列印管線再次 policy 驗證並阻擋未授權腳本：
  - `src/utils/print.ts:505-513,561,586`

### VPD-SEC-002：`jspdf` 立即升級
- `package.json`：`jspdf` 升級為 `^4.2.0`
  - `package.json:40`
- lockfile resolved 版本：
  - `package-lock.json:2213-2215`（`jspdf-4.2.0.tgz`）

### VPD-SEC-003：敏感資訊不持久化
- 清除舊版 token key：
  - `src/composables/usePrintSettings.ts:279`
- 只持久化非敏感遠端欄位（`wsAddress/apiBaseUrl/username`）：
  - `src/composables/usePrintSettings.ts:175-179,337`

### VPD-SEC-004：WS 認證與傳輸強化
- Query Auth 預設關閉（需顯式 `allowLegacyWsQueryAuth` 才啟用）：
  - `src/composables/usePrintSettings.ts:303,309`
- 連線後 auth message（非 query）
  - 本地：`src/composables/usePrintSettings.ts:600`
  - 遠端：`src/composables/usePrintSettings.ts:677`
  - 送印流程：`src/utils/print.ts:1338,1358`
- 非 localhost 強制 `wss://`：
  - `src/utils/securityPolicy.ts:163-173`
  - `src/composables/usePrintSettings.ts:667`
  - `src/utils/print.ts:1349`

### VPD-SEC-005：HTML 注入面收斂
- 移除 `v-html` 預覽注入，改為節點 clone 插入：
  - `src/components/layout/PreviewModal.vue:20,41-47,68-72`
- `usePrint` 僅接受 `HTMLElement | HTMLElement[]`：
  - `src/utils/print.ts:25,333,821,965,1009,1311,1415,1478,1518`

### 事件與 API
- Web Component 新增 `setSecurityPolicy`：
  - `src/web-component.ts:242-244`
- `error` 事件支援 `scope: 'security'`：
  - `src/web-component.ts:196-197,234-235`

## 4. 驗證測試（風險下降證據）

### A. 安全回歸（自動化）
命令：
```bash
npm run test:security
```
結果：`Security regression check passed (13 checks).`

覆蓋重點：
- 禁止 `v-html`
- 禁止 `innerHTML = content`
- token 不落地 / 舊 key 清理
- `customScript` policy gate
- Query Auth 預設關閉
- 遠端 `wss://` 強制
- `setSecurityPolicy` 與 `security` scope 事件

測試檔案：`scripts/security-regression-check.mjs`

### B. 供應鏈驗證
命令：
```bash
npm run audit:runtime
```
結果：
- `critical: 0`
- `high: 0`
- `moderate: 0`
- `total: 0`

產物：
- `docs/security/audit-after-runtime.json`
- `docs/security/audit-comparison.md`

### C. 功能回歸（建置）
命令：
```bash
npm run build
npm run build:wc
```
結果：皆成功。

## 5. 文件更新
- 英文指南新增安全設定與遷移章節：
  - `docs/en/guide/web-components-guide.md`
- 中文指南新增安全強化與遷移章節：
  - `docs/zh/guide/web-components-guide.md`

## 6. 結論
本輪已完成計畫中 Critical / High 優先項目的程式修補，並以可重複命令驗證：
- Runtime 供應鏈高風險已清零（`high=0`, `critical=0`）
- 主要高風險入口（動態腳本、Query token、敏感持久化、HTML 注入）已預設封鎖或收斂
- 仍提供短期相容開關（預設關閉）以支援遷移
