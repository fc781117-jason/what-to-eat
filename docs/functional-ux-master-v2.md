# What To Eat?｜Functional UX Master V2

## 0. Product mission

Make the high-frequency question “今天吃什麼？” faster, more trustworthy and more enjoyable.

The product should:
1. understand the user,
2. discover suitable choices,
3. reduce choices,
4. explain recommendations,
5. help the user make a final decision,
6. remember the result,
7. become better over time.

## 1. Primary information architecture

### Bottom navigation
- 首頁
- 收藏
- 統計
- 我的

### Secondary / contextual screens
- Nearby discovery
- Roulette
- Category search
- Compare
- Restaurant detail
- Dish detail
- Final decision / departure
- Stats detail
- Saved list detail
- Settings
- Blacklist / exclusions

## 2. Home

Home is a decision launchpad, not a feed.

Primary modes:
1. 不知道吃什麼
2. 附近有什麼
3. 幫我選
4. 想吃這一類

Persistent quick filters:
- walking time / distance
- per-person budget
- minimum rating
- open now

Home may also show:
- 1–3 personalized “For You” recommendations
- current area
- recent preference summary

## 3. Decision Session

### Start trigger
A Decision Session starts at the moment the user enters a decision workflow from Home:
- roulette
- nearby
- compare
- category search

### Continue
The same session continues through:
- filtering
- restaurant detail
- menu browsing
- comparing
- rerolling
- changing cuisine
- opening another restaurant

Do not reset the timer just because the screen changes.

### Stop
The session ends only when the user explicitly confirms a final choice:
- 今天就吃這家
- 就吃這個餐點

### Pause
When the app goes to background:
- pause active-decision timing after a short grace period
- resume when the app becomes active again

### Abandon
A session is abandoned when:
- user leaves without a final decision and inactivity exceeds timeout
- or the user explicitly cancels

Abandoned sessions are not included in “average successful decision time”, but should count toward abandonment analytics.

### Metrics
- active duration
- total elapsed duration
- candidate count
- restaurant-detail views
- dish-detail views
- reroll count
- temporary skips
- permanent exclusions
- filter changes
- final restaurant
- final dish
- source mode

## 4. Roulette

### Unknown cuisine
Two-stage visual decision:
1. food/cuisine reel
2. restaurant + dish reel

### Known cuisine
One-stage:
- restaurant + dish reel

### Result actions
- 看詳細
- 今天就吃這家 / 這個
- 再抽一次
- 這次不要
- 不喜歡，以後不要推薦
- 收藏

No result should immediately force navigation away from the roulette result.

## 5. Nearby

### Location
Show:
- human-readable area/address
- accuracy
- manual change option

### Results
Map + list modes.
Each card should show:
- image
- name
- cuisine
- Google rating + review count
- open/closed
- walking time + distance
- price
- 1–2 recommendation reasons

## 6. Search / category

Inputs:
- cuisine
- restaurant
- dish
- keyword
- context/occasion

Examples:
- 牛肉麵
- 約會
- 宵夜
- 一個人
- 下雨天
- 300元內

## 7. Restaurant detail — three-layer model

### Layer 1｜Identity / confidence
Immediately show:
- photo gallery
- restaurant name
- cuisine/category
- rating + review count + source
- open/closed + next close/open time
- walking time + distance
- estimated per-person price
- address
- phone
- Google Maps / website / booking / menu actions

### Layer 2｜Decision support
- personalized match score
- why recommended
- strengths
- potential drawbacks
- review summary
- hygiene / recurring-warning signals with source label
- context fit

### Layer 3｜What should I order?
- popular dishes
- favorite dishes
- recommended first-visit combo
- dish images
- menu prices only from trusted sources
- dish-level source/freshness

## 8. Dish model

Each dish should support:
- name
- category
- price
- photo
- popularity
- recommendation evidence
- source
- source freshness
- user likes/dislikes
- order count
- restaurant relation

Recommendation output can therefore be:
> Restaurant A → Dish X

instead of only:
> Restaurant A

## 9. Compare

Input methods:
1. add from internal restaurant cards
2. search by name
3. paste Google Maps URL
4. later: import saved Google Maps list

Comparison dimensions:
- image
- rating/review count
- distance
- walking time
- price
- opening status
- cuisine
- signature dishes
- review strengths
- recurring complaints
- personal match
- “best for” explanation

Mobile UX:
- swipeable restaurant comparison cards
- not a wide desktop spreadsheet

Final output:
- recommended winner
- 2–3 reasons
- explicit final choice action

## 10. Favorites / personal food database

Statuses:
- 收藏
- 想吃
- 吃過
- 不喜歡

Optional:
- custom tags
- private notes
- custom lists
- share list
- import list

## 11. Statistics

Top-level period selector:
- 週
- 月
- 年
- 全部

Primary cards:
- completed decisions
- average active decision time
- median decision time
- first-choice acceptance rate
- slow-decision count

Rankings:
- Top 3 cuisines
- Top 3 restaurants
- Top 3 dishes
- most-used mode
- most rejected cuisine / place type (only if useful)

Trend:
- cuisine share
- restaurant repeat rate
- decision time trend
- recommendation acceptance trend

Raw history:
- hidden under “查看詳細紀錄”
- not a bottom-tab destination

## 12. Trust / provenance

Every non-obvious field must have a provenance class:
- Google
- official restaurant source
- booking platform
- user-provided
- AI summary
- AI estimate
- demo

Never display Demo as Google.
Never fabricate menu prices.
Never present AI inference as verified fact.

## 13. Integration priorities

P0
- real Places restaurant data
- real photos
- real open status
- route-based distance / walking duration
- restaurant detail actions
- decision session engine

P1
- Google Maps URL resolver
- dish/menu model
- compare engine
- blacklists
- statistics

P2
- cloud sync
- Google/Apple/email auth
- custom lists
- notes/tags
- import Google Maps list

P3
- reservations / offers where provider integration allows
- social/friend taste features
- sharing

## 14. Development sequence

1. freeze Functional UX Master
2. build Decision Session instrumentation
3. build live restaurant data adapter
4. build dish model
5. build restaurant detail
6. build compare
7. build stats
8. build favorites/exclusions/import
9. functional prototype QA
10. final Concept A–D visual rewrite
11. mobile QA
12. production gate

## 15. Final visual phase

Do not spend major effort polishing placeholder mascots or engineering cards before functional QA.

At visual phase:
- rebuild components to approved Concept A–D
- use actual illustration assets
- consistent mascot family
- real photo art direction
- motion system
- app icons
- typography and spacing system
