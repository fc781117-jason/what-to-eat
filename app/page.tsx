"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AVOIDANCE_OPTIONS,
  CUISINE_OPTIONS,
  DEFAULT_PROFILE,
  DEMO_RESTAURANTS,
  DINING_CONTEXT_OPTIONS,
  HistoryEntry,
  MASCOTS,
  moneyText,
  normalizeStoredProfile,
  PRICE_BANDS,
  priceBandMax,
  Profile,
  Restaurant,
  THEME_OPTIONS,
  ViewId,
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

export default function HomePage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [hydrated, setHydrated] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [view, setView] = useState<ViewId>("home");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>(["r1", "r3"]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [selectedCuisine, setSelectedCuisine] = useState("全部");
  const [search, setSearch] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [minRating, setMinRating] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [slotCuisine, setSlotCuisine] = useState("今天的驚喜");
  const [slotRestaurant, setSlotRestaurant] = useState("準備好了嗎？");
  const [locationText, setLocationText] = useState("尚未定位");
  const [installTip, setInstallTip] = useState(false);

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
    } catch {
      // Keep safe defaults if old local data cannot be parsed.
    }

    if ("serviceWorker" in navigator) {
      const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
      navigator.serviceWorker.register(`${base}/sw.js`).catch(() => {});
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.theme = profile.theme;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    localStorage.setItem(COMPARE_KEY, JSON.stringify(compare));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [profile, favorites, compare, history, hydrated]);

  const mascot = MASCOTS.find((item) => item.id === profile.mascot);
  const budgetMax = priceBandMax(profile.priceBand);

  const eligible = useMemo(
    () =>
      DEMO_RESTAURANTS.filter((restaurant) => {
        if (onlyOpen && !restaurant.open) return false;
        if (profile.walk && restaurant.walk > profile.walk) return false;
        if (budgetMax && restaurant.priceMin > budgetMax) return false;
        if (minRating && restaurant.rating < minRating) return false;
        return true;
      }),
    [onlyOpen, profile.walk, budgetMax, minRating],
  );

  const recommended = useMemo(
    () => rankRestaurants(eligible, profile).slice(0, 3),
    [eligible, profile],
  );

  const categoryResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DEMO_RESTAURANTS.filter((restaurant) => {
      if (selectedCuisine !== "全部" && restaurant.cuisine !== selectedCuisine) return false;
      if (!q) return true;
      return (
        restaurant.name.toLowerCase().includes(q) ||
        restaurant.cuisine.toLowerCase().includes(q) ||
        restaurant.signature.some((dish) => dish.toLowerCase().includes(q))
      );
    });
  }, [search, selectedCuisine]);

  const compareRestaurants = compare
    .map((id) => DEMO_RESTAURANTS.find((restaurant) => restaurant.id === id))
    .filter(Boolean) as Restaurant[];

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

  function addHistory(restaurant: Restaurant, source: HistoryEntry["source"]) {
    const entry: HistoryEntry = {
      id: `${restaurant.id}-${Date.now()}`,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      cuisine: restaurant.cuisine,
      emoji: restaurant.emoji,
      source,
      createdAt: new Date().toISOString(),
    };
    setHistory((current) => [entry, ...current].slice(0, 80));
  }

  function chooseRestaurant(restaurant: Restaurant, source: HistoryEntry["source"]) {
    addHistory(restaurant, source);
    setSelected(restaurant);
    setView("detail");
  }

  function locate() {
    if (!navigator.geolocation) {
      setLocationText("此裝置不支援定位");
      return;
    }
    setLocationText("定位中…");
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setLocationText(
          `已取得位置 · ${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`,
        ),
      () => setLocationText("定位未授權，可改用手動地區"),
    );
  }

  function spin() {
    if (spinning || eligible.length === 0) return;
    setSpinning(true);
    let ticks = 0;
    const timer = window.setInterval(() => {
      const candidate = eligible[Math.floor(Math.random() * eligible.length)];
      setSlotCuisine(candidate.cuisine);
      setSlotRestaurant(candidate.name);
      ticks += 1;
      if (ticks > 15) {
        window.clearInterval(timer);
        const winner = weightedPick(eligible, profile) ?? eligible[0];
        setSlotCuisine(winner.cuisine);
        setSlotRestaurant(winner.name);
        window.setTimeout(() => {
          setSpinning(false);
          chooseRestaurant(winner, "roulette");
        }, 520);
      }
    }, 105);
  }

  function resetProfile() {
    setProfile(DEFAULT_PROFILE);
    setFavorites([]);
    setCompare([]);
    setHistory([]);
    setOnboardingStep(0);
    setView("home");
  }

  if (!hydrated) {
    return <main className="loading">正在準備你的美食日常…</main>;
  }

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
                <p className="eyebrow">{profile.name ? `${profile.name}，` : ""}今天想吃什麼？</p>
                <h1>讓選擇變簡單，讓吃飯變有趣。</h1>
                <p className="muted">依照你的口味、距離與預算，先縮小範圍，再讓心情做最後決定。</p>
              </div>
              {profile.mascot !== "none" && (
                <div className="mascotHero" aria-hidden="true">
                  {mascot?.icon}
                </div>
              )}
            </section>

            <section className="modeGrid">
              <button className="modeCard coral" onClick={() => setView("roulette")}>
                <span>🎲</span>
                <b>不知道吃什麼</b>
                <small>符合偏好的店裡幫你抽</small>
              </button>
              <button className="modeCard mint" onClick={() => setView("nearby")}>
                <span>📍</span>
                <b>附近有什麼</b>
                <small>依距離與營業狀態探索</small>
              </button>
              <button className="modeCard gold" onClick={() => setView("compare")}>
                <span>⚖️</span>
                <b>幫我選</b>
                <small>把猶豫的餐廳放一起比</small>
              </button>
              <button className="modeCard sky" onClick={() => setView("category")}>
                <span>🔎</span>
                <b>想吃這一類</b>
                <small>依料理、店名或餐點搜尋</small>
              </button>
            </section>

            <section className="preferenceStrip">
              <div>
                <span>你的口味</span>
                <b>
                  {profile.favoriteCuisines.length
                    ? profile.favoriteCuisines.slice(0, 3).join("・")
                    : "還沒有特別指定"}
                </b>
              </div>
              <button onClick={() => setView("settings")}>調整</button>
            </section>

            <section className="sectionBlock">
              <div className="sectionHeading">
                <div>
                  <p className="eyebrow">FOR YOU</p>
                  <h2>先替你挑這幾家</h2>
                </div>
                <span>{eligible.length} 家符合目前條件</span>
              </div>
              <div className="restaurantList">
                {recommended.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    favorite={favorites.includes(restaurant.id)}
                    compared={compare.includes(restaurant.id)}
                    onFavorite={() => toggleFavorite(restaurant.id)}
                    onCompare={() => toggleCompare(restaurant.id)}
                    onOpen={() => {
                      setSelected(restaurant);
                      setView("detail");
                    }}
                    hint={recommendationHint(restaurant, profile)}
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
                <button onClick={() => setMinRating((current) => (current >= 4.5 ? 0 : 4.5))}>
                  ⭐ {minRating ? `${minRating}+` : "評分不限"}
                </button>
                <button className={onlyOpen ? "active" : ""} onClick={() => setOnlyOpen(!onlyOpen)}>
                  🕘 {onlyOpen ? "只看營業中" : "營業不限"}
                </button>
              </div>
            </section>

            <button className="installHint" onClick={() => setInstallTip(!installTip)}>
              📲 想放到 iPhone 主畫面？
            </button>
            {installTip && (
              <div className="tipBox">Safari → 分享 →「加入主畫面」，之後就能像 App 一樣直接打開。</div>
            )}
          </>
        )}

        {view === "roulette" && (
          <>
            <Header title="不知道吃什麼" />
            <section className="rouletteHero">
              <p className="eyebrow">交給今天的運氣</p>
              <h1>不糾結，抽一個就去吃。</h1>
              <p className="muted">只會從符合步行距離、預算、營業狀態與最低評分的候選中抽選。</p>
              <div className={"slotMachine " + (spinning ? "spinning" : "")}>
                <div className="slotLabel">料理類型</div>
                <div className="slotReel">{slotCuisine}</div>
                <div className="slotLabel">今天去這家</div>
                <div className="slotReel restaurant">{slotRestaurant}</div>
              </div>
              <button className="spinBtn" disabled={!eligible.length || spinning} onClick={spin}>
                {spinning ? "正在幫你決定…" : "🎲 幫我選一個"}
              </button>
              {!eligible.length && <p className="warningText">目前條件太嚴格，回首頁放寬一點再抽。</p>}
              {profile.mascot !== "none" && <div className="mascotBottom">{mascot?.icon}</div>}
            </section>
          </>
        )}

        {view === "nearby" && (
          <>
            <Header title="附近有什麼" />
            <section className="locationPanel">
              <div className="mapIllustration">
                <span className="mapPin">●</span>
                <span className="road one" />
                <span className="road two" />
              </div>
              <div>
                <p className="eyebrow">LOCATION</p>
                <h2>從你現在的位置開始找</h2>
                <p className="muted">{locationText}</p>
                <button className="secondaryBtn" onClick={locate}>
                  📍 {locationText === "尚未定位" ? "取得目前位置" : "重新定位"}
                </button>
              </div>
            </section>
            <p className="integrationNote">目前為 Demo 餐廳資料；Google Places 接入後會以實際位置與營業資料取代。</p>
            <section className="restaurantList">
              {eligible.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  favorite={favorites.includes(restaurant.id)}
                  compared={compare.includes(restaurant.id)}
                  onFavorite={() => toggleFavorite(restaurant.id)}
                  onCompare={() => toggleCompare(restaurant.id)}
                  onOpen={() => {
                    setSelected(restaurant);
                    setView("detail");
                  }}
                />
              ))}
            </section>
          </>
        )}

        {view === "compare" && (
          <>
            <Header title="幫我選" />
            <section className="compareTop">
              <p className="eyebrow">最多 5 家</p>
              <h2>把猶豫的選項攤開來看</h2>
              <p className="muted">目前已選 {compareRestaurants.length} 家。可以從附近、分類搜尋或收藏頁加入。</p>
              <div className="comparePills">
                {compareRestaurants.map((restaurant) => (
                  <button key={restaurant.id} onClick={() => toggleCompare(restaurant.id)}>
                    {restaurant.emoji} {restaurant.name} ×
                  </button>
                ))}
              </div>
            </section>

            {!compareRestaurants.length ? (
              <Empty text="還沒有加入餐廳，先去附近或分類搜尋勾幾家吧。" />
            ) : (
              <>
                <div className="compareTable">
                  <div className="compareRow head">
                    <span>項目</span>
                    {compareRestaurants.map((restaurant) => (
                      <b key={restaurant.id}>{restaurant.name}</b>
                    ))}
                  </div>
                  <div className="compareRow">
                    <span>評分</span>
                    {compareRestaurants.map((restaurant) => (
                      <b key={restaurant.id}>⭐ {restaurant.rating}</b>
                    ))}
                  </div>
                  <div className="compareRow">
                    <span>步行</span>
                    {compareRestaurants.map((restaurant) => (
                      <b key={restaurant.id}>{restaurant.walk} 分</b>
                    ))}
                  </div>
                  <div className="compareRow">
                    <span>每人預算</span>
                    {compareRestaurants.map((restaurant) => (
                      <b key={restaurant.id}>{moneyText(restaurant.priceMin, restaurant.priceMax)}</b>
                    ))}
                  </div>
                  <div className="compareRow">
                    <span>營業</span>
                    {compareRestaurants.map((restaurant) => (
                      <b key={restaurant.id} className={restaurant.open ? "good" : "bad"}>
                        {restaurant.open ? "營業中" : "休息"}
                      </b>
                    ))}
                  </div>
                  <div className="compareRow">
                    <span>招牌</span>
                    {compareRestaurants.map((restaurant) => (
                      <small key={restaurant.id}>{restaurant.signature[0]}</small>
                    ))}
                  </div>
                </div>
                <div className="decisionButtons">
                  {compareRestaurants.map((restaurant) => (
                    <button key={restaurant.id} onClick={() => chooseRestaurant(restaurant, "compare")}>
                      就吃 {restaurant.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            <section className="sectionBlock">
              <div className="sectionHeading">
                <h2>再加入其他餐廳</h2>
                <span>{compare.length}/5</span>
              </div>
              <div className="restaurantList">
                {DEMO_RESTAURANTS.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    favorite={favorites.includes(restaurant.id)}
                    compared={compare.includes(restaurant.id)}
                    onFavorite={() => toggleFavorite(restaurant.id)}
                    onCompare={() => toggleCompare(restaurant.id)}
                    onOpen={() => {
                      setSelected(restaurant);
                      setView("detail");
                    }}
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
                  onOpen={() => {
                    setSelected(restaurant);
                    setView("detail");
                  }}
                />
              ))}
            </section>
          </>
        )}

        {view === "favorites" && (
          <>
            <Header title="收藏" />
            <section className="sectionHeading pageHeading">
              <div>
                <p className="eyebrow">SAVED</p>
                <h2>下次想吃，不必再找一次</h2>
              </div>
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
                    onOpen={() => {
                      setSelected(restaurant);
                      setView("detail");
                    }}
                  />
                ),
              )}
            </section>
            {!favorites.length && <Empty text="還沒有收藏。看到想再吃的店，就按一下愛心。" />}
          </>
        )}

        {view === "history" && (
          <>
            <Header title="紀錄" />
            <section className="sectionHeading pageHeading">
              <div>
                <p className="eyebrow">YOUR FOOD TRAIL</p>
                <h2>最近幫自己做過哪些選擇</h2>
              </div>
              {history.length > 0 && <button onClick={() => setHistory([])}>清除</button>}
            </section>
            {!history.length ? (
              <Empty text="還沒有選餐紀錄。第一次抽餐廳或按下「就吃這家」後會出現在這裡。" />
            ) : (
              <section className="historyList">
                {history.map((entry) => (
                  <article key={entry.id} className="historyCard">
                    <span>{entry.emoji}</span>
                    <div>
                      <b>{entry.restaurantName}</b>
                      <small>
                        {entry.cuisine} · {sourceLabel(entry.source)}
                      </small>
                      <time>
                        {new Date(entry.createdAt).toLocaleString("zh-TW", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <button
                      onClick={() => {
                        const restaurant = DEMO_RESTAURANTS.find(
                          (item) => item.id === entry.restaurantId,
                        );
                        if (restaurant) {
                          setSelected(restaurant);
                          setView("detail");
                        }
                      }}
                    >
                      查看
                    </button>
                  </article>
                ))}
              </section>
            )}
          </>
        )}

        {view === "detail" && selected && (
          <>
            <Header title="餐廳資訊" />
            <section className="detailHero">
              <div className="foodVisual">{selected.emoji}</div>
              <div className="detailTitle">
                <div>
                  <span className="cuisineTag">{selected.cuisine}</span>
                  <span className={selected.open ? "openTag" : "closedTag"}>
                    {selected.open ? `營業中 · ${selected.close} 打烊` : "目前休息"}
                  </span>
                </div>
                <h1>{selected.name}</h1>
                <p>
                  ⭐ {selected.rating} · 🚶 {selected.walk} 分 · 每人{" "}
                  {moneyText(selected.priceMin, selected.priceMax)}
                </p>
              </div>
            </section>

            <section className="detailCard">
              <h2>第一次來，可以先看這些</h2>
              <div className="signatureGrid">
                {selected.signature.map((dish) => (
                  <div key={dish}>
                    <span>🍽️</span>
                    <b>{dish}</b>
                  </div>
                ))}
              </div>
            </section>

            <section className="detailCard">
              <h2>快速摘要</h2>
              <p>{selected.review}</p>
              <p className="muted">衛生資訊：{selected.hygiene}</p>
            </section>

            <div className="detailActions">
              <button onClick={() => toggleFavorite(selected.id)}>
                {favorites.includes(selected.id) ? "♥ 已收藏" : "♡ 收藏"}
              </button>
              <button onClick={() => toggleCompare(selected.id)}>
                {compare.includes(selected.id) ? "✓ 已加入比較" : "⚖ 加入比較"}
              </button>
            </div>
            <button className="primaryBtn detailPrimary" onClick={() => chooseRestaurant(selected, "category")}>
              今天就吃這家
            </button>
          </>
        )}

        {view === "settings" && (
          <>
            <Header title="我的設定" />
            <section className="settingsHero">
              <p className="eyebrow">MAKE IT YOURS</p>
              <h1>{profile.name ? `${profile.name} 的美食設定` : "我的美食設定"}</h1>
              <p className="muted">主題只會完整切換，不混搭。角色可另外選擇，也可以完全不要動物。</p>
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
                    <span>{item.icon}</span>
                    <small>{item.label}</small>
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
                  預設步行距離
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
                      <option key={band.id} value={band.id}>
                        {band.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </SettingsSection>

            <SettingsSection title="資料與登入">
              <div className="accountCard">
                <div>
                  <b>
                    {profile.entryMode === "guest"
                      ? "目前使用本機模式"
                      : `已選擇 ${profile.entryMode.toUpperCase()} 同步方式`}
                  </b>
                  <small>雲端登入與跨裝置同步會在 Supabase 連線完成後正式啟用。</small>
                </div>
              </div>
            </SettingsSection>

            <button className="dangerBtn" onClick={resetProfile}>
              重新設定這個 App
            </button>
          </>
        )}

        <nav className="bottomNav">
          <button className={view === "home" ? "active" : ""} onClick={() => setView("home")}>
            <span className="navIcon">⌂</span>
            <span>首頁</span>
          </button>
          <button
            className={view === "favorites" ? "active" : ""}
            onClick={() => setView("favorites")}
          >
            <span className="navIcon">♡</span>
            <span>收藏</span>
          </button>
          <button className={view === "history" ? "active" : ""} onClick={() => setView("history")}>
            <span className="navIcon">◷</span>
            <span>紀錄</span>
          </button>
          <button
            className={view === "settings" ? "active" : ""}
            onClick={() => setView("settings")}
          >
            <span className="navIcon">◎</span>
            <span>我的</span>
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
  const total = 5;
  const progress = Math.min(((step + 1) / total) * 100, 100);

  function update(patch: Partial<Profile>) {
    onChange({ ...profile, ...patch });
  }

  return (
    <main className="onboardingShell">
      <section className="onboardingCard">
        <div className="onboardingTop">
          <div className="brandMark">🍚</div>
          {step > 0 && (
            <button className="textBack" onClick={() => onStep(step - 1)}>
              ← 上一步
            </button>
          )}
        </div>

        <div className="progressTrack">
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="progressText">
          {step + 1}/{total}
        </p>

        {step === 0 && (
          <div className="onboardingStage welcomeStage">
            <p className="eyebrow">歡迎來到</p>
            <h1>今天吃什麼？</h1>
            <p className="lead">不是再多一個找餐廳工具，而是一個會慢慢記得你喜歡怎麼吃的日常小幫手。</p>
            <div className="welcomeArt" aria-hidden="true">
              <span className="bubble b1">🍜</span>
              <span className="bubble b2">🍣</span>
              <span className="bubble b3">🍛</span>
              <span className="welcomeMascot">🐱</span>
            </div>
            <button className="primaryBtn" onClick={() => onStep(1)}>
              建立我的口味
            </button>
            <button
              className="ghostBtn"
              onClick={() => {
                update({ entryMode: "guest" });
                onStep(2);
              }}
            >
              先逛逛也可以
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="onboardingStage">
            <p className="eyebrow">登入與同步</p>
            <h1>之後換手機，也希望它還記得你。</h1>
            <p className="muted">先選你偏好的登入方式。雲端憑證尚未接入時仍會安全使用本機模式，不會假裝完成第三方登入。</p>
            <div className="loginOptions">
              {[
                ["google", "G", "使用 Google"],
                ["apple", "●", "使用 Apple"],
                ["email", "✉", "使用 Email"],
                ["guest", "→", "先使用本機模式"],
              ].map(([id, icon, label]) => (
                <button
                  key={id}
                  className={profile.entryMode === id ? "selected" : ""}
                  onClick={() => update({ entryMode: id as Profile["entryMode"] })}
                >
                  <span>{icon}</span>
                  <b>{label}</b>
                  <em>{profile.entryMode === id ? "已選擇" : "選擇"}</em>
                </button>
              ))}
            </div>
            {profile.entryMode === "email" && (
              <input
                className="textInput"
                type="email"
                placeholder="你的 Email"
                value={profile.email}
                onChange={(event) => update({ email: event.target.value })}
              />
            )}
            <button className="primaryBtn" onClick={() => onStep(2)}>
              下一步
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="onboardingStage">
            <p className="eyebrow">建立個人偏好</p>
            <h1>先告訴我們，你平常比較容易被什麼吸引。</h1>
            <label className="fieldLabel">怎麼稱呼你？</label>
            <input
              className="textInput"
              placeholder="可以留白"
              value={profile.name}
              onChange={(event) => update({ name: event.target.value })}
            />
            <label className="fieldLabel">喜歡的料理（可複選）</label>
            <ChoiceGrid
              options={CUISINE_OPTIONS}
              selected={profile.favoriteCuisines}
              onToggle={(value) =>
                update({ favoriteCuisines: toggleValue(profile.favoriteCuisines, value) })
              }
            />
            <button className="primaryBtn" onClick={() => onStep(3)}>
              下一步
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="onboardingStage">
            <p className="eyebrow">再補幾個小習慣</p>
            <h1>讓推薦少一點踩雷，多一點「就是這個」。</h1>

            <label className="fieldLabel">忌口／不喜歡</label>
            <ChoiceGrid
              options={AVOIDANCE_OPTIONS}
              selected={profile.avoidances}
              onToggle={(value) => update({ avoidances: toggleValue(profile.avoidances, value) })}
            />

            <label className="fieldLabel">常見用餐情境</label>
            <ChoiceGrid
              options={DINING_CONTEXT_OPTIONS}
              selected={profile.diningContexts}
              onToggle={(value) =>
                update({ diningContexts: toggleValue(profile.diningContexts, value) })
              }
            />

            <div className="miniFields">
              <label>
                預設步行
                <select
                  value={profile.walk}
                  onChange={(event) => update({ walk: Number(event.target.value) })}
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
                    update({ priceBand: event.target.value as Profile["priceBand"] })
                  }
                >
                  {PRICE_BANDS.map((band) => (
                    <option key={band.id} value={band.id}>
                      {band.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              className={"surpriseToggle " + (profile.surprise ? "on" : "")}
              onClick={() => update({ surprise: !profile.surprise })}
            >
              <span>✨</span>
              <div>
                <b>接受偶爾的驚喜推薦</b>
                <small>不完全照慣例，偶爾讓你發現新東西。</small>
              </div>
              <em>{profile.surprise ? "開啟" : "關閉"}</em>
            </button>

            <button className="primaryBtn" onClick={() => onStep(4)}>
              選擇我的風格
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="onboardingStage">
            <p className="eyebrow">最後一步</p>
            <h1>選一套你每天都願意打開的樣子。</h1>
            <p className="muted">四套風格彼此獨立，不會自動混搭；角色是另一層設定，可以選動物，也可以完全不要。</p>

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

            <label className="fieldLabel">要不要有一個小夥伴？</label>
            <div className="mascotRow">
              {MASCOTS.map((item) => (
                <button
                  key={item.id}
                  className={"mascotChoice " + (profile.mascot === item.id ? "selected" : "")}
                  onClick={() => update({ mascot: item.id })}
                >
                  <span>{item.icon}</span>
                  <small>{item.label}</small>
                </button>
              ))}
            </div>

            <div className="finishPreview">
              <span className="spark s1">✦</span>
              <span className="spark s2">✦</span>
              {profile.mascot !== "none" && (
                <strong>{MASCOTS.find((item) => item.id === profile.mascot)?.icon}</strong>
              )}
              <div>
                <b>一切準備好了！</b>
                <small>今天也一起享受美食吧。</small>
              </div>
            </div>

            <button className="primaryBtn" onClick={onFinish}>
              開始探索
            </button>
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
      <div className={"themeMini " + theme.id} aria-hidden="true">
        <span className="themeCode">{theme.code}</span>
        <div className="miniHero" />
        <div className="miniCards">
          <span />
          <span />
          <span />
          <span />
        </div>
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
}: {
  restaurant: Restaurant;
  favorite: boolean;
  compared: boolean;
  onFavorite: () => void;
  onCompare: () => void;
  onOpen: () => void;
  hint?: string;
}) {
  return (
    <article className="restaurantCard">
      <button className="foodThumb" onClick={onOpen} aria-label={`查看 ${restaurant.name}`}>
        {restaurant.emoji}
      </button>
      <button className="restaurantInfo" onClick={onOpen}>
        <div className="restaurantLine">
          <b>{restaurant.name}</b>
          <span className={restaurant.open ? "good" : "bad"}>
            {restaurant.open ? "營業中" : "休息"}
          </span>
        </div>
        <p>
          ⭐ {restaurant.rating} · {restaurant.cuisine}
        </p>
        <p>
          🚶 {restaurant.walk} 分 · 每人 {moneyText(restaurant.priceMin, restaurant.priceMax)}
        </p>
        {hint && <p className="matchHint">✨ {hint}</p>}
      </button>
      <div className="cardActions">
        <button onClick={onFavorite} aria-label={favorite ? "取消收藏" : "收藏"}>
          {favorite ? "♥" : "♡"}
        </button>
        <button
          className={compared ? "selected" : ""}
          onClick={onCompare}
          aria-label={compared ? "移出比較" : "加入比較"}
        >
          ⚖
        </button>
      </div>
    </article>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="settingsSection">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="emptyState">
      <div>🍽️</div>
      <p>{text}</p>
    </div>
  );
}
