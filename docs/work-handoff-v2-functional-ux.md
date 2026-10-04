# WORK HANDOFF｜What To Eat? V2 Functional UX

請接續既有專案，不要重建 Repository。

Repository:
fc781117-jason/what-to-eat

Current working branch:
feature/v2-functional-ux

Base chain:
main
→ feature/v1-personalized-onboarding-themes
→ feature/v2-functional-ux

Current Draft PR:
#4 V2｜Functional UX、競品基線與 Decision Session

Production:
HOLD。未經使用者明確核准不得合併 main、不得正式發布。

==================================================
一｜本輪最高目標
==================================================

把「今天吃什麼？」從 Functional Prototype 升級成成熟的 Functional UX。

本輪優先：
1. 市場基本功能對齊。
2. 資訊架構與 UX Flow 成熟。
3. 真實資料層與資料可信度。
4. Decision Session / Statistics 正確。
5. Restaurant + Dish 雙層推薦。
6. 比較、收藏、黑名單、匯入、導航等完整行動鏈。
7. Final Visual Design 暫後，避免反覆重做。

不要把工程 Placeholder 視為正式商用 UI。

==================================================
二｜視覺治理
==================================================

已核准的 Concept A–D 圖片是未來 Final Visual Source of Truth：

A. Cute Playful
B. Clean Modern
C. Izakaya Warm
D. Dynamic Futuristic

使用者已明確不接受：
- iPhone / OS emoji 當正式 Mascot
- 只換顏色就稱為不同 Theme
- 工程感很重的陽春卡片當成最終 UI

正式視覺階段才集中處理：
- 原創布偶貓
- 手繪雪納瑞
- 長毛兔
- 白狐狸
- App icon
- 插畫
- Motion system
- typography
- Design System
- Concept A–D 的高擬真重製

目前 Functional UX 階段只需要確保：
- 資訊層級
- 元件位置
- 操作流程
- 行為邏輯
- 手機可用性
正確。

==================================================
三｜必讀專案文件
==================================================

開始前完整讀取：
1. docs/competitive-feature-matrix-v2.md
2. docs/functional-ux-master-v2.md
3. docs/product-spec-v1.5.md
4. docs/product-spec-v1.0.md
5. lib/decision-session.ts
6. lib/analytics.ts
7. app/v15-client.tsx
8. lib/product.ts
9. lib/recommendation.ts
10. .github/workflows/ci.yml
11. .github/workflows/preview.yml

不要重新發明已定義規格。

==================================================
四｜競品 Benchmark
==================================================

已完成第一輪官方資料盤點，至少包含：

1. Beli
核心可借鑑：
- ranked restaurant lists
- want to try / tried
- tags
- notes
- favorite dishes
- Taste Profile
- personalized recommendation
- friend Match Score

2. Google Maps
核心可借鑑：
- nearby discovery
- map/list
- saved lists
- photos
- restaurant detail
- menu / popular dishes
- directions
- place data

3. Mapstr
核心可借鑑：
- personal map
- tags
- to try / already tested
- notes
- photos
- Google Maps list import
- external-file import

4. MICHELIN Guide
核心可借鑑：
- Favorites
- Visited
- Custom Lists
- Private Notes
- curated discovery
- community/favorite signals

5. OpenTable
核心可借鑑：
- occasion discovery
- nearby availability
- restaurant profile
- reservation action
- notifications
- reward/action continuity

6. TheFork
核心可借鑑：
- geolocation
- verified reviews
- offers
- instant booking
- loyalty
- preference-based discovery

7. HappyCow
核心可借鑑：
- specialized filters
- nearby map
- favorites
- trips
- offline saved places
- trusted review decision support

請再擴大 Benchmark，但優先官方資料與目前仍維護的產品。
可增加：
- Resy
- Tabelog
- Gurunavi
- Tripadvisor
- Yelp（若官方頁可存取）
- Dine / local discovery products
- 台灣在地美食平台
- Google Maps Taiwan-specific user behavior

目標不是抄 UI，而是建立：
Competitive Feature Matrix
→ Market Baseline
→ What To Eat? Differentiators
→ Missing Feature Backlog

==================================================
五｜產品核心定位
==================================================

產品不是另一個餐廳搜尋器。

核心問題：
「我不知道吃什麼，不想再一直搜尋，請幫我做決定。」

產品流程：
Understand me
→ Discover
→ Reduce choices
→ Explain
→ Decide
→ Act
→ Remember
→ Learn

==================================================
六｜資訊架構
==================================================

底部 Toolbar 最終只保留：
1. 首頁
2. 收藏
3. 統計
4. 我的

「紀錄」不是 Bottom Tab。

Raw History：
Statistics → 查看詳細紀錄
才進入。

==================================================
七｜首頁
==================================================

首頁是 Decision Launchpad。

四個主要入口：
1. 不知道吃什麼
2. 附近有什麼
3. 幫我選
4. 想吃這一類

快速篩選：
- 距離 / 步行時間
- 每人預算
- 評分
- 現在營業

可保留：
- 1–3 個 For You
- 目前區域
- 個人偏好摘要

不要做成資訊 Feed。

==================================================
八｜Decision Session
==================================================

這是本輪重要驗收項。

Start：
使用者從首頁點入任一決策模式的瞬間。

Continue：
- 搜尋
- 篩選
- 重抽
- 餐廳詳細
- 菜單
- 比較
- 切換候選
全部屬同一次 Session，不重新計時。

Pause：
App 進背景時暫停 active time。
回前景繼續。

Stop：
只有明確點：
- 今天就吃這家
- 就吃這個餐點
才 Completed。

Abandon：
- 回首頁未完成
- inactivity timeout
- 主動取消
記 abandoned。

平均決策時間只能使用 Completed Session 的 Active Time。

同時要算：
- median active time
- fastest
- >5 min
- >10 min
- abandonment rate
- candidate count
- reroll count
- skip count
- permanent exclusion
- filter changes
- detail views
- dish detail views
- first-choice acceptance

==================================================
九｜Restaurant + Dish 雙層推薦
==================================================

不要只推薦：
「去 A 餐廳」

應可輸出：
「去 A 餐廳，推薦點 X 餐點」

Dish model 至少需：
- id
- restaurantId
- name
- category
- price
- photo
- popularity
- source
- source freshness
- user likes/dislikes
- order/selection count
- recommendation evidence

沒有可信菜單來源不得虛構價格。

==================================================
十｜Restaurant Detail
==================================================

三層模型：

Layer 1 Identity / Confidence
- photos
- name
- cuisine
- Google rating
- review count
- open/closed
- next close/open
- walking distance/time
- price
- address
- phone
- map
- website
- booking
- menu

Layer 2 Decision Support
- personal match score
- why recommended
- strengths
- drawbacks
- review summary
- hygiene / recurring-warning signals
- suitable contexts
- source label

Layer 3 What to order
- popular dishes
- recommended dishes
- first-visit combo
- dish images
- trusted menu prices
- source + freshness

==================================================
十一｜Compare
==================================================

輸入：
1. App 內加入
2. 店名搜尋
3. Google Maps URL
4. 後續支援 Google Maps Saved List Import

最多五家。

手機不要使用超寬 Spreadsheet。

使用：
Swipeable Compare Cards
＋ Summary / Winner

比較：
- photo
- rating/review count
- distance
- walk
- price
- open state
- cuisine
- signature dishes
- strengths
- recurring complaints
- personal match
- best-for context

最後要明確給：
Recommended Winner
＋ 2–3 理由
＋ final choice button

==================================================
十二｜Personal Food Database
==================================================

至少：
- 收藏
- 想吃
- 吃過
- 這次不要
- 永久不喜歡
- custom tags
- private notes
- custom lists

未來：
- share list
- Google Maps import

==================================================
十三｜Statistics
==================================================

Period：
- 週
- 月
- 年
- 全部

Top-level：
- 完成決策
- 平均 Active Decision Time
- Median Decision Time
- First-choice Acceptance
- Slow Decision Count
- Abandonment Rate

Rankings：
- Top 3 cuisines
- Top 3 restaurants
- Top 3 dishes
- most-used mode

可往下點排名看：
- 次數
- 比例
- 趨勢
- 更完整排行榜

Raw chronological history 不要放主要視圖。

==================================================
十四｜資料可信度
==================================================

所有資料需明確分類：
- Google
- restaurant official
- booking provider
- user-provided
- AI summary
- AI estimate
- demo

禁止：
- Demo 冒充 Google
- AI 猜菜單價格
- AI 推論冒充可驗證事實

==================================================
十五｜真實資料整合
==================================================

優先研究與實作：

P0:
- Google Places
- Google Place Photos
- current opening hours
- address / phone / rating / review count
- Maps URL
- Routes / walking duration
- reverse geocoding

P1:
- Google Maps URL resolver
- dish/menu ingestion
- compare engine
- statistics

P2:
- Supabase / equivalent cloud sync
- Google / Apple / Email auth
- tags / notes / lists
- Google Maps list import

Server-only API key 不得進 Client 或 GitHub。

保持 Free-first。
任何可能產生費用的 API / Cloud 設定：
先提出成本、Quota、Hard Cap 方案，再等使用者核准。

==================================================
十六｜本輪實作順序
==================================================

請自主連續完成，避免每一步詢問：

1. 讀取 Repo + 上述 docs
2. Benchmark 補查
3. 更新 Competitive Matrix
4. 建立 Missing Feature Backlog
5. Alignment Audit
6. Decision Session 完整接入
7. Bottom Nav → 4 tabs
8. Raw History → Stats drilldown
9. Stats schema 完成
10. Dish model
11. Restaurant detail contract
12. Compare contract
13. Favorites / blacklist / status
14. Live-data adapter boundary
15. Google Maps URL resolver architecture
16. Build + tests
17. Preview
18. Browser / mobile functional QA
19. 報告剩餘 blockers

不要在本輪花大量時間重畫 Mascot 或 Final Visual Skin。

==================================================
十七｜驗收
==================================================

必須回報：
- Branch / commit
- files changed
- build result
- test result
- preview URL
- completed features
- missing features
- data sources
- API blockers
- cost / credential blockers
- Production HOLD status

所有未完成必須明確說明。

Final Visual Concept A–D 直到 Functional Prototype 通過後才進行正式重製。
