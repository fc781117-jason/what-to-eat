# What To Eat? — V1.5 Prototype → Product

## Confirmed product changes

### Mascot family
- 布偶貓
- 手繪感雪納瑞
- 長毛兔
- 白色狐狸
- 無角色

The UI now uses original vector components instead of OS animal emoji.

### Bottom navigation
Five persistent tabs:
1. 首頁
2. 收藏
3. 統計
4. 紀錄
5. 我的

### Statistics
Period filters:
- 週
- 月
- 年
- 全部

Metrics:
- completed food decisions
- candidate restaurant count
- average decision time
- fastest decision
- decisions over 10 minutes
- most selected cuisine
- most selected restaurant
- discovery source mix

Decision timing starts when the user enters a decision workflow and ends on the explicit final action 「今天就吃這家」.

### Trust layer
Restaurant information explicitly labels its source.
Current static Preview restaurant records remain Demo data.
The UI no longer presents Demo data as if it were live Google data.

Restaurant detail contains:
- horizontal photo/gallery surface
- rating + review count
- walking time and distance
- per-person budget
- dynamically calculated Demo open/closed state
- address
- phone placeholder when unavailable
- Google Maps action
- menu section
- first-visit suggestions
- review / hygiene summary
- source badges

Google Places photos and live fields replace the same surfaces when live integration is enabled.

### Roulette
- full reel surface
- visible motion state
- weighted recommendation
- this-time skip
- permanent dislike / exclude
- detail before final decision
- explicit final decision action

### Compare
Mobile no longer uses the wide sticky spreadsheet table.
V1.5 uses:
- restaurant name / Google Maps URL input fields
- + add another restaurant
- up to five candidates
- horizontally swipeable comparison cards
- explicit final decision action

Long Google Maps URLs that contain a matching Demo restaurant can already be parsed in Preview.
Short URL / Place ID resolution is reserved for the Place Proxy integration.

### Location
Browser GPS now resolves to a human-readable nearby address:
1. Google reverse geocoding when a configured browser key exists.
2. OpenStreetMap reverse geocoding as a Preview fallback.
3. Raw GPS only if both reverse-geocoding sources fail.

The UI shows GPS accuracy and address source.

### Install guide
- iOS instruction
- Android instruction
- hidden when running in standalone PWA mode

### Theme contract
All themes keep the same product information architecture.
They do not mix presentation systems.

A｜可愛動物系
- rounded cards
- soft illustrated companion treatment

B｜極簡清新系
- flatter cards
- more whitespace
- reduced decoration

C｜活潑插畫系
- stronger color blocks
- editorial offset / playful treatment

D｜美食質感系
- dark food-first treatment
- larger immersive gallery
- serif-like hero typography

## Live data gate

Static Preview remains safe and testable without secrets.

The following need a live server/runtime before becoming authoritative:
- Google Places details
- Google photos
- live phone/address/rating/review count
- Google Maps URL short-link / Place ID resolution
- route-based walking duration
- cloud auth and sync

Suggested production boundary:
- public browser Maps key: referrer-restricted
- server Places key: server-only
- server resolver: Vercel route / equivalent
- no secret committed to GitHub

## Production rule
Production remains HOLD until:
1. UI / UX Preview accepted by user.
2. live data sources connected.
3. mobile verification complete.
4. explicit production approval is given.
