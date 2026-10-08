"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Mascot from "../components/Mascot";
import {
  buildDecisionBehaviorStats,
  buildFoodStats,
  filterHistoryByPeriod,
  formatDecisionDuration,
  type StatsPeriod,
} from "../lib/analytics";
import { resolveBrowserLocation, type ResolvedLocation } from "../lib/location";
import {
  AVOIDANCE_OPTIONS,
  CUISINE_OPTIONS,
  DEFAULT_PROFILE,
  DINING_CONTEXT_OPTIONS,
  type HistoryEntry,
  type Dish,
  MASCOTS,
  moneyText,
  normalizeStoredProfile,
  PRICE_BANDS,
  priceBandMax,
  type Profile,
  type Restaurant,
  restaurantOpenState,
  restaurantPriceText,
  THEME_OPTIONS,
  type ViewId,
} from "../lib/product";
import { rankRestaurants, recommendationHint, scoreRestaurant, weightedPick } from "../lib/recommendation";
import { dishesFor, parseGoogleMapsInput } from "../lib/functional-data";
import {
  abandonDecisionSession,
  completeDecisionSession,
  createDecisionSession,
  hasDecisionTimedOut,
  pauseDecisionSession,
  recordDecisionEvent,
  resumeDecisionSession,
  successfulDecisionSeconds,
  type DecisionSession,
} from "../lib/decision-session";

const PROFILE_KEY = "wte_profile";
const FAVORITES_KEY = "wte_favorites";
const COMPARE_KEY = "wte_compare";
const HISTORY_KEY = "wte_history";
const DECISION_SESSIONS_KEY = "wte_decision_sessions_v2";
const ACTIVE_DECISION_KEY = "wte_active_decision_v2";
const FOOD_DATABASE_KEY = "wte_food_database_v2";
type FoodDatabase = { toTry: string[]; visited: string[]; notes: Record<string, string>; tags: Record<string, string[]>; lists: Record<string, string[]> };
const EMPTY_DATABASE: FoodDatabase = { toTry: [], visited: [], notes: {}, tags: {}, lists: {} };

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function sourceLabel(source: HistoryEntry["source"]) {
  return {
    roulette: "不知道吃什麼",
    nearby: "附近有什麼",
    compare: "餐廳超級比一比",
    category: "想吃這一類",
  }[source];
}

function distanceText(restaurant: Restaurant) {
  return restaurant.distance > 0 ? `直線距離約 ${restaurant.distance}m` : "距離待定位確認";
}

function ratingText(restaurant: Restaurant) {
  return restaurant.rating > 0 ? `Google 評分 ${restaurant.rating}（${restaurant.reviewCount.toLocaleString()} 則）` : "Google 評分尚未取得";
}

export default function V15Client() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [hydrated, setHydrated] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [view, setView] = useState<ViewId>("home");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [foodDatabase, setFoodDatabase] = useState<FoodDatabase>(EMPTY_DATABASE);
  const [savedTab, setSavedTab] = useState<"favorites" | "toTry" | "visited">("favorites");
  const [newListName, setNewListName] = useState("");
  const [selectedListName, setSelectedListName] = useState<string | null>(null);
  const [listNotice, setListNotice] = useState("");
  const [newTag, setNewTag] = useState("");
  const [compare, setCompare] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [detailReturnView, setDetailReturnView] = useState<ViewId>("home");
  const [selectedSource, setSelectedSource] = useState<HistoryEntry["source"]>("category");
  const [selectedCuisine, setSelectedCuisine] = useState("全部");
  const [search, setSearch] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [minRating, setMinRating] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [rouletteWinner, setRouletteWinner] = useState<Restaurant | null>(null);
  const [rouletteDish, setRouletteDish] = useState<Dish | null>(null);
  const [skipIds, setSkipIds] = useState<string[]>([]);
  const [activeDecision, setActiveDecision] = useState<DecisionSession | null>(null);
  const activeDecisionRef = useRef<DecisionSession | null>(null);
  const [decisionSessions, setDecisionSessions] = useState<DecisionSession[]>([]);
  const [location, setLocation] = useState<ResolvedLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState("尚未定位");
  const [liveRestaurants, setLiveRestaurants] = useState<Restaurant[]>([]);
  const [knownRestaurants, setKnownRestaurants] = useState<Restaurant[]>([]);
  const [compareMatches, setCompareMatches] = useState<Restaurant[]>([]);
  const [placesStatus, setPlacesStatus] = useState("請先確認位置，再搜尋真實餐廳。");
  const [placesLoading, setPlacesLoading] = useState(false);
  const [searchRadius, setSearchRadius] = useState(2000);
  const [installTip, setInstallTip] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop" | "standalone">("desktop");
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>("month");
  const [compareInputs, setCompareInputs] = useState(["", ""]);
  const [compareNotice, setCompareNotice] = useState("");
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [rouletteCuisine, setRouletteCuisine] = useState<string | null>(null);
  const [nearbyMode, setNearbyMode] = useState<"list" | "map">("list");
  const [manualArea, setManualArea] = useState("");
  const [manualAreaConfirmed, setManualAreaConfirmed] = useState("");
  const [statsDrilldown, setStatsDrilldown] = useState<{ type: "cuisine" | "restaurant" | "dish"; label: string } | null>(null);
  const [clock, setClock] = useState(Date.now());
  const rouletteResultRef = useRef<HTMLElement | null>(null);
  const placesRequestRef = useRef(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) setProfile(normalizeStoredProfile(JSON.parse(raw)));
      const fav = localStorage.getItem(FAVORITES_KEY);
      if (fav) setFavorites(JSON.parse(fav));
      const database = localStorage.getItem(FOOD_DATABASE_KEY);
      if (database) setFoodDatabase({ ...EMPTY_DATABASE, ...JSON.parse(database) });
      const cmp = localStorage.getItem(COMPARE_KEY);
      if (cmp) setCompare(JSON.parse(cmp));
      const hist = localStorage.getItem(HISTORY_KEY);
      if (hist) setHistory(JSON.parse(hist));
      const sessions = localStorage.getItem(DECISION_SESSIONS_KEY);
      if (sessions) setDecisionSessions(JSON.parse(sessions));
      const active = localStorage.getItem(ACTIVE_DECISION_KEY);
      if (active) {
        const stored = JSON.parse(active) as DecisionSession;
        if (stored?.id && (stored.status === "active" || stored.status === "paused")) {
          // A restored page was not observable while closed, so resume from the saved instant.
          const paused = stored.status === "active" ? pauseDecisionSession(stored, stored.lastActiveAt) : stored;
          const next = Date.now() - (paused.lastInteractionAt ?? paused.startedAt) > 15 * 60 * 1000
            ? abandonDecisionSession(paused) : resumeDecisionSession(paused);
          if (next.status === "abandoned") setDecisionSessions((current) => [next, ...current].slice(0, 500));
          else { activeDecisionRef.current = next; setActiveDecision(next); setView(next.mode); }
        }
      }
    } catch {}

    const nav = navigator as Navigator & { standalone?: boolean };
    const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone);
    if (standalone) setPlatform("standalone");
    else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) setPlatform("ios");
    else if (/Android/i.test(navigator.userAgent)) setPlatform("android");

    if ("serviceWorker" in navigator) {
      const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
      navigator.serviceWorker.register(base + "/sw.js").catch(() => {});
    }

    const timer = window.setInterval(() => setClock(Date.now()), 60000);
    setHydrated(true);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);

  useEffect(() => {
    if (!rouletteWinner || spinning) return;
    window.requestAnimationFrame(() => rouletteResultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [rouletteWinner, spinning]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.theme = profile.theme;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    localStorage.setItem(FOOD_DATABASE_KEY, JSON.stringify(foodDatabase));
    localStorage.setItem(COMPARE_KEY, JSON.stringify(compare));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    localStorage.setItem(DECISION_SESSIONS_KEY, JSON.stringify(decisionSessions.slice(0, 500)));
  }, [profile, favorites, foodDatabase, compare, history, decisionSessions, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (activeDecision) localStorage.setItem(ACTIVE_DECISION_KEY, JSON.stringify(activeDecision));
    else localStorage.removeItem(ACTIVE_DECISION_KEY);
  }, [activeDecision, hydrated]);

  useEffect(() => {
    function onVisibilityChange() {
      const current = activeDecisionRef.current;
      if (!current) return;
      const next = document.visibilityState === "hidden" ? pauseDecisionSession(current) : resumeDecisionSession(current);
      activeDecisionRef.current = next;
      setActiveDecision(next);
      if (document.visibilityState === "hidden") localStorage.setItem(ACTIVE_DECISION_KEY, JSON.stringify(next));
    }

    function onPageHide() {
      const current = activeDecisionRef.current;
      if (current) localStorage.setItem(ACTIVE_DECISION_KEY, JSON.stringify(pauseDecisionSession(current)));
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    const idle = window.setInterval(() => {
      const current = activeDecisionRef.current;
      if (current && hasDecisionTimedOut(current)) {
        const ended = abandonDecisionSession(current);
        activeDecisionRef.current = null;
        setActiveDecision(null);
        setDecisionSessions((items) => [ended, ...items].slice(0, 500));
        setView("home");
      }
    }, 15000);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      window.clearInterval(idle);
    };
  }, []);

  const budgetMax = priceBandMax(profile.priceBand);
  const restaurantCatalog = liveRestaurants;

  const eligible = useMemo(
    () =>
      restaurantCatalog.filter((restaurant) => {
        if (profile.excludedRestaurantIds.includes(restaurant.id)) return false;
        if (onlyOpen && restaurantOpenState(restaurant, new Date(clock)).unknown !== true && !restaurantOpenState(restaurant, new Date(clock)).open) return false;
        if (profile.walk && restaurant.walk > profile.walk) return false;
        if (budgetMax && restaurant.priceMin && restaurant.priceMin > budgetMax) return false;
        if (minRating && restaurant.rating > 0 && restaurant.rating < minRating) return false;
        return true;
      }),
    [restaurantCatalog, profile.excludedRestaurantIds, profile.walk, budgetMax, onlyOpen, minRating, clock],
  );

  const recommended = useMemo(
    () => rankRestaurants(eligible, profile).slice(0, 3),
    [eligible, profile],
  );

  const roulettePool = useMemo(
    () => eligible.filter((restaurant) => !skipIds.includes(restaurant.id) && (!rouletteCuisine || restaurant.cuisine === rouletteCuisine)),
    [eligible, skipIds, rouletteCuisine],
  );

  const categoryResults = useMemo(() => {
    // The Places response already applied the query. A second local text filter
    // would discard valid Google matches (e.g. a date-night query).
    return eligible;
  }, [eligible]);

  const compareRestaurants = compare.filter((id) => !profile.excludedRestaurantIds.includes(id))
    .map((id) => knownRestaurants.find((restaurant) => restaurant.id === id))
    .filter(Boolean) as Restaurant[];
  const rankedCompare = compareRestaurants.length >= 2 ? rankRestaurants(compareRestaurants, profile) : [];
  const compareWinner = rankedCompare.length >= 2 &&
    scoreRestaurant(rankedCompare[0], profile).reasons.length > 0 &&
    scoreRestaurant(rankedCompare[0], profile).score > scoreRestaurant(rankedCompare[1], profile).score
      ? rankedCompare[0] : null;

  function toggleTry(id: string) {
    setFoodDatabase((current) => ({ ...current, toTry: toggleValue(current.toTry, id) }));
  }

  function chooseCuisine(value: string | null) {
    setRouletteCuisine(value);
    setRouletteWinner(null);
    setRouletteDish(null);
    setSkipIds([]);
    eventInSession("filter_change");
  }

  const stats = useMemo(
    () => buildFoodStats(filterHistoryByPeriod(history, statsPeriod)),
    [history, statsPeriod],
  );

  const decisionStats = useMemo(() => {
    const now = Date.now();
    const days = statsPeriod === "week" ? 7 : statsPeriod === "month" ? 30 : statsPeriod === "year" ? 365 : null;
    const filtered = days
      ? decisionSessions.filter((session) => session.startedAt >= now - days * 86400000)
      : decisionSessions;
    return buildDecisionBehaviorStats(filtered);
  }, [decisionSessions, statsPeriod]);

  function updateActive(next: DecisionSession | null) {
    activeDecisionRef.current = next;
    setActiveDecision(next);
  }

  function eventInSession(event: Parameters<typeof recordDecisionEvent>[1], candidateId?: string) {
    const current = activeDecisionRef.current;
    if (current) updateActive(recordDecisionEvent(current, event, { candidateId }));
  }

  function beginDecision(source: HistoryEntry["source"], _candidates: number, nextView: ViewId) {
    const existing = activeDecisionRef.current;
    if (existing) setDecisionSessions((current) => [abandonDecisionSession(existing), ...current].slice(0, 500));
    const session = source === "compare"
      ? compare.filter((id) => !profile.excludedRestaurantIds.includes(id)).reduce(
          (current, id) => recordDecisionEvent(current, "candidate_view", { candidateId: id }),
          createDecisionSession(source),
        )
      : createDecisionSession(source);
    updateActive(session);
    setSelectedSource(source);
    if (source === "roulette") {
      setRouletteWinner(null);
      setSkipIds([]);
      setRouletteCuisine(null);
    }
    setView(nextView);
  }

  function recordDecision(restaurant: Restaurant, source = selectedSource, dish?: Dish) {
    const inProgress = activeDecisionRef.current;
    if (!inProgress || (inProgress.status !== "active" && inProgress.status !== "paused")) return;
    const completed = completeDecisionSession(
      recordDecisionEvent(inProgress, "candidate_view", { candidateId: restaurant.id }),
      { restaurantId: restaurant.id, dishId: dish?.dishId },
    );

    const seconds = successfulDecisionSeconds(completed) ?? undefined;
    const entry: HistoryEntry = {
      id: restaurant.id + "-" + Date.now(),
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      cuisine: restaurant.cuisine,
      source,
      createdAt: new Date().toISOString(),
      decisionSeconds: seconds,
      candidateCount: completed.candidateIds.length || undefined,
      dishId: dish?.dishId,
      dishName: dish?.name,
    };

    setDecisionSessions((current) => [completed, ...current].slice(0, 500));
    setHistory((current) => [entry, ...current].slice(0, 200));
    updateActive(null);
    setSelected(restaurant);
    setSelectedDish(dish ?? null);
    setView("go");
  }

  function toggleFavorite(id: string) {
    setFavorites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleVisited(id: string) {
    setFoodDatabase((current) => ({ ...current, visited: toggleValue(current.visited, id) }));
  }

  function createCustomList() {
    const name = newListName.trim().slice(0, 30);
    if (!name) {
      setListNotice("請先輸入清單名稱。");
      return;
    }
    if (Object.hasOwn(foodDatabase.lists, name)) {
      setListNotice("已經有同名清單。");
      setSelectedListName(name);
      return;
    }
    setFoodDatabase((current) => ({ ...current, lists: { ...current.lists, [name]: [] } }));
    setNewListName("");
    setSelectedListName(name);
    setListNotice(`已建立「${name}」。可到餐廳詳情加入內容。`);
  }

  function deleteCustomList(name: string) {
    if (!window.confirm(`確定刪除「${name}」清單？`)) return;
    setFoodDatabase((current) => {
      const lists = { ...current.lists };
      delete lists[name];
      return { ...current, lists };
    });
    setSelectedListName((current) => current === name ? null : current);
    setListNotice(`已刪除「${name}」。`);
  }

  function toggleCompare(id: string) {
    if (!compare.includes(id) && compare.length >= 5) return;
    eventInSession("compare_change");
    if (activeDecisionRef.current?.mode === "compare" && !compare.includes(id))
      eventInSession("candidate_view", id);
    setCompare((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 5) return current;
      return [...current, id];
    });
  }

  function excludeRestaurant(id: string) {
    eventInSession("exclude_permanent", id);
    setProfile((current) => ({
      ...current,
      excludedRestaurantIds: [...new Set([...current.excludedRestaurantIds, id])],
    }));
    setCompare((current) => current.filter((item) => item !== id));
    setRouletteWinner(null);
    if (view === "detail") goBackFromDetail();
  }

  async function searchLiveRestaurants(
    resolved: ResolvedLocation | null = location,
    query = "",
    updateCandidates = true,
    requestedRadius = searchRadius,
  ) {
    if (!resolved && !query.trim()) {
      setPlacesStatus("請使用目前位置，或輸入用餐地區後再搜尋。");
      return [] as Restaurant[];
    }
    const requestId = updateCandidates ? ++placesRequestRef.current : placesRequestRef.current;
    setPlacesLoading(true);
    setPlacesStatus(query ? "正在搜尋符合條件的真實餐廳…" : "正在搜尋附近的真實餐廳…");
    try {
      const params = new URLSearchParams({ radius: String(requestedRadius) });
      if (resolved) {
        params.set("lat", String(resolved.lat));
        params.set("lng", String(resolved.lng));
      }
      if (query.trim()) params.set("q", query.trim());
      const response = await fetch(`/api/places/search?${params.toString()}`, { cache: "no-store" });
      const data = await response.json() as { restaurants?: Restaurant[]; message?: string };
      if (!response.ok) throw new Error(data.message || "Google Places 搜尋失敗");
      const results = data.restaurants || [];
      setKnownRestaurants((current) => {
        const merged = [...results, ...current];
        return merged.filter((restaurant, index) => merged.findIndex((item) => item.id === restaurant.id) === index);
      });
      if (updateCandidates && requestId === placesRequestRef.current) setLiveRestaurants(results);
      if (requestId === placesRequestRef.current) setPlacesStatus(results.length ? `已從 Google Places 取得 ${results.length} 家真實餐廳。` : "這個範圍目前沒有搜尋結果，請調整範圍或關鍵字。");
      return results;
    } catch (error) {
      if (updateCandidates && requestId === placesRequestRef.current) setLiveRestaurants([]);
      if (requestId === placesRequestRef.current) setPlacesStatus(error instanceof Error ? error.message : "Google Places 搜尋失敗");
      return [] as Restaurant[];
    } finally {
      if (requestId === placesRequestRef.current) setPlacesLoading(false);
    }
  }

  function changeRadius(radius: number) {
    setSearchRadius(radius);
    const query = view === "category" ? [selectedCuisine === "全部" ? "" : selectedCuisine, search].filter(Boolean).join(" ") : "";
    if (location) void searchLiveRestaurants(location, query, true, radius);
  }

  async function locate() {
    setLocationStatus("正在取得 GPS 與附近地址…");
    placesRequestRef.current += 1;
    setLiveRestaurants([]);
    try {
      const resolved = await resolveBrowserLocation();
      setLocation(resolved);
      setManualAreaConfirmed("");
      setLocationStatus(resolved.label);
      await searchLiveRestaurants(resolved);
    } catch {
      setLocationStatus("定位失敗，請確認瀏覽器的位置權限");
    }
  }

  async function useManualArea(query = "餐廳") {
    const area = manualArea.trim();
    if (!area) {
      setPlacesStatus("請先輸入車站、行政區或商圈名稱。");
      return;
    }
    placesRequestRef.current += 1;
    setLocation(null);
    setLiveRestaurants([]);
    setManualAreaConfirmed(area);
    setLocationStatus(`手動地區：${area}`);
    eventInSession("filter_change");
    await searchLiveRestaurants(null, `${area} ${query}`.trim());
  }

  function spin() {
    if (spinning || !roulettePool.length) return;
    if (rouletteWinner) eventInSession("reroll");
    setSpinning(true);
    setRouletteWinner(null);
    setRouletteDish(null);
    window.setTimeout(() => {
      const winner = weightedPick(roulettePool, profile) || roulettePool[0];
      setRouletteWinner(winner);
      eventInSession("candidate_view", winner.id);
      setSpinning(false);
    }, 1800);
  }

  function spinDish() {
    if (!rouletteWinner) return;
    const dishes = dishesFor(rouletteWinner);
    if (!dishes.length) {
      setRouletteDish(null);
      return;
    }
    const dish = dishes[Math.floor(Math.random() * dishes.length)];
    setRouletteDish(dish);
    eventInSession("dish_detail_view", rouletteWinner.id);
  }

  function openDetail(restaurant: Restaurant, source: HistoryEntry["source"]) {
    // Home recommendations and saved places can open detail without using a mode card.
    // Treat that tap as the start of a decision so its final confirmation works too.
    const base = activeDecisionRef.current ?? createDecisionSession(source);
    let next = recordDecisionEvent(base, "candidate_view", { candidateId: restaurant.id });
    next = recordDecisionEvent(next, "restaurant_detail_view");
    updateActive(next);
    setDetailReturnView(view);
    setSelected(restaurant);
    setSelectedDish(null);
    setSelectedSource(source);
    setView("detail");
  }

  async function addCompareFromInput(raw: string) {
    if (!raw.trim()) {
      setCompareNotice("請先貼上 Google Maps 網址或輸入餐廳名稱。");
      return;
    }
    const input = parseGoogleMapsInput(raw);
    if (input.kind === "unsupported" || input.kind === "shortLink") {
      setCompareNotice(input.kind === "shortLink" ? "Google Maps 短網址尚無法安全解析；請貼完整店家網址或輸入店名。" : "無法辨識網址，請輸入店名或 Google Maps 網址。");
      return;
    }
    if (!location && !manualAreaConfirmed) {
      setCompareNotice("請先使用目前位置，或在上方輸入用餐地區，避免搜尋到同名但不同區域的店。");
      return;
    }
    setCompareMatches([]);
    setCompareNotice("正在 Google Places 搜尋…");
    if (input.kind === "placeId") {
      try {
        const response = await fetch(`/api/places/details?id=${encodeURIComponent(input.value)}`, { cache: "no-store" });
        const data = await response.json() as { restaurant?: Restaurant; message?: string };
        if (!response.ok || !data.restaurant) throw new Error(data.message || "無法取得這家餐廳的 Google 資料。");
        const restaurant = data.restaurant;
        setKnownRestaurants((current) => [restaurant, ...current.filter((item) => item.id !== restaurant.id)]);
        setCompareMatches([restaurant]);
        setCompareNotice("請核對地址並點選正確分店，才會加入比較。");
      } catch (error) {
        setCompareNotice(error instanceof Error ? error.message : "無法查詢 Google Place ID。");
      }
      return;
    }
    const text = input.value;
    const results = await searchLiveRestaurants(location, [manualAreaConfirmed, text].filter(Boolean).join(" "), false);
    if (!results.length) {
      setCompareNotice("找不到符合的真實餐廳，請輸入更完整的店名與地區。");
      return;
    }
    setCompareMatches(results);
    setCompareNotice("請核對地址並點選正確分店，才會加入比較。");
  }

  function goHome() {
    const currentDecision = activeDecisionRef.current;
    if (currentDecision && (currentDecision.status === "active" || currentDecision.status === "paused")) {
      const abandoned = abandonDecisionSession(currentDecision);
      setDecisionSessions((current) => [abandoned, ...current].slice(0, 500));
      updateActive(null);
    }
    setView("home");
  }

  function goBackFromDetail() {
    if (["roulette", "nearby", "compare", "category"].includes(detailReturnView)) {
      setView(detailReturnView);
    } else {
      leaveTo(detailReturnView);
    }
  }

  function leaveTo(next: ViewId) {
    const current = activeDecisionRef.current;
    if (current) {
      setDecisionSessions((items) => [abandonDecisionSession(current), ...items].slice(0, 500));
      updateActive(null);
    }
    setView(next);
  }

  function resetProfile() {
    setProfile(DEFAULT_PROFILE);
    setFavorites([]);
    setFoodDatabase(EMPTY_DATABASE);
    setCompare([]);
    setHistory([]);
    setDecisionSessions([]);
    updateActive(null);
    setOnboardingStep(0);
    setView("home");
  }

  if (!hydrated) return <main className="loading">正在準備你的美食日常…</main>;

  if (!profile.onboardingCompleted) {
    return (
      <Onboarding
        profile={profile}
        step={onboardingStep}
        onStep={setOnboardingStep}
        onChange={setProfile}
        onFinish={() => {
          setProfile((current) => ({ ...current, onboardingCompleted: true }));
          setView("home");
        }}
      />
    );
  }

  const Header = ({ title }: { title?: string }) => (
    <header className="topbar">
      {view !== "home" ? (
        <button className="iconBtn" onClick={view === "detail" ? goBackFromDetail : goHome} aria-label={view === "detail" ? "返回上一頁" : "回首頁"}>
          ←
        </button>
      ) : (
        <div className="brandMini">今天吃什麼？</div>
      )}
      <div className="topTitle">{title}</div>
      <button className="iconBtn" onClick={() => leaveTo("settings")} aria-label="設定">
        <span aria-hidden="true">•••</span>
      </button>
    </header>
  );

  return (
    <main className="appShell">
      <div className="phoneFrame">
        {view === "home" && (
          <>
            <Header />
            <section className="hero">
              <div>
                <p className="eyebrow">
                  {profile.name ? profile.name + "，" : ""}今天想吃什麼？
                </p>
                <h1>讓選擇變簡單，讓吃飯變有趣。</h1>
                <p className="muted">先縮小範圍，再讓心情做最後決定。</p>
              </div>
              <div className="mascotHero">
                <Mascot id={profile.mascot} mood="hello" size={92} />
              </div>
            </section>

            <form className="homeSearch" onSubmit={(event) => {
              event.preventDefault();
              beginDecision("category", categoryResults.length, "category");
              if (location || manualAreaConfirmed) void searchLiveRestaurants(location, [manualAreaConfirmed, search].filter(Boolean).join(" "));
            }}>
              <LineIcon kind="search" />
              <input aria-label="搜尋餐廳、料理或地區" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜尋餐廳・料理・地區…" />
              <button type="submit">搜尋</button>
            </form>

            <section className="modeGrid">
              <button
                className="modeCard coral"
                onClick={() => beginDecision("roulette", eligible.length, "roulette")}
              >
                <span className="modeGlyph"><LineIcon kind="dice" /></span>
                <b>不知道吃什麼</b>
                <small>定位後先抽餐廳，再決定餐點</small>
              </button>
              <button
                className="modeCard mint"
                onClick={() => beginDecision("nearby", eligible.length, "nearby")}
              >
                <span className="modeGlyph"><LineIcon kind="pin" /></span>
                <b>附近有什麼</b>
                <small>位置、距離與營業狀態</small>
              </button>
              <button
                className="modeCard gold"
                onClick={() => beginDecision("compare", compare.length, "compare")}
              >
                <span className="modeGlyph"><LineIcon kind="compare" /></span>
                <b>餐廳超級比一比</b>
                <small>聚餐候選太多時，用同一組條件比較</small>
              </button>
              <button
                className="modeCard sky"
                onClick={() => beginDecision("category", categoryResults.length, "category")}
              >
                <span className="modeGlyph"><LineIcon kind="search" /></span>
                <b>想吃這一類</b>
                <small>料理、店名或餐點搜尋</small>
              </button>
            </section>

            <section className="sectionBlock">
              <div className="sectionHeading">
                <div>
                  <p className="eyebrow">FOR YOU</p>
                  <h2>先替你挑這幾家</h2>
                </div>
                <span>{eligible.length} 家符合條件</span>
              </div>
              <div className="restaurantList">
                {recommended.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    favorite={favorites.includes(restaurant.id)}
                    compared={compare.includes(restaurant.id)}
                    hint={recommendationHint(restaurant, profile)}
                    onFavorite={() => toggleFavorite(restaurant.id)}
                    onCompare={() => toggleCompare(restaurant.id)}
                    onOpen={() => openDetail(restaurant, "category")}
                  />
                ))}
                {!recommended.length && <div className="truthNotice"><b>尚未取得真實餐廳</b><span>請從「附近有什麼」、「不知道吃什麼」或「想吃這一類」先確認位置。Google Places 尚未連線時不會顯示示範店家。</span></div>}
              </div>
            </section>

            <section className="filterBox">
              <div className="sectionTitle">
                <b>目前篩選</b>
                <button
                  onClick={() => {
                    setProfile((current) => ({ ...current, walk: 15, priceBand: "any" }));
                    setMinRating(0);
                    setOnlyOpen(true);
                  }}
                >
                  重設
                </button>
              </div>
              <div className="chips">
                <span>步行時間尚未接入路線資料</span>
                <span>實際花費請見店家資訊</span>
                <button onClick={() => setMinRating((current) => (current ? 0 : 4.5))}>
                  {minRating ? `已知評分 ${minRating}+` : "評分不限"}
                </button>
                <button className={onlyOpen ? "active" : ""} onClick={() => setOnlyOpen(!onlyOpen)}>
                  ◷ {onlyOpen ? "排除已知休息店家" : "營業不限"}
                </button>
              </div>
            </section>

            {platform !== "standalone" && (
              <>
                <button className="installHint" onClick={() => setInstallTip(!installTip)}>
                  加到手機主畫面
                </button>
                {installTip && (
                  <div className="tipBox">
                    {platform === "ios"
                      ? "iPhone / iPad：請用 Safari 開啟 → 分享 →「加入主畫面」。"
                      : platform === "android"
                        ? "Android / Chrome：右上角選單 →「安裝應用程式」或「加到主畫面」。"
                        : "手機瀏覽器開啟後，可使用瀏覽器的「安裝／加入主畫面」功能。"}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {view === "roulette" && (
          <>
            <Header title="不知道吃什麼" />
            <section className="rouletteHero">
              <p className="eyebrow">STEP 1 · DRAW A RESTAURANT</p>
              <h1>先確認位置，再抽一家餐廳。</h1>
              <p className="muted">系統只會從你選定範圍內的真實候選餐廳抽選；抽到餐廳後，再決定吃哪道餐點。</p>

              <div className="discoveryLocation compact">
                <div>
                  <span className="stepDot">1</span>
                  <div><b>{location ? "位置已確認" : "先告訴我你在哪裡"}</b><small>{location ? locationStatus : "需要位置才能建立正確的抽選範圍"}</small></div>
                </div>
                <div className="locationControls">
                  <select aria-label="搜尋範圍" value={searchRadius} disabled={!location} onChange={(event) => changeRadius(Number(event.target.value))}>
                    <option value={1000}>1 公里內</option>
                    <option value={2000}>2 公里內</option>
                    <option value={3000}>3 公里內</option>
                    <option value={5000}>5 公里內</option>
                  </select>
                  <button className="secondaryBtn" onClick={locate} disabled={placesLoading}>{placesLoading ? "搜尋中…" : location ? "更新附近餐廳" : "使用目前位置"}</button>
                </div>
                <div className="manualAreaRow">
                  <span>或不開定位</span>
                  <div className="compareInputRow">
                    <input aria-label="手動輸入抽選地區" placeholder="例如：板橋站、信義區" value={manualArea} onChange={(event) => setManualArea(event.target.value)} />
                    <button onClick={() => void useManualArea()} disabled={placesLoading}>使用此地區</button>
                  </div>
                  {manualAreaConfirmed && <small>目前以「{manualAreaConfirmed}」搜尋；手動地區無法保證公里半徑，也不顯示距離。</small>}
                </div>
                <p className="micro liveStatus">{placesStatus}</p>
              </div>

              {!!eligible.length && <><p className="fieldLabel">想限定料理嗎？可直接略過</p><div className="horizontalChips" aria-label="限定料理類型">
                <button className={!rouletteCuisine ? "selected" : ""} onClick={() => chooseCuisine(null)}>不限料理</button>
                {[...new Set(eligible.map((restaurant) => restaurant.cuisine))].map((cuisine) => (
                  <button key={cuisine} className={rouletteCuisine === cuisine ? "selected" : ""} onClick={() => chooseCuisine(cuisine)}>{cuisine}</button>
                ))}
              </div></>}
              <div className={"slotMachine visual " + (spinning ? "spinning" : "")}>
                <div className="reelWindow">
                  {(spinning
                    ? roulettePool.slice(0, 5)
                    : rouletteWinner
                      ? [rouletteWinner]
                      : roulettePool.slice(0, 3)
                  ).map((restaurant, index) => (
                    <div className="reelItem" key={restaurant.id + String(index)}>
                      <span>{restaurant.cuisine}</span>
                      <b>{restaurant.name}</b>
                    </div>
                  ))}
                  {!roulettePool.length && <div className="reelItem reelPrompt"><span>先決定搜尋地區</span><b>真實餐廳會出現在這裡</b></div>}
                </div>
                <div className="slotPointer">▶</div>
              </div>
              <button
                className="spinBtn"
                disabled={!roulettePool.length || spinning}
                onClick={spin}
              >
                {spinning ? "正在抽選餐廳…" : "抽一家餐廳"}
              </button>
              {!roulettePool.length && <p className="micro warningText">請先完成定位並取得真實餐廳，才會開放抽選。</p>}
            </section>

            {rouletteWinner && (
              <section className="winnerCard resultFocus" ref={rouletteResultRef}>
                <p className="eyebrow">STEP 2 · PICK A DISH</p>
                <div className="winnerTop">
                  <div>
                    <span className="sourceBadge" translate="no">{rouletteWinner.sourceLabel}</span>
                    <h2>{rouletteWinner.name}</h2>
                    <p>
                      {ratingText(rouletteWinner)} · {distanceText(rouletteWinner)} ·{" "}
                      {restaurantPriceText(rouletteWinner)}
                    </p>
                  </div>
                  <Mascot id={profile.mascot} mood="celebrate" size={72} />
                </div>
                <div className="resultFacts">
                  <div><span>料理類型</span><b>{rouletteWinner.cuisine}</b></div>
                  <div><span>推薦理由</span><b>{recommendationHint(rouletteWinner, profile)}</b></div>
                  <div><span>營業狀態</span><b>{restaurantOpenState(rouletteWinner, new Date(clock)).label}</b></div>
                  <div><span>地址</span><b>{rouletteWinner.address}</b></div>
                </div>
                {dishesFor(rouletteWinner).length ? (
                  <div className="dishDraw">
                    <button className="secondaryBtn" onClick={spinDish}>{rouletteDish ? "再抽一道餐點" : "接著抽一道餐點"}</button>
                    {rouletteDish && <div className="dishResult"><span>今天可以吃</span><strong>{rouletteDish.name}</strong><small>{rouletteDish.price ? `NT$ ${rouletteDish.price}` : "價格尚無可信來源"}</small></div>}
                  </div>
                ) : (
                  <div className="truthNotice"><b>餐點資料尚未取得</b><span>Google Places 不提供完整菜單；可先查看店家的 Google Maps 資訊或菜單，再決定吃哪一道。不會替你捏造推薦菜色。</span></div>
                )}
                <div className="winnerActions">
                  {rouletteWinner.googleMapsUrl && <a className="primaryMini" href={rouletteWinner.googleMapsUrl} target="_blank" rel="noreferrer">開啟 Google Maps</a>}
                  <button className="primaryMini" onClick={() => openDetail(rouletteWinner, "roulette")}>
                    看詳細資料
                  </button>
                  <button onClick={() => recordDecision(rouletteWinner, "roulette")}>今天就吃這家</button>
                  {rouletteDish && <button onClick={() => recordDecision(rouletteWinner, "roulette", rouletteDish)}>就吃這個餐點</button>}
                  <button onClick={spin}>再抽一次</button>
                  <button onClick={() => toggleFavorite(rouletteWinner.id)}>{favorites.includes(rouletteWinner.id) ? "取消收藏" : "收藏"}</button>
                  <button
                    onClick={() => {
                      eventInSession("skip_once", rouletteWinner.id);
                      setSkipIds((current) => [...new Set([...current, rouletteWinner.id])]);
                      setRouletteWinner(null);
                    }}
                  >
                    這次不要
                  </button>
                  <button className="dangerSoft" onClick={() => excludeRestaurant(rouletteWinner.id)}>
                    不喜歡，以後不要推薦
                  </button>
                </div>
              </section>
            )}
          </>
        )}

        {view === "nearby" && (
          <>
            <Header title="附近有什麼" />
            <section className="locationPanel">
              <div className="locationMap">
                <span className="mapPulse" />
                <span className="mapPin" aria-hidden="true" />
              </div>
              <div>
                <p className="eyebrow">YOUR LOCATION</p>
                <h2>{location ? "已確認附近位置" : "先確認你在哪裡"}</h2>
                <p className="locationHuman">{locationStatus}</p>
                {location && (
                  <p className="micro">
                    GPS 精度約 ±{location.accuracy}m · 地址來源：
                    {location.source === "google"
                      ? "Google"
                      : location.source === "openstreetmap"
                        ? "OpenStreetMap"
                        : "GPS"}
                  </p>
                )}
                <button className="secondaryBtn" onClick={locate}>
                  {location ? "重新定位並更新" : "使用目前位置"}
                </button>
                <select className="textInput" aria-label="附近搜尋範圍" value={searchRadius} disabled={!location} onChange={(event) => changeRadius(Number(event.target.value))}>
                  <option value={1000}>搜尋 1 公里內</option>
                  <option value={2000}>搜尋 2 公里內</option>
                  <option value={3000}>搜尋 3 公里內</option>
                  <option value={5000}>搜尋 5 公里內</option>
                </select>
                <div className="manualAreaRow">
                  <span>或不開定位，手動指定地區</span>
                  <div className="compareInputRow">
                    <input aria-label="手動輸入區域" placeholder="例如：板橋站" value={manualArea} onChange={(event) => setManualArea(event.target.value)} />
                    <button onClick={() => void useManualArea()} disabled={placesLoading}>使用此地區</button>
                  </div>
                </div>
                {manualAreaConfirmed && <p className="micro">手動地區以地名搜尋，無法保證公里半徑。</p>}
                <p className="micro liveStatus">{placesStatus}</p>
              </div>
            </section>

            <p className="integrationNote">
              <b>資料來源：</b>
              餐廳只接受 Google Places 回傳結果。若尚未設定金鑰，這裡會保持空白並顯示連線狀態，不再放入 Demo 餐廳。
            </p>

            <div className="periodTabs" role="group" aria-label="地圖或列表">
              <button className={nearbyMode === "list" ? "selected" : ""} onClick={() => setNearbyMode("list")}>列表</button>
              <button className={nearbyMode === "map" ? "selected" : ""} onClick={() => setNearbyMode("map")}>地圖</button>
            </div>
            {nearbyMode === "map" && <section className="detailCard">
              <h2>周邊地圖</h2>
              {location ? <iframe title="目前位置地圖" loading="lazy" style={{ width: "100%", height: 280, border: 0, borderRadius: 12 }}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.012}%2C${location.lat - 0.008}%2C${location.lng + 0.012}%2C${location.lat + 0.008}&layer=mapnik&marker=${location.lat}%2C${location.lng}`} /> : <p>先取得 GPS，才可顯示所在地圖。手動區域可用下方連結外開搜尋。</p>}
              <p className="micro">目前地圖先標示你的 GPS 位置；餐廳圖釘會在 Google 地圖顯示層完成後加入。</p>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((manualArea.trim() || location?.label || "附近") + " 餐廳")}`} target="_blank" rel="noreferrer">在 Google Maps 搜尋真實餐廳</a>
            </section>}
            {nearbyMode === "list" && <section className="restaurantList">
              {eligible.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  favorite={favorites.includes(restaurant.id)}
                  compared={compare.includes(restaurant.id)}
                  hint={recommendationHint(restaurant, profile)}
                  onFavorite={() => toggleFavorite(restaurant.id)}
                  onCompare={() => toggleCompare(restaurant.id)}
                  onOpen={() => openDetail(restaurant, "nearby")}
                />
              ))}
            </section>}
            {nearbyMode === "list" && !eligible.length && <Empty text={location ? placesStatus : "先使用目前位置，系統才知道要搜尋哪個範圍。"} />}
          </>
        )}

        {view === "compare" && (
          <>
            <Header title="餐廳超級比一比" />
            <section className="pageIntro compareIntro">
              <p className="eyebrow">COMPARE RESTAURANTS</p>
              <h1>候選太多，不知道怎麼選？</h1>
              <p>聚餐、約會或臨時選店時，把 2～5 家餐廳放進來；核對地址後，比較 Google 已取得的資料與你的偏好。缺少的欄位會明確標示。</p>
              <ol className="flowSteps">
                <li><span>1</span>確認用餐地區</li>
                <li><span>2</span>貼網址或輸入店名</li>
                <li><span>3</span>查看並確認選擇</li>
              </ol>
            </section>
            <section className="discoveryLocation compact">
              <div><span className="stepDot">1</span><div><b>{location || manualAreaConfirmed ? "比較地區已確認" : "先確認比較地區"}</b><small>{location || manualAreaConfirmed ? locationStatus : "用位置或地區避免拿不同區域的店硬比"}</small></div></div>
              <button className="secondaryBtn" onClick={locate} disabled={placesLoading}>{placesLoading ? "搜尋中…" : location ? "重新定位" : "使用目前位置"}</button>
              <div className="manualAreaRow">
                <span>或不開定位，輸入聚餐地區</span>
                <div className="compareInputRow"><input aria-label="手動輸入比較地區" placeholder="例如：台北車站" value={manualArea} onChange={(event) => setManualArea(event.target.value)} /><button onClick={() => void useManualArea()} disabled={placesLoading}>確認地區</button></div>
              </div>
              <p className="micro liveStatus">{placesStatus}</p>
            </section>
            <section className="compareBuilder">
              <p className="eyebrow">STEP 2 · ADD CANDIDATES</p>
              <h2>貼 Google Maps 網址或輸入店名</h2>
              <p className="muted">一格一家，最多 5 家；按 ＋ 再新增欄位。</p>

              {compareInputs.map((value, index) => (
                <div className="compareInputRow" key={index}>
                  <input
                    value={value}
                    onChange={(event) =>
                      setCompareInputs((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? event.target.value : item,
                        ),
                      )
                    }
                    placeholder={"餐廳 " + String(index + 1) + "：貼 Google Maps 網址或輸入店名"}
                  />
                  <button onClick={() => addCompareFromInput(value)}>加入</button>
                </div>
              ))}

              <button
                className="addFieldBtn"
                disabled={compareInputs.length >= 5}
                onClick={() => setCompareInputs((current) => [...current, ""])}
              >
                ＋ 加入另一家
              </button>
              {compareNotice && <p className="micro">{compareNotice}</p>}
              {compareMatches.length > 0 && <div className="compareMatchList" aria-label="選擇正確分店">
                {compareMatches.map((restaurant) => <button key={restaurant.id} disabled={!compare.includes(restaurant.id) && compare.length >= 5} onClick={() => {
                  if (!compare.includes(restaurant.id)) toggleCompare(restaurant.id);
                  setCompareNotice(`已加入：${restaurant.name} · ${restaurant.address}`);
                  setCompareMatches([]);
                }}><b>{restaurant.name}</b><small>{restaurant.address}</small></button>)}
              </div>}
            </section>

            <section className="comparePills">
              {compareRestaurants.map((restaurant) => (
                <button key={restaurant.id} onClick={() => toggleCompare(restaurant.id)}>
                  × {restaurant.name}
                </button>
              ))}
            </section>

            {!compareRestaurants.length ? (
              <Empty text="先加入 2～5 家餐廳；手機版會用卡片比較，不再硬塞桌面表格。" />
            ) : (
              <section className="compareCards">
                {compareRestaurants.map((restaurant) => {
                  const open = restaurantOpenState(restaurant, new Date(clock));
                  return (
                    <article className="compareCard" key={restaurant.id}>
                      <div className="compareRank">候選</div>
                      <h3>{restaurant.name}</h3>
                      <div className="compareFacts">
                        <small className="sourceMark" translate="no">{restaurant.sourceLabel}</small>
                        <span>{ratingText(restaurant)}</span>
                        <span>{distanceText(restaurant)}</span>
                        <span>{restaurantPriceText(restaurant)}</span>
                        <span className={open.unknown ? "" : open.open ? "good" : "bad"}>{open.label}</span>
                      </div>
                      <p>{restaurant.signature.slice(0, 2).join("、")}</p>
                      <button className="primaryMini" onClick={() => openDetail(restaurant, "compare")}>
                        看完整資料
                      </button>
                      <button onClick={() => recordDecision(restaurant, "compare")}>就選這家</button>
                    </article>
                  );
                })}
              </section>
            )}

            {compareWinner && <section className="insightCard">
              <p className="eyebrow">CURRENT MATCH</p>
              <h2>目前較符合：{compareWinner.name}</h2>
              <p>{[
                ...recommendationHint(compareWinner, profile).split(" · "),
                ratingText(compareWinner),
                distanceText(compareWinner),
              ].slice(0, 3).join("；")}</p>
              <p className="micro">依 Google Places 基本欄位與你的偏好規則排序；缺少的資料不會自行補寫。</p>
              <button className="primaryBtn" onClick={() => recordDecision(compareWinner, "compare")}>今天就吃這家</button>
            </section>}
            {rankedCompare.length >= 2 && !compareWinner && <p className="truthNotice">目前沒有足夠的可比較資料來判定哪家較合適；請查看各店地址與 Google Maps 資訊後自行決定。</p>}

            <section className="sectionBlock">
              <div className="sectionHeading">
                <h2>也可以直接加餐廳</h2>
                <span>{compare.length}/5</span>
              </div>
              <div className="restaurantList">
                {restaurantCatalog.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    favorite={favorites.includes(restaurant.id)}
                    compared={compare.includes(restaurant.id)}
                    addMode
                    onFavorite={() => toggleFavorite(restaurant.id)}
                    onCompare={() => toggleCompare(restaurant.id)}
                    onOpen={() => openDetail(restaurant, "compare")}
                  />
                ))}
                {!restaurantCatalog.length && <Empty text={location ? placesStatus : "先確認位置，再從 Google Places 加入真實餐廳。"} />}
              </div>
            </section>
          </>
        )}

        {view === "category" && (
          <>
            <Header title="想吃這一類" />
            <section className="pageIntro categoryIntro">
              <p className="eyebrow">SEARCH WITH DIRECTION</p>
              <h1>有方向，再決定要找多近。</h1>
              <p>先確認所在地，搜尋結果才會落在真的能前往的範圍；接著再輸入料理、情境或店名。</p>
            </section>
            <section className="discoveryLocation compact">
              <div><span className="stepDot">1</span><div><b>{location || manualAreaConfirmed ? "搜尋位置已確認" : "要搜尋目前位置附近嗎？"}</b><small>{location || manualAreaConfirmed ? locationStatus : "可以開啟定位，也可以手動輸入地區"}</small></div></div>
              <div className="locationControls">
                <select aria-label="分類搜尋範圍" value={searchRadius} disabled={!location} onChange={(event) => changeRadius(Number(event.target.value))}>
                  <option value={1000}>1 公里內</option><option value={2000}>2 公里內</option><option value={3000}>3 公里內</option><option value={5000}>5 公里內</option>
                </select>
                <button className="secondaryBtn" onClick={locate} disabled={placesLoading}>{location ? "更新位置" : "使用目前位置"}</button>
              </div>
              <div className="manualAreaRow">
                <span>或不開定位</span>
                <div className="compareInputRow"><input aria-label="手動輸入搜尋地區" placeholder="例如：逢甲夜市、左營站" value={manualArea} onChange={(event) => setManualArea(event.target.value)} /><button onClick={() => void useManualArea([selectedCuisine === "全部" ? "" : selectedCuisine, search].filter(Boolean).join(" ") || "餐廳")} disabled={placesLoading}>使用此地區</button></div>
              </div>
              <p className="micro liveStatus">{placesStatus}</p>
            </section>
            <section className="searchPanel">
              <p className="eyebrow">STEP 2 · WHAT DO YOU WANT?</p>
              <h2>今天腦中已經有一點方向？</h2>
              <div className="searchActionRow"><input
                  className="textInput"
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); eventInSession("filter_change"); }}
                  placeholder="店名、料理、約會、宵夜"
                /><button onClick={() => void searchLiveRestaurants(location, [manualAreaConfirmed, selectedCuisine === "全部" ? "" : selectedCuisine, search].filter(Boolean).join(" "))} disabled={(!location && !manualAreaConfirmed) || placesLoading}>{placesLoading ? "搜尋中" : "搜尋"}</button></div>
              <p className="micro">定位搜尋會限制在選定半徑內；手動地區以地名搜尋，不能保證公里半徑。每人實際消費金額尚無可信資料。</p>
              <div className="horizontalChips">
                {["全部", ...CUISINE_OPTIONS].map((cuisine) => (
                  <button
                    key={cuisine}
                    className={selectedCuisine === cuisine ? "selected" : ""}
                    onClick={() => {
                      setSelectedCuisine(cuisine);
                      eventInSession("filter_change");
                      if (location || manualAreaConfirmed) void searchLiveRestaurants(location, [manualAreaConfirmed, cuisine === "全部" ? "" : cuisine, search].filter(Boolean).join(" "));
                    }}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </section>
            <section className="restaurantList">
              {categoryResults.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  favorite={favorites.includes(restaurant.id)}
                  compared={compare.includes(restaurant.id)}
                  onFavorite={() => toggleFavorite(restaurant.id)}
                  onCompare={() => toggleCompare(restaurant.id)}
                  onOpen={() => openDetail(restaurant, "category")}
                />
              ))}
            </section>
            {!categoryResults.length && <Empty text={location ? placesStatus : "先確認位置，再搜尋附近的真實餐廳。"} />}
          </>
        )}

        {view === "favorites" && (
          <>
            <Header title="收藏" />
            <section className="pageHeading">
              <p className="eyebrow">SAVED</p>
              <h2>下次想吃，不必再找一次</h2>
            </section>
            <div className="periodTabs" role="group" aria-label="收藏分類">
              {(["favorites", "toTry", "visited"] as const).map((tab) => <button key={tab} className={savedTab === tab ? "selected" : ""} onClick={() => setSavedTab(tab)}>
                {tab === "favorites" ? "收藏" : tab === "toTry" ? "想吃" : "吃過"}
              </button>)}
            </div>
            {savedTab === "visited" && <p className="micro">舊版曾在選定餐廳時自動標記「吃過」；請點進餐廳確認，並可取消不正確的標記。</p>}
            <section className="restaurantList">
              {knownRestaurants.filter((restaurant) => (savedTab === "favorites" ? favorites : foodDatabase[savedTab]).includes(restaurant.id)).map(
                (restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    favorite={favorites.includes(restaurant.id)}
                    compared={compare.includes(restaurant.id)}
                    onFavorite={() => toggleFavorite(restaurant.id)}
                    onCompare={() => toggleCompare(restaurant.id)}
                    onOpen={() => openDetail(restaurant, "category")}
                  />
                ),
              )}
            </section>
            {!(savedTab === "favorites" ? favorites : foodDatabase[savedTab]).length && <Empty text="目前沒有這一類的餐廳；可在詳細頁標記。" />}
            {(savedTab === "favorites" ? favorites : foodDatabase[savedTab]).some((id) => !knownRestaurants.some((restaurant) => restaurant.id === id)) &&
              <p className="micro">已保留餐廳的 Google Place ID。重新搜尋該店後會顯示最新資訊；不使用過期的店名、評分或營業狀態。</p>}
            <section className="detailCard">
              <h2>我的清單</h2>
              <div className="compareInputRow">
                <input aria-label="新清單名稱" maxLength={30} placeholder="例如：下次約會" value={newListName} onChange={(event) => { setNewListName(event.target.value); setListNotice(""); }} onKeyDown={(event) => { if (event.key === "Enter") createCustomList(); }} />
                <button onClick={createCustomList}>建立</button>
              </div>
              {listNotice && <p className="micro" role="status">{listNotice}</p>}
              {Object.keys(foodDatabase.lists).length ? <div className="savedLists">
                {Object.entries(foodDatabase.lists).map(([name, ids]) => <div className={"savedListRow " + (selectedListName === name ? "selected" : "")} key={name}>
                  <button className="savedListOpen" onClick={() => setSelectedListName((current) => current === name ? null : name)} aria-expanded={selectedListName === name}>
                    <span><b>{name}</b><small>{ids.length} 家餐廳</small></span>
                    <span aria-hidden="true">{selectedListName === name ? "收起" : "查看"}</span>
                  </button>
                  <button className="savedListDelete" onClick={() => deleteCustomList(name)} aria-label={`刪除${name}清單`}>刪除</button>
                </div>)}
              </div> : <p className="muted">建立情境清單後，可在餐廳詳情把店家加入清單。</p>}
            </section>
            {selectedListName && Object.hasOwn(foodDatabase.lists, selectedListName) && <section className="sectionBlock">
              <div className="sectionHeading"><h2>{selectedListName}</h2><span>{foodDatabase.lists[selectedListName].length} 家</span></div>
              {foodDatabase.lists[selectedListName].length ? <div className="restaurantList">
                {foodDatabase.lists[selectedListName].map((id) => knownRestaurants.find((item) => item.id === id)).filter(Boolean).map((restaurant) => <div className="savedListRestaurant" key={restaurant!.id}>
                  <RestaurantCard
                    restaurant={restaurant!}
                    favorite={favorites.includes(restaurant!.id)}
                    compared={compare.includes(restaurant!.id)}
                    onFavorite={() => toggleFavorite(restaurant!.id)}
                    onCompare={() => toggleCompare(restaurant!.id)}
                    onOpen={() => openDetail(restaurant!, "category")}
                  />
                  <button className="dangerSoft removeFromList" onClick={() => setFoodDatabase((current) => ({ ...current, lists: { ...current.lists, [selectedListName]: current.lists[selectedListName].filter((item) => item !== restaurant!.id) } }))}>從「{selectedListName}」移除</button>
                </div>)}
              </div> : <Empty text="這個清單還沒有餐廳；到餐廳詳情即可加入。" />}
            </section>}
          </>
        )}

        {view === "stats" && (
          <>
            <Header title="我的飲食統計" />
            <section className="statsHeader">
              <p className="eyebrow">FOOD HABITS</p>
              <h1>看看你都怎麼決定吃什麼。</h1>
              <div className="periodTabs">
                {(["week", "month", "year", "all"] as StatsPeriod[]).map((period) => (
                  <button
                    key={period}
                    className={statsPeriod === period ? "selected" : ""}
                    onClick={() => setStatsPeriod(period)}
                  >
                    {period === "week" ? "週" : period === "month" ? "月" : period === "year" ? "年" : "全部"}
                  </button>
                ))}
              </div>
            </section>

            <section className="statsGrid">
              <StatCard value={String(decisionStats.completed)} label="完成選餐" />
              <StatCard value={formatDecisionDuration(decisionStats.averageActiveSeconds)} label="平均主動決策時間" />
              <StatCard value={formatDecisionDuration(decisionStats.medianActiveSeconds)} label="中位數決策時間" />
              <StatCard value={String(decisionStats.slowDecisions)} label="超過 10 分鐘" />
              <StatCard value={`${decisionStats.firstChoiceAcceptanceRate}%`} label="首選接受率" />
              <StatCard value={`${decisionStats.abandonmentRate}%`} label="未完成率" />
            </section>

            <section className="insightCard">
              <p className="eyebrow">THIS PERIOD</p>
              <h2>
                {stats.topCuisine
                  ? "你最常選 " + stats.topCuisine
                  : "再多選幾次，我就能看出你的口味。"}
              </h2>
              <p>
                {stats.topRestaurant
                  ? "目前最常選的是「" + stats.topRestaurant + "」。"
                  : "尚未形成固定愛店。"}
              </p>
              {stats.fastestDecisionSeconds && (
                <p>最快一次只花 {formatDecisionDuration(stats.fastestDecisionSeconds)}。</p>
              )}
              {decisionStats.slowDecisions > 0 && (
                <p className="funNote">
                  本期有 {decisionStats.slowDecisions} 次主動考慮超過 10 分鐘——今天可能真的有一點選擇障礙。
                </p>
              )}
              <p className="micro">
                第一次推薦就接受：{decisionStats.firstChoiceAcceptanceRate}% · 未完成率：{decisionStats.abandonmentRate}%
              </p>
              <button className="secondaryBtn" onClick={() => setView("history")}>
                查看詳細紀錄
              </button>
            </section>

            <section className="chartCard">
              <div className="sectionHeading"><h2>最常選 Top 3</h2></div>
              {([
                ["cuisine", "料理", stats.cuisineCounts],
                ["restaurant", "餐廳", stats.restaurantCounts],
                ["dish", "餐點", stats.dishCounts],
              ] as const).map(([type, title, rows]) => <div key={type}>
                <h3>{title}</h3>
                {rows.length ? rows.slice(0, 3).map((item, index) => <button className="rankingRow" key={item.label} onClick={() => setStatsDrilldown({ type, label: item.label })}>
                  {index + 1}. {item.label}　{item.value} 次 →
                </button>) : <p className="micro">尚無資料</p>}
              </div>)}
              {statsDrilldown && <div className="detailCard">
                <button onClick={() => setStatsDrilldown(null)}>關閉詳細</button>
                <h3>{statsDrilldown.label}</h3>
                {(() => {
                  const field = statsDrilldown.type === "cuisine" ? "cuisine" : statsDrilldown.type === "restaurant" ? "restaurantName" : "dishName";
                  const matches = filterHistoryByPeriod(history, statsPeriod).filter((entry) => entry[field] === statsDrilldown.label);
                  const total = filterHistoryByPeriod(history, statsPeriod).length;
                  return <><p>{matches.length} 次 · 佔完成決策 {total ? Math.round(matches.length / total * 100) : 0}%</p>
                    <p>最近一次：{matches[0] ? new Date(matches[0].createdAt).toLocaleDateString("zh-TW") : "尚無"}</p>
                    {statsDrilldown.type === "cuisine" && <p>常選餐廳：{[...new Set(matches.map((item) => item.restaurantName))].slice(0, 3).join("、")}</p>}
                    {statsDrilldown.type !== "dish" && <p>常選餐點：{[...new Set(matches.map((item) => item.dishName).filter(Boolean))].slice(0, 3).join("、") || "尚未記錄"}</p>}</>;
                })()}
              </div>}
            </section>

            <section className="chartCard">
              <h2>決策過程</h2>
              <p>平均總經過 {formatDecisionDuration(decisionStats.averageElapsedSeconds)} · 最快主動決策 {decisionStats.fastestActiveSeconds === null ? "尚無資料" : formatDecisionDuration(decisionStats.fastestActiveSeconds)}</p>
              <p>超過 5 分 {decisionStats.overFiveMinutes} 次 · 超過 10 分 {decisionStats.overTenMinutes} 次 · 平均看過 {decisionStats.averageCandidates} 家</p>
              <p>餐廳詳情 {decisionStats.restaurantDetailViews} 次 · 餐點詳情 {decisionStats.dishDetailViews} 次 · 篩選變更 {decisionStats.filterChanges} 次</p>
              <p>重抽 {decisionStats.rerolls} 次 · 這次不要 {decisionStats.skips} 次 · 永久排除 {decisionStats.permanentExclusions} 次</p>
            </section>

            <section className="chartCard">
              <div className="sectionHeading"><h2>選擇的料理</h2></div>
              {stats.cuisineCounts.length ? (
                stats.cuisineCounts.slice(0, 6).map((item) => (
                  <Bar
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    max={stats.cuisineCounts[0].value}
                  />
                ))
              ) : (
                <Empty text="還沒有足夠統計資料。" />
              )}
            </section>

            <section className="chartCard">
              <div className="sectionHeading"><h2>你都怎麼找到餐廳</h2></div>
              {stats.sourceCounts.map((item) => (
                <Bar
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  max={Math.max(1, ...stats.sourceCounts.map((row) => row.value))}
                />
              ))}
            </section>
          </>
        )}

        {view === "history" && (
          <>
            <Header title="紀錄" />
            <section className="pageHeading">
              <p className="eyebrow">YOUR FOOD TRAIL</p>
              <h2>每一次真正做出的選擇</h2>
            </section>
            {!history.length ? (
              <Empty text="按下「今天就吃這家」後，會開始累積可統計的決策紀錄。" />
            ) : (
              <section className="historyList">
                {history.map((entry) => (
                  <article className="historyCard" key={entry.id}>
                    <div>
                      <b>{entry.restaurantName}</b>
                      <small>{entry.cuisine} · {sourceLabel(entry.source)}</small>
                      <time>
                        {new Date(entry.createdAt).toLocaleString("zh-TW", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <span>{entry.decisionSeconds ? formatDecisionDuration(entry.decisionSeconds) : "—"}</span>
                  </article>
                ))}
              </section>
            )}
          </>
        )}

        {view === "detail" && selected && (
          <>
            <Header title="餐廳資訊" />
            <RestaurantGallery restaurant={selected} />
            <section className="detailIdentity">
              <div className="sourceLine">
                <span className="sourceBadge" translate="no">{selected.sourceLabel}</span>
                <span>{selected.lastVerified}</span>
              </div>
              <h1>{selected.name}</h1>
              <p className="detailMeta">
                {ratingText(selected)} · {selected.cuisine}
              </p>

              <div className="factGrid">
                <div><small>距離</small><b>{distanceText(selected)}</b></div>
                <div><small>價格級距</small><b>{restaurantPriceText(selected)}</b></div>
                <div>
                  <small>營業</small>
                  <b className={restaurantOpenState(selected, new Date(clock)).unknown ? "" : restaurantOpenState(selected, new Date(clock)).open ? "good" : "bad"}>
                    {restaurantOpenState(selected, new Date(clock)).label}
                  </b>
                </div>
                <div><small>資料來源</small><b>{selected.sourceLabel}</b></div>
              </div>

              <div className="contactRows">
                <div><span>地址</span><b>{selected.address}</b></div>
                <div><span>電話</span><b>{selected.phone || "尚未取得正式 Places 電話"}</b></div>
              </div>

              <div className="quickActions">
                {selected.googleMapsUrl && (
                  <a href={selected.googleMapsUrl} target="_blank" rel="noreferrer">
                    導航 / Google Maps
                  </a>
                )}
                {selected.phone && <a href={"tel:" + selected.phone}>打電話</a>}
                {selected.menuUrl && (
                  <a href={selected.menuUrl} target="_blank" rel="noreferrer">官方菜單</a>
                )}
                {selected.websiteUrl && <a href={selected.websiteUrl} target="_blank" rel="noreferrer">網站</a>}
                {!selected.menuUrl && <span>菜單來源待接入</span>}
                <span>訂位資訊尚無可信來源</span>
              </div>
            </section>

            <section className="detailCard">
              <p className="eyebrow">WHY THIS PLACE</p>
              <h2>為什麼推薦</h2>
              <p>偏好排序分數 {Math.round(scoreRestaurant(selected, profile).score)}（個人化排序用途，非評分百分比）</p>
              <p><b>Google Places 可查資料：</b>{selected.cuisine}、{ratingText(selected)}、{distanceText(selected)}、{restaurantOpenState(selected, new Date(clock)).label}。</p>
              <p><b>個人偏好：</b>{profile.favoriteCuisines.includes(selected.cuisine) ? `你選過喜歡 ${selected.cuisine}` : "未設定這類料理偏好"}。</p>
              <p><b>推論：</b>{recommendationHint(selected, profile)}；來自偏好規則，並非已查證的店家優點。</p>
              {selected.source === "demo" && <p><b>測試資料備註：</b>{selected.review}</p>}
              <p className="micro">評論摘要、衛生與常見負評尚無可核實訊號；不以 AI 摘要冒充事實。</p>
            </section>

            <section className="detailCard">
              <p className="eyebrow">FIRST VISIT</p>
              <h2>{dishesFor(selected).length ? "第一次來，可以先這樣點" : "餐點資料"}</h2>
              {dishesFor(selected).length ? <div className="menuGrid">
                {dishesFor(selected).map((dish) => (
                  <article key={dish.dishId}>
                    <button onClick={() => { setSelectedDish(dish); eventInSession("dish_detail_view"); }}><b>{dish.name}</b> · 看餐點</button>
                    <span>{dish.price !== undefined ? `NT$ ${dish.price}（${dish.source === "demo" ? "Demo 測試價" : "來源：" + dish.source}）` : "價格尚無可信來源"}</span>
                    <small>資料：{dish.source === "demo" ? "Demo 測試資料" : dish.source} · {dish.sourceFreshness}</small>
                  </article>
                ))}
              </div> : <div className="truthNotice"><b>尚未取得可驗證的菜單</b><span>Google Places 基本資料不包含完整菜單。接入餐廳官方菜單前，這裡不會生成不存在的餐點或價格。</span></div>}
              {selectedDish && selectedDish.restaurantId === selected.id && <div className="detailCard">
                <h3>{selectedDish.name}</h3>
                <p>{selectedDish.recommendationEvidence.join("；")}</p>
                <p className="micro">餐點照片與熱門程度尚無可信來源。</p>
                <button className="primaryMini" onClick={() => recordDecision(selected, selectedSource, selectedDish)}>就吃這個餐點</button>
              </div>}
            </section>

            {selected.source === "demo" && <section className="detailCard">
              <p className="eyebrow">TEST DATA</p>
              <h2>測試資料說明</h2>
              <p>{selected.review}</p>
              <p className="muted">{selected.hygiene}</p>
            </section>}

            <div className="detailActions">
              <button onClick={() => toggleFavorite(selected.id)}>
                {favorites.includes(selected.id) ? "取消收藏" : "收藏"}
              </button>
              <button onClick={() => toggleCompare(selected.id)}>
                {compare.includes(selected.id) ? "✓ 已加入比較" : "＋ 加入比較"}
              </button>
              <button onClick={() => toggleTry(selected.id)}>{foodDatabase.toTry.includes(selected.id) ? "✓ 想吃" : "＋ 想吃"}</button>
              <button onClick={() => toggleVisited(selected.id)}>{foodDatabase.visited.includes(selected.id) ? "✓ 已吃過" : "＋ 標記吃過"}</button>
              <button className="dangerSoft" onClick={() => excludeRestaurant(selected.id)}>
                不喜歡這家
              </button>
            </div>

            <section className="detailCard">
              <h2>我的記錄</h2>
              <label htmlFor="private-note">私人筆記</label>
              <textarea id="private-note" className="textInput" value={foodDatabase.notes[selected.id] || ""} onChange={(event) => setFoodDatabase((current) => ({ ...current, notes: { ...current.notes, [selected.id]: event.target.value } }))} placeholder="只保存在此裝置" />
              <div className="compareInputRow"><input aria-label="新增自訂標籤" placeholder="自訂標籤" value={newTag} onChange={(event) => setNewTag(event.target.value)} />
                <button onClick={() => { if (newTag.trim()) { setFoodDatabase((current) => ({ ...current, tags: { ...current.tags, [selected.id]: [...new Set([...(current.tags[selected.id] || []), newTag.trim()])] } })); setNewTag(""); } }}>加入</button></div>
              <p>{(foodDatabase.tags[selected.id] || []).map((tag) => <button key={tag} onClick={() => setFoodDatabase((current) => ({ ...current, tags: { ...current.tags, [selected.id]: current.tags[selected.id].filter((item) => item !== tag) } }))}>#{tag} ×</button>)}</p>
              {Object.keys(foodDatabase.lists).map((name) => <button key={name} onClick={() => setFoodDatabase((current) => ({ ...current, lists: { ...current.lists, [name]: toggleValue(current.lists[name], selected.id) } }))}>
                {foodDatabase.lists[name].includes(selected.id) ? "✓" : "＋"} {name}</button>)}
            </section>

            <button className="primaryBtn" onClick={() => recordDecision(selected)}>
              今天就吃這家
            </button>
          </>
        )}

        {view === "go" && selected && (
          <>
            <Header title="出發吧" />
            <section className="goHero">
              <Mascot id={profile.mascot} mood="celebrate" size={118} />
              <p className="eyebrow">DECISION MADE</p>
              <h1>今天就吃 {selected.name}。</h1>
              <p>{restaurantOpenState(selected, new Date(clock)).label} · {distanceText(selected)}</p>
              <p className="micro">已記下這次的決定；吃完後可另外標記「吃過」。</p>
            </section>

            <section className="detailCard">
              <h2>出發前再看一次</h2>
              <div className="goSummary">
                <div><span>本次餐點</span><b>{selectedDish?.name || "尚未指定；菜單資料尚待官方來源"}</b></div>
                <div><span>價格</span><b>{restaurantPriceText(selected)}</b></div>
                <div><span>地址</span><b>{selected.address}</b></div>
              </div>
            </section>

            <div className="goActions">
              {selected.googleMapsUrl && (
                <a href={selected.googleMapsUrl} target="_blank" rel="noreferrer">開始導航</a>
              )}
              {selected.phone && <a href={"tel:" + selected.phone}>打電話</a>}
              <button onClick={() => toggleVisited(selected.id)}>{foodDatabase.visited.includes(selected.id) ? "✓ 已標記吃過（點此取消）" : "吃完後標記吃過"}</button>
              <button onClick={() => setView("home")}>回首頁</button>
            </div>
          </>
        )}

        {view === "settings" && (
          <>
            <Header title="我的設定" />
            <section className="settingsHero">
              <p className="eyebrow">MAKE IT YOURS</p>
              <h1>{profile.name ? profile.name + " 的美食設定" : "我的美食設定"}</h1>
              <p className="muted">
                四套模板維持同一套資訊架構，但視覺語言各自完整，不做混搭。
              </p>
            </section>

            <SettingsSection title="介面主題">
              <div className="themeGrid compact">
                {THEME_OPTIONS.map((theme) => (
                  <ThemeChoice
                    key={theme.id}
                    theme={theme}
                    selected={profile.theme === theme.id}
                    onClick={() => setProfile((current) => ({ ...current, theme: theme.id }))}
                  />
                ))}
              </div>
            </SettingsSection>

            <SettingsSection title="陪伴角色">
              <div className="mascotRow">
                {MASCOTS.map((item) => (
                  <button
                    key={item.id}
                    className={"mascotChoice " + (profile.mascot === item.id ? "selected" : "")}
                    onClick={() => setProfile((current) => ({ ...current, mascot: item.id }))}
                  >
                    <Mascot id={item.id} size={48} />
                    <b>{item.label}</b>
                    <small>{item.note}</small>
                  </button>
                ))}
              </div>
            </SettingsSection>

            <SettingsSection title="喜歡的料理">
              <ChoiceGrid
                options={CUISINE_OPTIONS}
                selected={profile.favoriteCuisines}
                onToggle={(value) =>
                  setProfile((current) => ({
                    ...current,
                    favoriteCuisines: toggleValue(current.favoriteCuisines, value),
                  }))
                }
              />
            </SettingsSection>

            <SettingsSection title="常用條件">
              <div className="stackFields">
                <label>
                  預設步行
                  <select
                    value={profile.walk}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, walk: Number(event.target.value) }))
                    }
                  >
                    <option value={5}>5 分鐘</option>
                    <option value={10}>10 分鐘</option>
                    <option value={15}>15 分鐘</option>
                    <option value={20}>20 分鐘</option>
                  </select>
                </label>
                <label>
                  每人預算
                  <select
                    value={profile.priceBand}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        priceBand: event.target.value as Profile["priceBand"],
                      }))
                    }
                  >
                    {PRICE_BANDS.map((band) => (
                      <option key={band.id} value={band.id}>{band.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </SettingsSection>

            <SettingsSection title="不喜歡的餐廳">
              {profile.excludedRestaurantIds.length ? (
                <div className="excludedList">
                  {profile.excludedRestaurantIds.map((id) => {
                    const restaurant = knownRestaurants.find((item) => item.id === id);
                    return (
                      <button
                        key={id}
                        onClick={() =>
                          setProfile((current) => ({
                            ...current,
                            excludedRestaurantIds: current.excludedRestaurantIds.filter(
                              (item) => item !== id,
                            ),
                          }))
                        }
                      >
                        恢復推薦 · {restaurant?.name || id}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="muted">目前沒有永久排除的餐廳。</p>
              )}
            </SettingsSection>

            <button className="dangerBtn" onClick={resetProfile}>
              重新設定這個 App
            </button>
          </>
        )}

        <nav className="bottomNav four">
          <button className={view === "home" ? "active" : ""} onClick={goHome}>
            <span className="navIcon"><LineIcon kind="home" /></span><span>首頁</span>
          </button>
          <button className={view === "favorites" ? "active" : ""} onClick={() => leaveTo("favorites")}>
            <span className="navIcon"><LineIcon kind="heart" /></span><span>收藏</span>
          </button>
          <button className={view === "stats" || view === "history" ? "active" : ""} onClick={() => leaveTo("stats")}>
            <span className="navIcon"><LineIcon kind="chart" /></span><span>統計</span>
          </button>
          <button className={view === "settings" ? "active" : ""} onClick={() => leaveTo("settings")}>
            <span className="navIcon"><LineIcon kind="user" /></span><span>我的</span>
          </button>
        </nav>
      </div>
    </main>
  );
}

function Onboarding({
  profile,
  step,
  onStep,
  onChange,
  onFinish,
}: {
  profile: Profile;
  step: number;
  onStep: (step: number) => void;
  onChange: (profile: Profile) => void;
  onFinish: () => void;
}) {
  const update = (patch: Partial<Profile>) => onChange({ ...profile, ...patch });

  return (
    <main className="onboardingShell">
      <section className="onboardingCard">
        <div className="onboardingTop">
          <div className="brandMark"><LineIcon kind="bowl" /></div>
          {step > 0 && (
            <button className="textBack" onClick={() => onStep(step - 1)}>← 上一步</button>
          )}
        </div>

        <div className="progressTrack">
          <span style={{ width: String(((step + 1) / 5) * 100) + "%" }} />
        </div>

        {step === 0 && (
          <div className="onboardingStage welcomeStage">
            <p className="eyebrow">歡迎來到</p>
            <h1>今天吃什麼？</h1>
            <p className="lead">讓它慢慢記住你喜歡怎麼吃，也記住你花多久才做出決定。</p>
            <div className="welcomeMascots">
              <Mascot id="cat" mood="hello" size={86} />
              <Mascot id="dog" mood="hello" size={78} />
              <Mascot id="rabbit" mood="hello" size={78} />
              <Mascot id="fox" mood="hello" size={78} />
            </div>
            <button className="primaryBtn" onClick={() => onStep(1)}>建立我的口味</button>
            <button className="ghostBtn" onClick={() => onStep(2)}>先逛逛也可以</button>
          </div>
        )}

        {step === 1 && (
          <div className="onboardingStage">
            <p className="eyebrow">登入與同步</p>
            <h1>換手機，也希望它還記得你。</h1>
            <div className="loginOptions">
              {(["google", "apple", "email", "guest"] as const).map((mode) => (
                <button
                  key={mode}
                  className={profile.entryMode === mode ? "selected" : ""}
                  onClick={() => update({ entryMode: mode })}
                >
                  <span>{mode === "google" ? "G" : mode === "apple" ? "A" : mode === "email" ? "@" : "訪"}</span>
                  <b>
                    {mode === "google"
                      ? "使用 Google"
                      : mode === "apple"
                        ? "使用 Apple"
                        : mode === "email"
                          ? "使用 Email"
                          : "先用本機模式"}
                  </b>
                  <em>{profile.entryMode === mode ? "已選擇" : "選擇"}</em>
                </button>
              ))}
            </div>
            {profile.entryMode === "email" && (
              <input
                className="textInput"
                placeholder="你的 Email"
                value={profile.email}
                onChange={(event) => update({ email: event.target.value })}
              />
            )}
            <button className="primaryBtn" onClick={() => onStep(2)}>下一步</button>
          </div>
        )}

        {step === 2 && (
          <div className="onboardingStage">
            <p className="eyebrow">建立偏好</p>
            <h1>先告訴我你平常比較想吃什麼。</h1>
            <label className="fieldLabel">怎麼稱呼你？</label>
            <input
              className="textInput"
              value={profile.name}
              placeholder="可以留白"
              onChange={(event) => update({ name: event.target.value })}
            />
            <label className="fieldLabel">喜歡的料理</label>
            <ChoiceGrid
              options={CUISINE_OPTIONS}
              selected={profile.favoriteCuisines}
              onToggle={(value) =>
                update({ favoriteCuisines: toggleValue(profile.favoriteCuisines, value) })
              }
            />
            <button className="primaryBtn" onClick={() => onStep(3)}>下一步</button>
          </div>
        )}

        {step === 3 && (
          <div className="onboardingStage">
            <p className="eyebrow">再補幾個習慣</p>
            <h1>少一點踩雷，多一點「就是這個」。</h1>
            <label className="fieldLabel">忌口／不喜歡</label>
            <ChoiceGrid
              options={AVOIDANCE_OPTIONS}
              selected={profile.avoidances}
              onToggle={(value) => update({ avoidances: toggleValue(profile.avoidances, value) })}
            />
            <label className="fieldLabel">常見情境</label>
            <ChoiceGrid
              options={DINING_CONTEXT_OPTIONS}
              selected={profile.diningContexts}
              onToggle={(value) =>
                update({ diningContexts: toggleValue(profile.diningContexts, value) })
              }
            />
            <div className="miniFields">
              <label>
                步行
                <select value={profile.walk} onChange={(event) => update({ walk: Number(event.target.value) })}>
                  <option value={5}>5 分</option>
                  <option value={10}>10 分</option>
                  <option value={15}>15 分</option>
                  <option value={20}>20 分</option>
                </select>
              </label>
              <label>
                預算
                <select
                  value={profile.priceBand}
                  onChange={(event) => update({ priceBand: event.target.value as Profile["priceBand"] })}
                >
                  {PRICE_BANDS.map((band) => <option value={band.id} key={band.id}>{band.label}</option>)}
                </select>
              </label>
            </div>
            <button className="primaryBtn" onClick={() => onStep(4)}>選擇我的風格</button>
          </div>
        )}

        {step === 4 && (
          <div className="onboardingStage">
            <p className="eyebrow">最後一步</p>
            <h1>選一套每天都願意打開的樣子。</h1>
            <div className="themeGrid">
              {THEME_OPTIONS.map((theme) => (
                <ThemeChoice
                  key={theme.id}
                  theme={theme}
                  selected={profile.theme === theme.id}
                  onClick={() => update({ theme: theme.id })}
                />
              ))}
            </div>
            <label className="fieldLabel">選一位小夥伴</label>
            <div className="mascotRow">
              {MASCOTS.map((item) => (
                <button
                  key={item.id}
                  className={"mascotChoice " + (profile.mascot === item.id ? "selected" : "")}
                  onClick={() => update({ mascot: item.id })}
                >
                  <Mascot id={item.id} size={52} />
                  <b>{item.label}</b>
                  <small>{item.note}</small>
                </button>
              ))}
            </div>
            <button className="primaryBtn" onClick={onFinish}>開始探索</button>
          </div>
        )}
      </section>
    </main>
  );
}

function ThemeChoice({
  theme,
  selected,
  onClick,
}: {
  theme: (typeof THEME_OPTIONS)[number];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button className={"themeChoice " + (selected ? "selected" : "")} onClick={onClick}>
      <div className={"themeMini " + theme.id}>
        <span className="themeCode">{theme.code}</span>
        <div className="miniHero" />
        <div className="miniCards"><span /><span /><span /><span /></div>
      </div>
      <div className="themeChoiceText">
        <strong>{theme.name}</strong>
        <small>{theme.desc}</small>
        <em>{selected ? "已選擇" : theme.note}</em>
      </div>
    </button>
  );
}

function ChoiceGrid({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="choiceGrid">
      {options.map((option) => (
        <button
          key={option}
          className={selected.includes(option) ? "selected" : ""}
          onClick={() => onToggle(option)}
        >
          {selected.includes(option) && <span>✓</span>}
          {option}
        </button>
      ))}
    </div>
  );
}

function RestaurantCard({
  restaurant,
  favorite,
  compared,
  onFavorite,
  onCompare,
  onOpen,
  hint,
  addMode = false,
}: {
  restaurant: Restaurant;
  favorite: boolean;
  compared: boolean;
  onFavorite: () => void;
  onCompare: () => void;
  onOpen: () => void;
  hint?: string;
  addMode?: boolean;
}) {
  const open = restaurantOpenState(restaurant);

  return (
    <article className="restaurantCard enriched">
      <button className="foodThumb visualThumb" onClick={onOpen}>
        <span>{restaurant.cuisine}</span>
        <b>{restaurant.signature[0] || restaurant.name.slice(0, 5)}</b>
      </button>
      <button className="restaurantInfo" onClick={onOpen}>
        <div className="restaurantLine">
          <b>{restaurant.name}</b>
          <span className={open.unknown ? "" : open.open ? "good" : "bad"}>{open.label}</span>
        </div>
        <p>{ratingText(restaurant)} · {restaurant.cuisine}</p>
        <p>{distanceText(restaurant)} · {restaurantPriceText(restaurant)}</p>
        {hint && <p className="matchHint">推薦依據：{hint}</p>}
        <small className="sourceMark" translate="no">{restaurant.sourceLabel}</small>
      </button>
      <div className="cardActions">
        <button className={favorite ? "selected" : ""} onClick={onFavorite} aria-label={favorite ? "取消收藏" : "收藏"}><LineIcon kind="heart" /></button>
        <button
          className={compared ? "selected" : ""}
          onClick={onCompare}
          aria-label={compared ? "移出比較" : "加入比較"}
        >
          {compared ? "✓" : addMode ? "＋" : "＋"}
        </button>
      </div>
    </article>
  );
}

function RestaurantGallery({ restaurant }: { restaurant: Restaurant }) {
  if (!restaurant.photoLabels.length) {
    return <section className="truthNotice"><b>照片尚未載入</b><span>目前只使用 Google Places 基本欄位；照片會在受限制的照片端點與用量上限完成後加入。</span></section>;
  }
  return (
    <section className="galleryShell">
      <div className="galleryTrack">
        {restaurant.photoLabels.map((label, index) => (
          <article className={"galleryCard g" + String(index + 1)} key={label}>
            <span>{restaurant.sourceLabel}</span>
            <b>{label}</b>
            <small>餐廳資料來源：{restaurant.sourceLabel}</small>
          </article>
        ))}
      </div>
      <div className="galleryDots">
        {restaurant.photoLabels.map((_, index) => <span key={index} />)}
      </div>
    </section>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return <article className="statCard"><strong>{value}</strong><span>{label}</span></article>;
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="barRow">
      <div><span>{label}</span><b>{value}</b></div>
      <div className="barTrack">
        <span style={{ width: String(Math.max(8, (value / max) * 100)) + "%" }} />
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="settingsSection"><h2>{title}</h2>{children}</section>;
}

function LineIcon({ kind }: { kind: "bowl" | "dice" | "pin" | "compare" | "search" | "home" | "heart" | "chart" | "user" }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return <svg className="lineIcon" viewBox="0 0 24 24" aria-hidden="true">
    {kind === "bowl" && <><path {...common} d="M4 10h16c-.4 5.2-3.2 8-8 8s-7.6-2.8-8-8Z"/><path {...common} d="M7 21h10M8 7c0-1.4 1-2 2-3M13 7c0-1.4 1-2 2-3"/></>}
    {kind === "dice" && <><rect {...common} x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/></>}
    {kind === "pin" && <><path {...common} d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle {...common} cx="12" cy="9" r="2.3"/></>}
    {kind === "compare" && <><path {...common} d="M12 4v16M6 7h12M8 7l-3 6h6L8 7Zm8 0-3 6h6l-3-6ZM5 13c.4 2 1.4 3 3 3s2.6-1 3-3m2 0c.4 2 1.4 3 3 3s2.6-1 3-3"/></>}
    {kind === "search" && <><circle {...common} cx="10.5" cy="10.5" r="6"/><path {...common} d="m15 15 5 5"/></>}
    {kind === "home" && <><path {...common} d="m4 11 8-7 8 7v9h-6v-6h-4v6H4v-9Z"/></>}
    {kind === "heart" && <><path {...common} d="M20 8.7c0 5-8 10-8 10s-8-5-8-10C4 5.9 5.9 4 8.4 4c1.5 0 2.8.8 3.6 2 0 0 1.4-2 3.7-2C18.2 4 20 5.9 20 8.7Z"/></>}
    {kind === "chart" && <><path {...common} d="M5 20V10h4v10H5Zm6 0V4h4v16h-4Zm6 0v-7h4v7h-4Z"/></>}
    {kind === "user" && <><circle {...common} cx="12" cy="8" r="4"/><path {...common} d="M4.5 21c.8-4.2 3.3-6.3 7.5-6.3s6.7 2.1 7.5 6.3"/></>}
  </svg>;
}

function Empty({ text }: { text: string }) {
  return <div className="emptyState"><div aria-hidden="true">餐</div><p>{text}</p></div>;
}
