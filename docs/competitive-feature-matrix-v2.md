# What To Eat?｜Competitive Feature Matrix V2

Status: Functional UX baseline
Purpose: establish the market baseline before final visual design.

## 1. Benchmark products

| Product | Strength to learn from | What To Eat? adoption |
|---|---|---|
| Beli | ranked restaurant lists, want-to-try / tried organization, tags, notes, favorite dishes, Taste Profile, personalized recommendations | Taste Profile, favorite dishes, restaurant ranking, user preference learning |
| Google Maps | nearby discovery, maps, saved lists, restaurant details, photos, menu / popular dishes, directions | live place data, photos, dish-level information, route/navigation, saved-place import |
| Mapstr | private personal map, tags, to-try / tried status, notes, photos, Google Maps list import | personal food database, tags, status, imports, private notes |
| MICHELIN Guide | favorites, visited, custom lists, private notes, curated discovery | favorites / visited / custom lists / private notes and high-trust curation patterns |
| OpenTable | occasion-based discovery, nearby availability, restaurant detail, booking, notifications | occasion/context discovery, actionable restaurant detail, booking link boundary |
| TheFork | preference search, geolocation, verified reviews, offers, instant booking, loyalty | availability/offers as optional enrichments; clear action after discovery |
| HappyCow | specialized filters, map-first nearby browsing, favorites/trips, offline-friendly saved places | strong filter architecture, saved-place groups, travel mode/offline consideration |

## 2. Market baseline features

A mature food decision product should not be missing these layers:

### Discovery
- nearby restaurants
- map + list
- cuisine search
- restaurant-name search
- context / occasion search
- filter by distance
- filter by price
- filter by rating
- filter by open now
- saved / favorite places
- curated / recommended places

### Restaurant detail
- real photos
- address
- phone
- opening hours
- rating
- review count
- price range
- menu link
- popular / recommended dishes
- map / navigation
- website
- reservation or booking link when available
- source / freshness indication

### Personal organization
- favorite
- want to try
- already visited / eaten
- dislike / exclude
- custom tags
- private notes
- custom lists
- import saved places

### Decision support
- compare restaurants
- personalized recommendation
- why-this-result explanation
- random / roulette decision
- restaurant + dish recommendation
- short-term skip
- permanent blacklist
- final explicit decision action

### Long-term value
- taste profile
- decision statistics
- food/category statistics
- favorite restaurant statistics
- favorite dish statistics
- weekly / monthly / yearly trends
- recommendation acceptance rate
- decision time
- re-roll / rejection behavior

## 3. What To Eat? differentiators

The product should not stop at market parity.

### A. Decision-first UX
Other products primarily help users search or save restaurants.
What To Eat? must answer:
> “I do not want to keep searching. Help me decide.”

### B. Restaurant + dish recommendation
Final output should be:
- restaurant
- recommended dish / combination
- why this dish fits now

### C. Explainable recommendation
Every recommendation should explain the most important reasons:
- cuisine affinity
- distance
- budget fit
- open now
- rating confidence
- recent eating pattern
- context
- blacklist / repeat-avoidance rules

### D. Decision Session analytics
Track the decision process rather than just a historical log.

Start:
- user activates one of the four home decision modes.

Stop:
- user explicitly confirms “今天就吃這家 / 就吃這個”.

Pause:
- app goes to background for a meaningful period.

Abandon:
- no completed decision within the timeout window.

Statistics:
- average active decision time
- median active decision time
- fastest decision
- slow decisions
- abandoned decisions
- number of candidate restaurants considered
- number of rerolls
- rejection / skip rate
- first-recommendation acceptance rate

### E. Statistics, not raw history
Primary user-facing analytics:
- Top 3 cuisines
- Top 3 restaurants
- Top 3 dishes
- most-used discovery mode
- average decision time
- median decision time
- longest hesitation category
- first-choice acceptance rate
- recent food trend

Raw chronological history is a drill-down, not a bottom-navigation destination.

## 4. Bottom navigation target

Final functional IA:
1. 首頁
2. 收藏
3. 統計
4. 我的

History moves under Statistics / detail drill-down.

## 5. Final visual rule

Functional UX first.
Final visual styling occurs after:
- live data contracts
- decision flow
- compare flow
- dish model
- statistics model
- favorites / blacklist
- import
- navigation/action flow

Visual Source of Truth remains the approved Concept A–D references.
Do not treat engineering placeholders as final visual design.
