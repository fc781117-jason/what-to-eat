# What To Eat? V2｜Functional UX execution checkpoint

Date: 2026-10-05. Branch: `feature/v2-functional-ux`. Base HEAD before work: `87c2b2b0d79fee49779cc86e81a5f5154f8564e1`. Production HOLD.

## User story and boundaries

Home starts one decision session → filter, roulette, nearby, compare and detail keep the same session → the user explicitly picks a restaurant or dish → completed session, history and personal database update → Statistics measures successful active time and abandonment separately. A navigation away from the decision flow abandons the session. Background time is paused. A closed page stores a paused checkpoint; reopening resumes or marks a stale session abandoned.

## Functional alignment and limitations

| Area | Implemented in this checkpoint | Boundary |
|---|---|---|
| Decision timing | actual candidate impressions, detail/dish views, filter changes, reroll, skip, exclusion, pause, resume, inactivity and abandon | local browser state; no cross-device timing |
| Roulette | unknown cuisine → cuisine choice → restaurant/dish; known cuisine → restaurant/dish; reroll/skip/exclude/favorite/final pick | Demo dishes and restaurants |
| Bottom navigation | four tabs; history behind Statistics | existing visual skin only |
| Statistics | active mean/median/fastest, elapsed mean, 5/10-minute counts, abandonment, first choice, Top 3 and detail drilldown | selection counts, not verified actual meals |
| Saved places | favorite, to try, visited, blacklist restore, tags, notes, custom lists | local storage; may be lost on browser reset |
| Compare | up to five swipe cards, preference winner, reasons and final pick | Demo data; URL without match is not invented |
| Nearby | human-readable GPS address, accuracy, manual area label, user location map and separate Demo list | no fabricated Demo pins or walking routes |
| Restaurant/dish detail | source labels, confidence gaps, source-classified explanation, selectable dishes and final dish action | no real photos, menu verification, reviews/hygiene evidence |

### Data schema

`DecisionSession`: id, mode, status, startedAt, lastActiveAt, lastInteractionAt, activeMs, paused/completed/abandoned timestamps, unique candidate IDs, event counts, final restaurant/dish ID. `HistoryEntry`: selected restaurant, cuisine, source mode, time, active decision seconds, candidate count and optional dish. `Dish`: dishId, restaurantId, name, category, optional price/photo/popularity, source/freshness, likes/dislikes/selection count, recommendation evidence. `RestaurantDetail` is split into identity, decision support and dishes. `Evidence` explicitly separates fact, preference and inference.

### Google data adapter and Maps URL resolver

The typed `RestaurantDataAdapter` in `lib/functional-data.ts` defines nearby, detail, walking route and URL resolution responses, with source and retrieval time. There is **no enabled live API call** in this round.

After cost approval, a server-only proxy must validate coordinates/radius and requested fields, use a server key, call [Nearby Search (New)](https://developers.google.com/maps/documentation/places/web-service/nearby-search), [Place Details and Photos](https://developers.google.com/maps/documentation/places/web-service/overview), [Geocoding](https://developers.google.com/maps/documentation/geocoding/overview) and [Routes walking](https://developers.google.com/maps/documentation/routes/compute_route_directions) with narrow field masks, then map them into the contract. Browser map key must be referrer-restricted, server key service-restricted and kept out of GitHub. User favorites should persist a Google Place ID and user-authored metadata only; fresh Google fields must be refetched subject to [Places policies](https://developers.google.com/maps/documentation/places/web-service/policies).

URL resolution pipeline: (1) parse and allowlist official Google Maps hosts; (2) accept `query_place_id`/`place_id` directly; (3) parse long `/place/` and text query into search input, not a claimed match; (4) for `maps.app.goo.gl`, a **server-only** bounded redirect resolver validates every hop and rejects private or unrelated hosts; (5) retrieve candidate Place IDs with Places Text Search, ask user to disambiguate when necessary; (6) retrieve fresh place details. No arbitrary URL fetch from a user input. The current UI clearly reports that short links and Place IDs require the disabled proxy.

### Provenance policy

Google, official restaurant, booking provider, user, AI summary, AI estimate and Demo are distinct types. AI estimates are never treated as official menu prices. Demo prices remain explicitly labeled Demo. A missing trusted price reads「價格尚無可信來源」. A current map using OpenStreetMap displays only the user's GPS point; displaying Google Places results on a map later requires a Google Map and attribution. Review and hygiene claims require evidence; missing evidence is displayed as unavailable.

## Cost gate — no resource enabled

Google's [global price list](https://developers.google.com/maps/billing-and-pricing/pricing) checked 2026-10-05 lists these monthly free usage caps and first paid tier in USD per 1,000 billable events. **Field choice can move a request to a higher SKU**. These figures are planning inputs and must be rechecked before activation.

| SKU example | Monthly free usage | First paid tier / 1,000 |
|---|---:|---:|
| Places Nearby Search Pro | 5,000 | US$32 |
| Places Place Details Pro | 5,000 | US$17 |
| Places Text Search Pro | 5,000 | US$32 |
| Geocoding | 10,000 | US$5 |
| Routes Compute Routes Essentials | 10,000 | US$5 |

Proposed first controlled trial: a separate billing project, quota per API at or below **100 calls/day and 1,000/month**, server-side application rate limit, disabled by default, budget alerts and manual kill switch. These quotas are a proposed ceiling, not an already configured hard spending cap: Google budgets/alerts alone are not a guaranteed financial hard limit. Before enabling anything, confirm actual billing account, API-specific quota configuration, price SKUs for the exact field masks and media, an enforceable stop mechanism, data display/attribution, and the user's explicit cost authorization. No keys were added.

## Remaining acceptance gates

1. Real Places, route durations, photos, map pins, menu and booking remain blocked by credential/cost/provider authorization.
2. Cloud sync (Google/Apple/email authentication, database, import) requires a chosen provider, account and cost plan.
3. Final Concept A–D commercial visual is a separate phase after functional acceptance.
4. Production remains HOLD until user mobile acceptance and explicit publish approval.

## Delivery verification

Local TypeScript check, six behavior tests and static Preview export passed. The initial implementation was committed as `9bc40dd783930f1655c7ccfca6e98d90a56a5aa0`; CI run `37299063589` and Preview run `37299063584` both passed, and `preview-static` contains an export built from that SHA. Subsequent direct-detail entry and documentation corrections require fresh CI/Preview confirmation on their final commit. The repository reports `has_pages: false`: publishing to the `preview-static` branch is an artifact, not an interactive hosted URL. The cloud browser blocked localhost, so mobile browser QA is not yet a pass. Do not enable Pages production deployment as a workaround; no production deployment is authorized.
