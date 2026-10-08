# Google Places Preview 接入檢核

本文件只針對 `feature/v2-functional-ux` 的受保護 Preview。Production 維持 HOLD。

## 已完成的程式準備

- 搜尋與 Place ID 詳情透過 Next.js 伺服器路由呼叫 Places API (New)，金鑰不會送到瀏覽器。
- `GOOGLE_PLACES_LIVE_ENABLED` 預設關閉。`GOOGLE_PLACES_FIELD_TIER=pro` 只請求名稱、地址、位置、類型與 Google Maps 網址；評分、評價數、價格級距、營業狀態須另外核准 Enterprise 欄位。
- GPS 搜尋在回應後檢查實際直線距離；手動地區不宣稱公里半徑。
- API 回應標示 `Cache-Control: no-store`，Service Worker 排除 API 與外部網域，不保存 Places 回應。
- Google Maps 資料顯示來源標示。沒有可信來源的菜單與步行路線不造值。

## Google Cloud 端需由專案擁有者完成

1. 選擇專用的 Google Cloud 專案與計費帳戶，確認費用由誰承擔。啟用 **Places API (New)**，不必啟用舊版 Places API、Maps JavaScript API 或 Geocoding API。本階段的 GPS 來自瀏覽器。
2. 在 Google Maps Platform Credentials 建立一把**僅供這個伺服器使用的新金鑰**。API restriction 僅允許 **Places API (New)**；不可使用既有前端金鑰，也不要把金鑰貼到對話、GitHub 或 `NEXT_PUBLIC_` 變數。
3. 伺服器金鑰理想上應有來源 IP restriction。Vercel 預設動態出口 IP 不適合填一個猜測的固定 IP；若要完整來源 IP 限制，需先確認固定出口方案及其費用。若只能採 API restriction，則要承認這是較弱的防護，限制在受保護 Preview 試用並監看用量。
4. 在 Google Maps Platform Quotas 分別查看 **Nearby Search (New)**、**Text Search (New)**、**Place Details (New)** 的每分鐘配額，調到足夠小的試用值；設定計費預算通知與用量警示。預算通知不是硬性停用上限，配額能否調降及實際上限應在該專案回讀確認。
5. 正式啟用前確認 Google Maps Platform 的顯示、歸屬與公開隱私／使用條款要求。對外公開網站仍需額外驗收。

## Vercel Preview 專案變數

在 `what-to-eat` 專案的 **Preview** 環境，盡量限定 `feature/v2-functional-ux` 分支：

| 變數 | 值 | 保護 |
| --- | --- | --- |
| `GOOGLE_PLACES_API_KEY` | Google Cloud 新建的 Places API (New) 金鑰 | Sensitive/Encrypted；只限伺服器，不貼在聊天或程式碼 |
| `GOOGLE_PLACES_FIELD_TIER` | `pro` | 初期維持 Pro，不請求 Enterprise 欄位 |
| `GOOGLE_PLACES_LIVE_ENABLED` | 先 `false`，完成下列核對後才改 `true` | 僅 Preview；Production 不設定 |

環境變數更新後需重新部署功能分支，舊部署不會自動取得新值。

## 啟用後驗收

1. `/api/places/search?lat=25.0478&lng=121.517&radius=1000` 回傳 `source: "google"` 與真實 Place ID，資料在半徑內且 `Cache-Control: no-store`；測試座標只是台北車站附近的公開位置。
2. 手動地區搜尋回傳對應行政區店家，介面不顯示虛構步行時間、價格或菜單。
3. 比一比貼入帶 `query_place_id` 的完整 Google Maps 網址，確認地址後才加入；不將同名分店自動視為同一家。
4. 檢查 Google Cloud 每種方法的請求數與費用、Vercel Preview 的錯誤紀錄。若超出預期，先改 `GOOGLE_PLACES_LIVE_ENABLED=false` 並重新部署。

官方參考：[Places API (New) 設定](https://developers.google.com/maps/documentation/places/web-service/get-api-key)、[計價與欄位遮罩](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)、[金鑰防護](https://developers.google.com/maps/api-security-best-practices)、[顯示政策](https://developers.google.com/maps/documentation/places/web-service/policies)。
