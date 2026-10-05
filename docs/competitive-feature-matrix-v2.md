# What To Eat?｜Competitive Feature Matrix V2

Status: Functional UX baseline
Purpose: establish the market baseline before final visual design.

## 1. Benchmark products

Checked 2026-10-05 against first-party product/help pages. A checkmark below means that the official product describes the capability; a blank cell is not a claim that a competitor lacks it.

| Product / official evidence | Discover / filter | Save / notes | Decide / act | Lesson for V2 |
|---|---|---|---|---|
| [Resy Discover](https://blog.resy.com/newsroom/resy-launches-discover-tab/) · [Lists](https://blog.resy.com/newsroom/resy-launches-shareable-lists/) | curated lists, context | shareable lists | reservation, Notify | discovery should lead to an action |
| [Tabelog app](https://tabelog.com/appli_campaign) | map, name, available seat | saved lists, notes | reservation | photos/reviews and actual availability reduce uncertainty |
| [Rakuten Gurunavi](https://gurunavi.com/en/all) | area, cuisine, restaurant | — | booking and course | show decision facts before booking |
| [Tripadvisor My Trips](https://no.tripadvisor.com/pages/savesfaq.html) | restaurants and trips | trip saves | trip planning | organize saved places by context |
| [EZTABLE](https://www.eztable.com/app/?locale=en_US) | restaurant and reviews | — | reservation, rewards | Taiwan booking action is a distinct provider boundary |
| [愛食記](https://www.ifoodie.tw/) | local discovery and reviews | food collection | restaurant exploration | localized discovery and collection matter |
| [MICHELIN Guide](https://guide.michelin.com/us/en/article/news-and-views/michelin-guide-app-features) | curated places | favorites, visited, lists, notes | feedback / share | personal database must survive a single decision |
| [Yelp partner docs](https://docs.developer.yelp.com/docs/overview-1) | — | — | partner waitlist | waitlist requires provider integration; public consumer pages unavailable during this review |

These expand the original Beli, Google Maps, Mapstr, OpenTable, TheFork and HappyCow baseline below. We did not infer that any listed service offers What To Eat?'s timed decision session.

## 1a. Market baseline → V2 implementation

| Capability | Market pattern | Current V2 | Remaining gate |
|---|---|---|---|
| Four decision entrances | discovery, nearby, context | functional | live data |
| Map / list | Tabelog, Google Maps | GPS map of user location + separate Demo list | licensed Google Map with live place pins |
| Rich detail and action | Google Maps, Gurunavi, EZTABLE | Demo detail, call/map/menu when sourced | Places photos, real fields, booking partner |
| Personal database | Resy, MICHELIN, Mapstr | favorites, to try, visited, tags, private notes, lists; local only | cloud sync, import |
| Compare 2–5 | evidence from multiple providers | swipe cards and preference winner on Demo | live search, URL resolver, confidence |
| Restaurant + dish | menus and dish photos | typed dishes and explicit dish confirmation; Demo menu only | trusted menu/photos and price provenance |
| Decision measurement | What To Eat? distinction | active vs elapsed, abandon, candidate/event counts | cross-device continuity |
| Post-decision action | booking, navigation | navigation, call if present | live booking / availability |

## 1b. Missing feature backlog

| Priority | Feature | Acceptance evidence | Dependency |
|---|---|---|---|
| P0 | Google Places nearby/detail/photos + Google map attribution | real restaurants, source/freshness, non-fabricated fields | cost approval, keys, quota and policy review |
| P0 | Reverse Geocoding and walking Routes | actual address and walking duration labeled by source | same cost gate |
| P1 | URL resolver and text search | known Place ID, long and short URLs resolve; ambiguous links rejected | guarded server proxy and quota |
| P1 | Menu/dish ingestion | source, freshness, menu photo and price evidence for each item | licensed restaurant/provider data |
| P1 | Cloud persistence and import | saved records survive a new device; Google list import only with permission | auth, database, import API terms |
| P2 | Booking, offers, waitlist | deep link or integration from verified provider | commercial partnership |
| P2 | Social sharing and offline saved places | links and offline access under source rights | permissions and content licenses |

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
