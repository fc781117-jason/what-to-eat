# What To Eat? — Product Spec V0.1

## Product goal
A lightweight, mobile-first PWA for deciding where to eat:
- Nearby discovery
- Food/restaurant roulette
- Restaurant comparison
- Single restaurant lookup
- Optional izakaya-specific scoring

## First-run onboarding
Users choose their own interface style. No smart style mixing.

Available styles:
1. Cute Playful
2. Clean Modern
3. Izakaya Warm
4. Dynamic Futuristic
5. Auto Switch — only when explicitly selected; switches complete themes by time of day.

Onboarding also asks:
- Name (optional)
- Mascot (optional)
- Default walking time
- **Per-person budget**

Defaults:
- Walking time: 15 minutes
- Per-person budget: unlimited
- Minimum rating: unrestricted
- Open now: enabled
- Compare limit: 5 restaurants

## Main modes
1. Nearby
2. What should I eat? roulette
3. Compare restaurants
4. Look up a restaurant

## Roulette
- Filters candidates first, then randomly selects.
- One-reel mode when cuisine is already known.
- Two-reel mode when both cuisine and restaurant need to be selected.
- Results must satisfy active hard filters.

## Restaurant detail
Show when data exists:
- Google rating
- Walking time/distance
- Per-person price
- Open/closing status
- Recommended dishes
- Review highlights
- Hygiene-related warning signals
- Compare/save actions
- Izakaya-specific score when applicable

## Data
V0.1 preview uses demo restaurant data.

Planned live integrations:
- Browser geolocation
- Google Places / Maps
- Google sign-in
- Supabase cloud sync for favorites, history, exclusions and preferences
- Local storage fallback
- JSON export/import backup

## PWA
- iPhone-first portrait layout
- Installable from Safari to Home Screen
- Service worker for basic caching
- No App Store requirement for V0.1

## Cloud sync principle
Guest mode can work locally.
Signed-in mode will sync data so changing phones does not lose preferences/history.

## Cost policy
Free-first. Do not enable paid cloud resources or APIs without explicit cost confirmation.
