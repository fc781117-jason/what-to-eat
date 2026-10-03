# 今天吃什麼？｜Product Spec V1.0

Status: implementation baseline  
Repository: `fc781117-jason/what-to-eat`

## 1. Product positioning

「今天吃什麼？」是一個 mobile-first 美食陪伴型 PWA。

核心不是建立另一個餐廳搜尋器，而是逐步記住使用者的飲食偏好、距離、預算、用餐情境與使用習慣，讓「不知道吃什麼」這個高頻日常決策變得更快、更有趣。

## 2. Non-negotiable UX rules

1. 第一次使用先建立個人偏好，再進首頁。
2. 使用者可以選擇 Google / Apple / Email / 本機模式作為未來登入與同步入口。
3. 四套視覺風格為完整 Theme，不互相混搭。
4. 動物角色與 Theme 分離，可選不同動物或完全不要角色。
5. 動畫必須輕量、短、不卡操作，並尊重 `prefers-reduced-motion`。
6. iPhone-first，但桌面瀏覽仍需正常。
7. 所有真實餐廳、即時營業、評分、距離等資料在 Google Places 接入前不得假裝是真實即時資料。

## 3. First-run onboarding

### Step 1｜歡迎
- 建立我的口味
- 先逛逛也可以

### Step 2｜登入／同步意向
- Google
- Apple
- Email
- 本機模式

在 Supabase/OAuth 尚未接入以前，只保存「使用者希望採用的方式」，不得把 UI 行為描述成已成功登入第三方服務。

### Step 3｜基本資料與料理偏好
- 稱呼（選填）
- 喜歡的料理（複選）

### Step 4｜其他偏好
- 忌口／不喜歡
- 常見用餐情境
- 預設步行距離
- 每人預算
- 是否接受驚喜推薦

### Step 5｜介面風格
A. 可愛動物系：溫暖、療癒、陪伴  
B. 極簡清新系：乾淨、輕盈、資訊優先  
C. 活潑插畫系：年輕、色彩、有探索感  
D. 美食質感系：精緻、沉浸、食物為主角

角色：
- 貓
- 狗
- 兔
- 熊
- 無角色

## 4. Home information architecture

Primary actions:
1. 不知道吃什麼
2. 附近有什麼
3. 幫我選
4. 想吃這一類

Persistent navigation:
- 首頁
- 收藏
- 紀錄
- 我的

Home also shows:
- 使用者口味摘要
- 個人化候選
- 現行篩選條件
- PWA 加入主畫面提示

## 5. Decision logic

### Hard filters
- Open now
- Walking time
- Per-person budget
- Minimum rating

### Preference signals
- Favorite cuisines
- Dining contexts
- Surprise preference

V1 demo only uses hard filters + cuisine affinity for recommendation ordering. Avoidances are stored now so live restaurant/dish metadata can use them later.

## 6. Core flows

### 不知道吃什麼
Candidate pool -> hard filters -> animated random selection -> decision history -> restaurant detail.

### 附近有什麼
Browser geolocation -> current demo list now -> Google Places nearby search later.

### 幫我選
Up to five restaurants -> side-by-side rating / walk / budget / open state / signature dish -> user makes final choice -> history.

### 想吃這一類
Cuisine chips + free-text search -> results -> detail / favorite / compare.

## 7. Local data model

Profile:
- name
- entryMode
- email
- theme
- mascot
- favoriteCuisines
- avoidances
- diningContexts
- priceBand
- walk
- surprise
- onboardingCompleted

Other local collections:
- favorites
- compare
- decisionHistory

The code includes migration from the old V0.1 theme IDs:
`cute / clean / izakaya / future / auto`
into:
`animal / minimal / foodie / illustrated`.

## 8. Motion system

Allowed:
- mascot float
- onboarding stage transition
- theme selection feedback
- card press feedback
- roulette movement
- small sparkle/bubble motion

Avoid:
- long blocking animations
- constant high-motion backgrounds
- navigation delays
- animations that reduce legibility

## 9. Live integration boundaries

### Google Places / Maps
Required later for:
- real nearby restaurants
- current open state
- ratings / review metadata
- place details
- directions / map context

### Supabase Auth
Planned providers:
- Google
- Apple
- Email

### Supabase sync
Planned persisted user data:
- profile/preferences
- favorites
- history
- exclusions
- theme/mascot

Guest/local mode remains supported.

## 10. Deployment policy

- Feature work occurs outside `main`.
- Pull requests must pass `npm run build`.
- Preview validation occurs before Production.
- Production is not changed automatically in this phase.
- Paid resources/APIs are not enabled without explicit confirmation.
