"use client";

import { useEffect, useMemo, useState } from "react";
import Mascot from "../components/Mascot";
import {
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
  DEMO_RESTAURANTS,
  DINING_CONTEXT_OPTIONS,
  type HistoryEntry,
  MASCOTS,
  moneyText,
  normalizeStoredProfile,
  PRICE_BANDS,
  priceBandMax,
  type Profile,
  type Restaurant,
  restaurantOpenState,
  THEME_OPTIONS,
  type ViewId,
} from "../lib/product";
import { rankRestaurants, recommendationHint, weightedPick } from "../lib/recommendation";

const PROFILE_KEY = "wte_profile";
const FAVORITES_KEY = "wte_favorites";
const COMPARE_KEY = "wte_compare";
const HISTORY_KEY = "wte_history";

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function sourceLabel(source: HistoryEntry["source"]) {
  return {
    roulette: "不知道吃什麼",
    nearby: "附近有什麼",
    compare: "幫我選",
    category: "想吃這一類",
  }[source];
}

export default function V15Client() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [hydrated, setHydrated] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [view, setView] = useState<ViewId>("home");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [selectedSource, setSelectedSource] = useState<HistoryEntry["source"]>("category");
  const [selectedCuisine, setSelectedCuisine] = useState("全部");
  const [search, setSearch] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [minRating, setMinRating] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [rouletteWinner, setRouletteWinner] = useState<Restaurant | null>(null);
  const [skipIds, setSkipIds] = useState<string[]>([]);
  const [decisionStartedAt, setDecisionStartedAt] = useState<number | null>(null);
  const [decisionCandidates, setDecisionCandidates] = useState(0);
  const [location, setLocation] = useState<ResolvedLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState("尚未定位");
  const [installTip, setInstallTip] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop" | "standalone">("desktop");
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>("month");
  const [compareInputs, setCompareInputs] = useState(["", ""]);
  const [compareNotice, setCompareNotice] = useState("");
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) setProfile(normalizeStoredProfile(JSON.parse(raw)));
      const fav = localStorage.getItem(FAVORITES_KEY);
      if (fav) setFavorites(JSON.parse(fav));
      const cmp = localStorage.getItem(COMPARE_KEY);
      if (cmp) setCompare(JSON.parse(cmp));
      const hist = localStorage.getItem(HISTORY_KEY);
      if (hist) setHistory(JSON.parse(hist));
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
    if (!hydrated) return;
    document.documentElement.dataset.theme = profile.theme;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    localStorage.setItem(COMPARE_KEY, JSON.stringify(compare));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [profile, favorites, compare, history, hydrated]);

  const budgetMax = priceBandMax(profile.priceBand);

  const eligible = useMemo(
    () =>
      DEMO_RESTAURANTS.filter((restaurant) => {
        if (profile.excludedRestaurantIds.includes(restaurant.id)) return false;
        if (onlyOpen && !restaurantOpenState(restaurant, new Date(clock)).open) return false;
        if (profile.walk && restaurant.walk > profile.walk) return false;
        if (budgetMax && restaurant.priceMin > budgetMax) return false;
        if (minRating && restaurant.rating < minRating) return false;
        return true;
      }),
    [profile.excludedRestaurantIds, profile.walk, budgetMax, onlyOpen, minRating, clock],
  );

  const recommended = useMemo(
    () => rankRestaurants(eligible, profile).slice(0, 3),
    [eligible, profile],
  );

  const roulettePool = useMemo(
    () => eligible.filter((restaurant) => !skipIds.includes(restaurant.id)),
    [eligible, skipIds],
  );

  const categoryResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DEMO_RESTAURANTS.filter((restaurant) => {
      if (profile.excludedRestaurantIds.includes(restaurant.id)) return false;
      if (selectedCuisine !== "全部" && restaurant.cuisine !== selectedCuisine) return false;
      if (!q) return true;
      return (
        restaurant.name.toLowerCase().includes(q) ||
        restaurant.cuisine.toLowerCase().includes(q) ||
        restaurant.signature.some((dish) => dish.toLowerCase().includes(q))
      );
    });
  }, [search, selectedCuisine, profile.excludedRestaurantIds]);

  const compareRestaurants = compare
    .map((id) => DEMO_RESTAURANTS.find((restaurant) => restaurant.id === id))
    .filter(Boolean) as Restaurant[];

  const stats = useMemo(
    () => buildFoodStats(filterHistoryByPeriod(history, statsPeriod)),
    [history, statsPeriod],
  );

  function beginDecision(source: HistoryEntry["source"], candidates: number, nextView: ViewId) {
    setDecisionStartedAt(Date.now());
    setDecisionCandidates(candidates);
    setSelectedSource(source);
    if (source === "roulette") {
      setRouletteWinner(null);
      setSkipIds([]);
    }
    setView(nextView);
  }

  function recordDecision(restaurant: Restaurant, source = selectedSource) {
    const seconds = decisionStartedAt
      ? Math.max(1, Math.round((Date.now() - decisionStartedAt) / 1000))
      : undefined;

    const entry: HistoryEntry = {
      id: restaurant.id + "-" + Date.now(),
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      cuisine: restaurant.cuisine,
      source,
      createdAt: new Date().toISOString(),
      decisionSeconds: seconds,
      candidateCount: source === "compare" ? Math.max(compare.length, decisionCandidates) || undefined : decisionCandidates || undefined,
    };

    setHistory((current) => [entry, ...current].slice(0, 200));
    setDecisionStartedAt(null);
    setDecisionCandidates(0);
    setSelected(restaurant);
    setView("go");
  }

  function toggleFavorite(id: string) {
    setFavorites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleCompare(id: string) {
    setCompare((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 5) return current;
      return [...current, id];
    });
  }

  function excludeRestaurant(id: string) {
    setProfile((current) => ({
      ...current,
      excludedRestaurantIds: [...new Set([...current.excludedRestaurantIds, id])],
    }));
    setCompare((current) => current.filter((item) => item !== id));
    setRouletteWinner(null);
  }

  async function locate() {
    setLocationStatus("正在取得 GPS 與附近地址…");
    try {
      const resolved = await resolveBrowserLocation();
      setLocation(resolved);
      setLocationStatus(resolved.label);
    } catch {
      setLocationStatus("定位失敗，請確認瀏覽器的位置權限");
    }
  }

  function spin() {
    if (spinning || !roulettePool.length) return;
    setSpinning(true);
    setRouletteWinner(null);
    window.setTimeout(() => {
      const winner = weightedPick(roulettePool, profile) || roulettePool[0];
      setRouletteWinner(winner);
      setSpinning(false);
    }, 1800);
  }

  function openDetail(restaurant: Restaurant, source: HistoryEntry["source"]) {
    if (!decisionStartedAt) {
      setDecisionStartedAt(Date.now());
      setDecisionCandidates(source === "compare" ? Math.max(compare.length, 1) : 1);
    }
    setSelected(restaurant);
    setSelectedSource(source);
    setView("detail");
  }

  function addCompareFromInput(raw: string) {
    if (!raw.trim()) {
      setCompareNotice("請先貼上 Google Maps 網址或輸入餐廳名稱。");
      return;
    }
    const text = decodeURIComponent(raw).replace(/\+/g, " ");
    let matched = DEMO_RESTAURANTS.find(
      (restaurant) => text.includes(restaurant.name) || restaurant.name.includes(text.trim()),
    );

    if (!matched) {
      const match = text.match(/\/place\/([^/]+)/i);
      const place = match?.[1]?.replace(/\+/g, " ");
      if (place) {
        matched = DEMO_RESTAURANTS.find(
          (restaurant) => place.includes(restaurant.name) || restaurant.name.includes(place),
        );
      }
    }

    if (matched) {
      if (!compare.includes(matched.id)) toggleCompare(matched.id);
      setCompareNotice("已加入：" + matched.name);
      return;
    }

    setCompareNotice(
      "已收到這個輸入；Preview 尚未接 Places Proxy。正式資料層接通後，Google Maps 短網址與 Place ID 會在這裡自動解析。",
    );
  }

  function resetProfile() {
    setProfile(DEFAULT_PROFILE);
    setFavorites([]);
    setCompare([]);
    setHistory([]);
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
        <button className="iconBtn" onClick={() => setView("home")} aria-label="回首頁">
          ←
        </button>
      ) : (
        <div className="brandMini">今天吃什麼？</div>
      )}
      <div className="topTitle">{title}</div>
      <button className="iconBtn" onClick={() => setView("settings")} aria-label="設定">
        ⚙
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

            <section className="modeGrid">
              <button
                className="modeCard coral"
                onClick={() => beginDecision("roulette", eligible.length, "roulette")}
              >
                <span>🎰</span>
                <b>不知道吃什麼</b>
                <small>真的轉一輪，幫你決定</small>
              </button>
              <button
                className="modeCard mint"
                onClick={() => beginDecision("nearby", eligible.length, "nearby")}
              >
                <span>📍</span>
                <b>附近有什麼</b>
                <small>位置、距離與營業狀態</small>
              </button>
              <button
                className="modeCard gold"
                onClick={() => beginDecision("compare", compare.length, "compare")}
              >
                <span>＋</span>
                <b>幫我選</b>
                <small>貼連結或把餐廳放一起比</small>
              </button>
              <button
                className="modeCard sky"
                onClick={() => beginDecision("category", categoryResults.length, "category")}
              >
                <span>⌕</span>
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
                <span>🚶 {profile.walk} 分鐘內</span>
                <span>💰 {PRICE_BANDS.find((item) => item.id === profile.priceBand)?.label}</span>
                <button onClick={() => setMinRating((current) => (current ? 0 : 4.5))}>
                  ★ {minRating ? String(minRating) + "+" : "評分不限"}
                </button>
                <button className={onlyOpen ? "active" : ""} onClick={() => setOnlyOpen(!onlyOpen)}>
                  ◷ {onlyOpen ? "只看營業中" : "營業不限"}
                </button>
              </div>
            </section>

            {platform !== "standalone" && (
              <>
                <button className="installHint" onClick={() => setInstallTip(!installTip)}>
                  📲 加到手機主畫面
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
              <p className="eyebrow">LUCKY PICK</p>
              <h1>真的讓它轉一輪。</h1>
              <p className="muted">候選只來自你的距離、預算、評分與排除清單。</p>
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
                </div>
                <div className="slotPointer">▶</div>
              </div>
              <button
                className="spinBtn"
                disabled={!roulettePool.length || spinning}
                onClick={spin}
              >
                {spinning ? "轉動中…" : "🎰 幫我選一個"}
              </button>
            </section>

            {rouletteWinner && (
              <section className="winnerCard">
                <div className="winnerTop">
                  <div>
                    <span className="sourceBadge">{rouletteWinner.sourceLabel}</span>
                    <h2>{rouletteWinner.name}</h2>
                    <p>
                      ★ {rouletteWinner.rating}（{rouletteWinner.reviewCount.toLocaleString()}） · 🚶{" "}
                      {rouletteWinner.walk} 分 ·{" "}
                      {moneyText(rouletteWinner.priceMin, rouletteWinner.priceMax)}
                    </p>
                  </div>
                  <Mascot id={profile.mascot} mood="celebrate" size={72} />
                </div>
                <p className="muted">{recommendationHint(rouletteWinner, profile)}</p>
                <div className="winnerActions">
                  <button className="primaryMini" onClick={() => openDetail(rouletteWinner, "roulette")}>
                    看詳細資料
                  </button>
                  <button onClick={() => recordDecision(rouletteWinner, "roulette")}>就吃這家</button>
                  <button
                    onClick={() => {
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
                <span className="mapPin">●</span>
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
                        ? "OpenStreetMap 測試"
                        : "GPS"}
                  </p>
                )}
                <button className="secondaryBtn" onClick={locate}>
                  📍 {location ? "重新定位" : "取得目前位置"}
                </button>
              </div>
            </section>

            <p className="integrationNote">
              <b>資料誠實標示：</b>
              目前餐廳仍為 Demo；位置已可取得真實 GPS。正式 Places
              連線後，地址、距離、評分、照片與營業狀態會改為即時資料。
            </p>

            <section className="restaurantList">
              {eligible.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  favorite={favorites.includes(restaurant.id)}
                  compared={compare.includes(restaurant.id)}
                  onFavorite={() => toggleFavorite(restaurant.id)}
                  onCompare={() => toggleCompare(restaurant.id)}
                  onOpen={() => openDetail(restaurant, "nearby")}
                />
              ))}
            </section>
          </>
        )}

        {view === "compare" && (
          <>
            <Header title="幫我選" />
            <section className="compareBuilder">
              <p className="eyebrow">GOOGLE MAPS / NAME</p>
              <h2>貼連結或直接輸入店名</h2>
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
                        <span>★ {restaurant.rating}（{restaurant.reviewCount.toLocaleString()}）</span>
                        <span>🚶 {restaurant.walk} 分</span>
                        <span>{moneyText(restaurant.priceMin, restaurant.priceMax)}</span>
                        <span className={open.open ? "good" : "bad"}>{open.label}</span>
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

            <section className="sectionBlock">
              <div className="sectionHeading">
                <h2>也可以直接加餐廳</h2>
                <span>{compare.length}/5</span>
              </div>
              <div className="restaurantList">
                {DEMO_RESTAURANTS.map((restaurant) => (
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
              </div>
            </section>
          </>
        )}

        {view === "category" && (
          <>
            <Header title="想吃這一類" />
            <section className="searchPanel">
              <p className="eyebrow">SEARCH BY MOOD</p>
              <h2>今天腦中已經有一點方向？</h2>
              <input
                className="textInput"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜尋店名、料理或餐點"
              />
              <div className="horizontalChips">
                {["全部", ...CUISINE_OPTIONS].map((cuisine) => (
                  <button
                    key={cuisine}
                    className={selectedCuisine === cuisine ? "selected" : ""}
                    onClick={() => setSelectedCuisine(cuisine)}
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
          </>
        )}

        {view === "favorites" && (
          <>
            <Header title="收藏" />
            <section className="pageHeading">
              <p className="eyebrow">SAVED</p>
              <h2>下次想吃，不必再找一次</h2>
            </section>
            <section className="restaurantList">
              {DEMO_RESTAURANTS.filter((restaurant) => favorites.includes(restaurant.id)).map(
                (restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    favorite
                    compared={compare.includes(restaurant.id)}
                    onFavorite={() => toggleFavorite(restaurant.id)}
                    onCompare={() => toggleCompare(restaurant.id)}
                    onOpen={() => openDetail(restaurant, "category")}
                  />
                ),
              )}
            </section>
            {!favorites.length && <Empty text="看到想再吃的店，就按一下愛心。" />}
          </>
        )}

        {view === "stats" && (
          <>
            <Header title="我的飲食統計" />
            <section className="statsHeader">
              <p className="eyebrow">FOOD HABITS</p>
              <h1>看看你到底怎麼決定吃什麼。</h1>
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
              <StatCard value={String(stats.decisions)} label="完成選餐" />
              <StatCard value={String(stats.candidates)} label="累計候選家次" />
              <StatCard value={formatDecisionDuration(stats.averageDecisionSeconds)} label="平均決定時間" />
              <StatCard value={String(stats.slowDecisions)} label="超過 10 分鐘" />
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
              {stats.slowDecisions > 0 && (
                <p className="funNote">
                  本期有 {stats.slowDecisions} 次考慮超過 10 分鐘——今天可能真的有一點選擇障礙。
                </p>
              )}
            </section>

            <section className="chartCard">
              <div className="sectionHeading"><h2>料理偏好</h2></div>
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
                <span className="sourceBadge">{selected.sourceLabel}</span>
                <span>{selected.lastVerified}</span>
              </div>
              <h1>{selected.name}</h1>
              <p className="detailMeta">
                ★ {selected.rating}（{selected.reviewCount.toLocaleString()} 則） · {selected.cuisine}
              </p>

              <div className="factGrid">
                <div><small>步行</small><b>{selected.walk} 分 · {selected.distance}m</b></div>
                <div><small>每人預算</small><b>{moneyText(selected.priceMin, selected.priceMax)}</b></div>
                <div>
                  <small>營業</small>
                  <b className={restaurantOpenState(selected, new Date(clock)).open ? "good" : "bad"}>
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
              </div>
            </section>

            <section className="detailCard">
              <p className="eyebrow">FIRST VISIT</p>
              <h2>第一次來，可以先這樣點</h2>
              <div className="menuGrid">
                {selected.menuItems.map((item) => (
                  <article key={item.name}>
                    <b>{item.name}</b>
                    <span>{item.price ? "NT$ " + String(item.price) : "價格待官方來源"}</span>
                    <small>{item.source === "demo" ? "Demo 菜單資料" : "可信來源"}</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="detailCard">
              <p className="eyebrow">QUICK READ</p>
              <h2>快速摘要</h2>
              <p>{selected.review}</p>
              <p className="muted">{selected.hygiene}</p>
            </section>

            <div className="detailActions">
              <button onClick={() => toggleFavorite(selected.id)}>
                {favorites.includes(selected.id) ? "♥ 已收藏" : "♡ 收藏"}
              </button>
              <button onClick={() => toggleCompare(selected.id)}>
                {compare.includes(selected.id) ? "✓ 已加入比較" : "＋ 加入比較"}
              </button>
              <button className="dangerSoft" onClick={() => excludeRestaurant(selected.id)}>
                不喜歡這家
              </button>
            </div>

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
              <p>{restaurantOpenState(selected, new Date(clock)).label} · 🚶 {selected.walk} 分鐘</p>
            </section>

            <section className="detailCard">
              <h2>出發前再看一次</h2>
              <div className="goSummary">
                <div><span>推薦點法</span><b>{selected.signature.slice(0, 2).join("＋")}</b></div>
                <div><span>預算</span><b>{moneyText(selected.priceMin, selected.priceMax)}</b></div>
                <div><span>地址</span><b>{selected.address}</b></div>
              </div>
            </section>

            <div className="goActions">
              {selected.googleMapsUrl && (
                <a href={selected.googleMapsUrl} target="_blank" rel="noreferrer">開始導航</a>
              )}
              {selected.phone && <a href={"tel:" + selected.phone}>打電話</a>}
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
                    const restaurant = DEMO_RESTAURANTS.find((item) => item.id === id);
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

        <nav className="bottomNav five">
          <button className={view === "home" ? "active" : ""} onClick={() => setView("home")}>
            <span className="navIcon">⌂</span><span>首頁</span>
          </button>
          <button className={view === "favorites" ? "active" : ""} onClick={() => setView("favorites")}>
            <span className="navIcon">♡</span><span>收藏</span>
          </button>
          <button className={view === "stats" ? "active" : ""} onClick={() => setView("stats")}>
            <span className="navIcon">▥</span><span>統計</span>
          </button>
          <button className={view === "history" ? "active" : ""} onClick={() => setView("history")}>
            <span className="navIcon">◷</span><span>紀錄</span>
          </button>
          <button className={view === "settings" ? "active" : ""} onClick={() => setView("settings")}>
            <span className="navIcon">◎</span><span>我的</span>
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
          <div className="brandMark">🍚</div>
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
                  <span>{mode === "google" ? "G" : mode === "apple" ? "●" : mode === "email" ? "✉" : "→"}</span>
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
        <b>{restaurant.signature[0]}</b>
      </button>
      <button className="restaurantInfo" onClick={onOpen}>
        <div className="restaurantLine">
          <b>{restaurant.name}</b>
          <span className={open.open ? "good" : "bad"}>{open.open ? "營業中" : "休息"}</span>
        </div>
        <p>★ {restaurant.rating}（{restaurant.reviewCount.toLocaleString()}） · {restaurant.cuisine}</p>
        <p>🚶 {restaurant.walk} 分 · {moneyText(restaurant.priceMin, restaurant.priceMax)}</p>
        {hint && <p className="matchHint">✨ {hint}</p>}
        <small className="demoMark">{restaurant.sourceLabel}</small>
      </button>
      <div className="cardActions">
        <button onClick={onFavorite}>{favorite ? "♥" : "♡"}</button>
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
  return (
    <section className="galleryShell">
      <div className="galleryTrack">
        {restaurant.photoLabels.map((label, index) => (
          <article className={"galleryCard g" + String(index + 1)} key={label}>
            <span>DEMO VISUAL</span>
            <b>{label}</b>
            <small>正式 Places 連線後由真實餐廳照片取代</small>
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

function Empty({ text }: { text: string }) {
  return <div className="emptyState"><div>🍽</div><p>{text}</p></div>;
}
