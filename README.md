# What To Eat?｜今天吃什麼？

Mobile-first food discovery and decision PWA.

## V1 product direction

The app is designed as a lightweight food companion that remembers how a person likes to eat, rather than only being a restaurant search screen.

### First-run flow
1. Welcome
2. Choose sign-in/sync intention (Google / Apple / Email / local guest)
3. Build food preferences
4. Set practical preferences (avoidances, dining context, walk time, per-person budget, surprise recommendations)
5. Choose one complete visual theme and an optional mascot

### Four independent themes
- A｜可愛動物系
- B｜極簡清新系
- C｜活潑插畫系
- D｜美食質感系

Themes are never automatically mixed. Mascot selection is independent and supports no mascot.

### Main modes
- 不知道吃什麼
- 附近有什麼
- 餐廳超級比一比
- 想吃這一類
- 收藏
- 選餐紀錄
- 個人設定

## Current implementation

This repository currently includes:
- Next.js 16 App Router
- iPhone-first responsive UI
- PWA manifest + service worker
- Local persistence for profile, favorites, comparisons, and decision history
- Migration from the earlier V0.1 theme/profile shape
- Server-only Google Places (New) search adapter with an explicit enable flag and request rate limit
- Exact Place ID lookup for full Google Maps URLs in restaurant comparison; search results require address confirmation before adding a branch
- No runtime fallback to Demo restaurants; missing integrations are shown as unavailable
- GitHub Actions build verification
- Vercel-compatible dynamic API route

## Integration gates

Live integrations are intentionally separated from the UI so they can be connected without rewriting the experience:
- Google Places / Maps: after explicit cost approval, set a server-only `GOOGLE_PLACES_API_KEY`, then set `GOOGLE_PLACES_LIVE_ENABLED=true`. The default `GOOGLE_PLACES_FIELD_TIER=pro` requests name, address, location, category and Maps URL. `enterprise` additionally requests rating, review count, price level and opening status; these fields change the billing SKU. No paid API is enabled in the repository.
- Supabase Auth (Google / Apple / Email)
- Supabase cloud sync

See `docs/product-spec-v1.0.md` for the current product contract.
See `docs/google-places-preview-activation.md` for the Preview-only Google Cloud and Vercel activation checklist.

## Cost policy

Free-first. Paid APIs or paid cloud resources must not be enabled without explicit confirmation.
