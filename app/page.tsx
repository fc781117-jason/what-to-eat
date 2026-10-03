"use client";

import { useEffect, useMemo, useState } from "react";

type ThemeId = "cute" | "clean" | "izakaya" | "future" | "auto";
type ViewId = "home" | "roulette" | "nearby" | "compare" | "lookup" | "favorites" | "settings" | "detail";

type Profile = {
  name: string;
  theme: ThemeId;
  mascot: string;
  walk: number;
  budget: number;
};

type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  walk: number;
  distance: number;
  priceMin: number;
  priceMax: number;
  open: boolean;
  close: string;
  emoji: string;
  signature: string[];
  review: string;
  hygiene: string;
  izakaya?: boolean;
};

const THEME_OPTIONS = [
  { id: "cute" as const, name: "可愛玩味", desc: "明亮、療癒、角色感強", colors: ["#fff2db", "#ff7676", "#ffc857"] },
  { id: "clean" as const, name: "清爽現代", desc: "簡潔、資訊清楚、耐看", colors: ["#f7f5ef", "#2f6d4f", "#f1a54b"] },
  { id: "izakaya" as const, name: "居酒屋暖夜", desc: "木質、燈籠、夜食氛圍", colors: ["#1e1713", "#bd4d2e", "#f3c178"] },
  { id: "future" as const, name: "未來動感", desc: "霓虹、速度、命運感", colors: ["#10172c", "#ff6f91", "#7567ff"] },
  { id: "auto" as const, name: "自動切換", desc: "依時間自動換風格", colors: ["#fff2db", "#2f6d4f", "#7567ff"] },
];

const MASCOTS = [
  { id: "cat", icon: "😺", label: "貓貓" },
  { id: "dog", icon: "🐶", label: "狗狗" },
  { id: "rabbit", icon: "🐰", label: "兔兔" },
  { id: "bear", icon: "🐻", label: "熊熊" },
  { id: "none", icon: "✨", label: "不要動物" },
];

const DEMO: Restaurant[] = [
  { id:"r1", name:"老張牛肉麵", cuisine:"台式", rating:4.6, walk:6, distance:450, priceMin:120, priceMax:220, open:true, close:"21:00", emoji:"🍜", signature:["紅燒牛肉麵","滷味拼盤","酸菜小菜"], review:"尖峰時段可能需要等候，但湯頭與牛肉穩定。", hygiene:"可取得評論中未見重複衛生疑慮。" },
  { id:"r2", name:"山海小館", cuisine:"台菜", rating:4.4, walk:10, distance:760, priceMin:280, priceMax:520, open:true, close:"22:00", emoji:"🍚", signature:["三杯雞","金沙豆腐","蛤蜊湯"], review:"份量充足，適合兩人以上分享。", hygiene:"近期評論多為環境整潔正向回饋。" },
  { id:"r3", name:"夜町串燒", cuisine:"居酒屋", rating:4.5, walk:12, distance:920, priceMin:650, priceMax:1100, open:true, close:"01:00", emoji:"🍢", signature:["明太子雞翅","鹽烤牛舌","烤飯糰"], review:"氣氛熱鬧，部分評論提到假日晚間較難訂位。", hygiene:"未見明顯重複衛生警訊。", izakaya:true },
  { id:"r4", name:"春日和食堂", cuisine:"日式", rating:4.3, walk:14, distance:1080, priceMin:260, priceMax:480, open:true, close:"20:30", emoji:"🍣", signature:["海鮮丼","唐揚雞","茶碗蒸"], review:"餐點穩定，晚間熱門時段可能售罄。", hygiene:"可取得評論中未見重大衛生議題。" },
  { id:"r5", name:"暖暖石頭火鍋", cuisine:"火鍋", rating:4.2, walk:15, distance:1180, priceMin:380, priceMax:680, open:true, close:"23:30", emoji:"🍲", signature:["爆香石頭鍋","梅花豬","手工餃類"], review:"香氣足，適合聚餐；部分人認為尖峰較吵。", hygiene:"近期評論以桌面清潔正常為主。" },
  { id:"r6", name:"港邊漢堡室", cuisine:"美式", rating:4.1, walk:8, distance:620, priceMin:220, priceMax:420, open:false, close:"18:00", emoji:"🍔", signature:["培根牛肉堡","薯條","奶昔"], review:"份量大，但今日已結束營業。", hygiene:"無足夠近期評論可判斷。" },
  { id:"r7", name:"慢慢咖哩", cuisine:"咖哩", rating:4.7, walk:7, distance:510, priceMin:180, priceMax:320, open:true, close:"20:00", emoji:"🍛", signature:["熟成牛肉咖哩","炸雞咖哩","布丁"], review:"評分高、座位不多，尖峰時段建議提早到。", hygiene:"近期可取得評論多為整潔正向訊號。" },
  { id:"r8", name:"小島冰室", cuisine:"甜點", rating:4.4, walk:5, distance:350, priceMin:120, priceMax:260, open:true, close:"22:30", emoji:"🍧", signature:["芒果冰","焦糖布丁","奶茶"], review:"適合飯後續攤，甜度偏高。", hygiene:"未見重複衛生負評。" },
];

function getAutoTheme(): Exclude<ThemeId,"auto"> {
  const h = new Date().getHours();
  if (h < 6) return "future";
  if (h < 11) return "clean";
  if (h < 17) return "cute";
  if (h < 23) return "izakaya";
  return "future";
}

function moneyText(min:number,max:number){
  return "NT$ " + min + "–" + max;
}

export default function HomePage() {
  const [profile, setProfile] = useState<Profile>({ name:"", theme:"cute", mascot:"cat", walk:15, budget:0 });
  const [hydrated, setHydrated] = useState(false);
  const [onboarding, setOnboarding] = useState(true);
  const [view, setView] = useState<ViewId>("home");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>(["r1","r3"]);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [search, setSearch] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [minRating, setMinRating] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [slotCuisine, setSlotCuisine] = useState("台式");
  const [slotRestaurant, setSlotRestaurant] = useState("老張牛肉麵");
  const [locationText, setLocationText] = useState("尚未定位");
  const [installTip, setInstallTip] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("wte_profile");
    const fav = localStorage.getItem("wte_favorites");
    const cmp = localStorage.getItem("wte_compare");
    if (raw) {
      try {
        setProfile(JSON.parse(raw));
        setOnboarding(false);
      } catch {}
    }
    if (fav) try { setFavorites(JSON.parse(fav)); } catch {}
    if (cmp) try { setCompare(JSON.parse(cmp)); } catch {}
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{});
    setHydrated(true);
  }, []);

  const effectiveTheme = profile.theme === "auto" ? getAutoTheme() : profile.theme;

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.theme = effectiveTheme;
    localStorage.setItem("wte_profile", JSON.stringify(profile));
    localStorage.setItem("wte_favorites", JSON.stringify(favorites));
    localStorage.setItem("wte_compare", JSON.stringify(compare));
  }, [profile, favorites, compare, effectiveTheme, hydrated]);

  const mascot = MASCOTS.find(m=>m.id===profile.mascot)?.icon ?? "😺";

  const eligible = useMemo(() => DEMO.filter(r => {
    if (onlyOpen && !r.open) return false;
    if (profile.walk && r.walk > profile.walk) return false;
    if (profile.budget && r.priceMin > profile.budget) return false;
    if (minRating && r.rating < minRating) return false;
    return true;
  }), [onlyOpen, profile.walk, profile.budget, minRating]);

  const compareRestaurants = compare.map(id=>DEMO.find(r=>r.id===id)).filter(Boolean) as Restaurant[];

  function saveOnboarding(){
    setOnboarding(false);
    setView("home");
  }

  function toggleFavorite(id:string){
    setFavorites(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
  }

  function toggleCompare(id:string){
    setCompare(v=>{
      if(v.includes(id)) return v.filter(x=>x!==id);
      if(v.length>=5) return v;
      return [...v,id];
    });
  }

  function locate(){
    if(!navigator.geolocation){ setLocationText("此裝置不支援定位"); return; }
    setLocationText("定位中…");
    navigator.geolocation.getCurrentPosition(
      p=>setLocationText("已取得位置 · " + p.coords.latitude.toFixed(3) + ", " + p.coords.longitude.toFixed(3)),
      ()=>setLocationText("定位未授權，可改用手動地區")
    );
  }

  function spin(){
    if(spinning || eligible.length===0) return;
    setSpinning(true);
    const cuisines = [...new Set(eligible.map(r=>r.cuisine))];
    let ticks = 0;
    const timer = window.setInterval(()=>{
      const r = eligible[Math.floor(Math.random()*eligible.length)];
      setSlotCuisine(cuisines[Math.floor(Math.random()*cuisines.length)]);
      setSlotRestaurant(r.name);
      ticks++;
      if(ticks>16){
        window.clearInterval(timer);
        const winner = eligible[Math.floor(Math.random()*eligible.length)];
        setSlotCuisine(winner.cuisine);
        setSlotRestaurant(winner.name);
        setSelected(winner);
        window.setTimeout(()=>{
          setSpinning(false);
          setView("detail");
        },550);
      }
    },110);
  }

  function goDetail(r:Restaurant){
    setSelected(r);
    setView("detail");
  }

  if(!hydrated) return <main className="loading">正在準備今天的美食…</main>;

  if(onboarding){
    return (
      <main className="onboardingShell">
        <section className="onboardingCard">
          <div className="brandMark">🍚</div>
          <p className="eyebrow">第一次見面</p>
          <h1>先把它變成你的美食 App</h1>
          <p className="muted">不用一次設定很多，之後都能再改。你的偏好先存在這台裝置；Google 雲端同步會在下一階段開啟。</p>

          <label className="fieldLabel">怎麼稱呼你？</label>
          <input className="textInput" placeholder="可以留白" value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/>

          <label className="fieldLabel">介面風格</label>
          <div className="themeGrid">
            {THEME_OPTIONS.map(t=>(
              <button key={t.id} className={"themeChoice "+(profile.theme===t.id?"selected":"")} onClick={()=>setProfile({...profile,theme:t.id})}>
                <div className="themeThumb">{t.colors.map(c=><span key={c} style={{background:c}} />)}</div>
                <strong>{t.name}</strong>
                <small>{t.desc}</small>
              </button>
            ))}
          </div>

          <label className="fieldLabel">陪你找吃的角色</label>
          <div className="mascotRow">
            {MASCOTS.map(m=>(
              <button key={m.id} className={"mascotChoice "+(profile.mascot===m.id?"selected":"")} onClick={()=>setProfile({...profile,mascot:m.id})}>
                <span>{m.icon}</span><small>{m.label}</small>
              </button>
            ))}
          </div>

          <div className="miniFields">
            <label>預設步行
              <select value={profile.walk} onChange={e=>setProfile({...profile,walk:Number(e.target.value)})}>
                <option value={5}>5 分</option><option value={10}>10 分</option><option value={15}>15 分</option><option value={20}>20 分</option>
              </select>
            </label>
            <label><b>每人預算</b>
              <select value={profile.budget} onChange={e=>setProfile({...profile,budget:Number(e.target.value)})}>
                <option value={0}>不限</option><option value={200}>NT$200</option><option value={300}>NT$300</option><option value={500}>NT$500</option><option value={800}>NT$800</option><option value={1200}>NT$1,200</option>
              </select>
            </label>
          </div>

          <div className="cloudPreview">
            <span className="googleDot">G</span>
            <div><b>Google 雲端同步</b><small>換手機也能把收藏、吃過紀錄與偏好帶回來</small></div>
            <span className="coming">下一階段</span>
          </div>

          <button className="primaryBtn" onClick={saveOnboarding}>開始找好吃的</button>
        </section>
      </main>
    );
  }

  const Header = ({title}:{title?:string}) => (
    <header className="topbar">
      {view!=="home" ? <button className="iconBtn" onClick={()=>setView("home")}>←</button> : <div className="brandMini">What To Eat?</div>}
      <div className="topTitle">{title}</div>
      <button className="iconBtn" onClick={()=>setView("settings")}>⚙️</button>
    </header>
  );

  return (
    <main className="appShell">
      <div className="phoneFrame">
        {view==="home" && <>
          <Header />
          <section className="hero">
            <div>
              <p className="eyebrow">{profile.name ? profile.name+"，今天" : "今天"}吃什麼？</p>
              <h1>好吃的，正在附近等你。</h1>
              <p className="muted">先排除不適合的，再交給命運決定。</p>
            </div>
            <div className="mascotHero">{mascot}</div>
          </section>

          <section className="modeGrid">
            <button className="modeCard coral" onClick={()=>setView("nearby")}><span>📍</span><b>附近找店</b><small>看看附近有什麼</small></button>
            <button className="modeCard gold" onClick={()=>setView("roulette")}><span>🎰</span><b>今天吃什麼</b><small>讓拉霸幫你選</small></button>
            <button className="modeCard violet" onClick={()=>setView("compare")}><span>⚖️</span><b>比較餐廳</b><small>最多比較 5 家</small></button>
            <button className="modeCard blue" onClick={()=>setView("lookup")}><span>🔎</span><b>查一家餐廳</b><small>搜尋店名與特色</small></button>
          </section>

          <section className="filterBox">
            <div className="sectionTitle"><b>快速篩選</b><button onClick={()=>{setProfile({...profile,walk:15,budget:0});setMinRating(0);setOnlyOpen(true)}}>重設</button></div>
            <div className="chips">
              <button>🚶 步行 {profile.walk} 分</button>
              <button><b>💰 每人預算</b> {profile.budget ? "≤ $"+profile.budget : "不限"}</button>
              <button>⭐ 最低評分 {minRating||"不限"}</button>
              <button className={onlyOpen?"active":""} onClick={()=>setOnlyOpen(!onlyOpen)}>🕘 {onlyOpen?"現在營業":"不限營業"}</button>
            </div>
          </section>

          <section className="statusCard">
            <div><b>📍 目前位置</b><small>{locationText}</small></div>
            <button onClick={locate}>使用定位</button>
          </section>

          <section className="quickStats">
            <div><strong>{eligible.length}</strong><span>符合目前條件</span></div>
            <div><strong>{favorites.length}</strong><span>已收藏</span></div>
            <div><strong>{compare.length}</strong><span>待比較</span></div>
          </section>

          <button className="installHint" onClick={()=>setInstallTip(!installTip)}>📲 如何加到 iPhone 主畫面？</button>
          {installTip && <div className="tipBox">Safari → 分享 →「加入主畫面」→ 開啟後就會像 App 一樣使用。</div>}
        </>}

        {view==="roulette" && <>
          <Header title="今天吃什麼" />
          <section className="rouletteHero">
            <p className="eyebrow">命運拉霸</p>
            <h1>轉一轉，今天就吃這個！</h1>
            <p className="muted">只會從符合你的步行、預算與營業條件的餐廳中抽選。</p>
            <div className={"slotMachine "+(spinning?"spinning":"")}>
              <div className="slotLabel">料理類別</div>
              <div className="slotReel"><span>{slotCuisine}</span></div>
              <div className="slotLabel">餐廳</div>
              <div className="slotReel restaurant"><span>{slotRestaurant}</span></div>
            </div>
            <button className="spinBtn" disabled={eligible.length===0} onClick={spin}>{spinning?"轉動中…":"🎰 開始抽美食"}</button>
            {eligible.length===0 && <p className="warningText">目前沒有符合條件的餐廳，請回首頁放寬條件。</p>}
            <div className="mascotBottom">{mascot}</div>
          </section>
        </>}

        {view==="nearby" && <>
          <Header title="附近找店" />
          <section className="mapPlaceholder">
            <div className="mapDot">●</div>
            <p>Google Maps / Places 下一階段接入</p>
            <button onClick={locate}>📍 {locationText==="尚未定位"?"取得目前位置":"重新定位"}</button>
          </section>
          <div className="sectionTitle listTitle"><b>符合條件的店</b><span>{eligible.length} 家</span></div>
          <section className="restaurantList">
            {eligible.map(r=><RestaurantCard key={r.id} r={r} favorite={favorites.includes(r.id)} compared={compare.includes(r.id)} onFavorite={()=>toggleFavorite(r.id)} onCompare={()=>toggleCompare(r.id)} onOpen={()=>goDetail(r)} />)}
          </section>
        </>}

        {view==="compare" && <>
          <Header title="比較餐廳" />
          <section className="compareTop">
            <p className="muted">最多比較 5 家，目前 {compareRestaurants.length} 家。</p>
            <div className="comparePills">
              {compareRestaurants.map(r=><button key={r.id} onClick={()=>toggleCompare(r.id)}>{r.emoji} {r.name} ×</button>)}
            </div>
          </section>
          {compareRestaurants.length===0 ? <Empty text="還沒有加入餐廳，先到附近找店勾選幾家吧。" /> :
          <div className="compareTable">
            <div className="compareRow head"><span>項目</span>{compareRestaurants.map(r=><b key={r.id}>{r.name}</b>)}</div>
            <div className="compareRow"><span>Google 評分</span>{compareRestaurants.map(r=><b key={r.id}>⭐ {r.rating}</b>)}</div>
            <div className="compareRow"><span>步行</span>{compareRestaurants.map(r=><b key={r.id}>{r.walk} 分</b>)}</div>
            <div className="compareRow"><span><b>每人預算</b></span>{compareRestaurants.map(r=><b key={r.id}>{moneyText(r.priceMin,r.priceMax)}</b>)}</div>
            <div className="compareRow"><span>營業</span>{compareRestaurants.map(r=><b key={r.id} className={r.open?"good":"bad"}>{r.open?"營業中":"休息"}</b>)}</div>
            <div className="compareRow"><span>招牌</span>{compareRestaurants.map(r=><small key={r.id}>{r.signature[0]}</small>)}</div>
            <div className="compareRow"><span>提醒</span>{compareRestaurants.map(r=><small key={r.id}>{r.review}</small>)}</div>
          </div>}
        </>}

        {view==="lookup" && <>
          <Header title="查一家餐廳" />
          <section className="searchBox">
            <input placeholder="輸入店名、料理，之後也可貼 Google Maps 網址" value={search} onChange={e=>setSearch(e.target.value)} />
          </section>
          <section className="restaurantList">
            {DEMO.filter(r=>!search || r.name.includes(search) || r.cuisine.includes(search)).map(r=><RestaurantCard key={r.id} r={r} favorite={favorites.includes(r.id)} compared={compare.includes(r.id)} onFavorite={()=>toggleFavorite(r.id)} onCompare={()=>toggleCompare(r.id)} onOpen={()=>goDetail(r)} />)}
          </section>
        </>}

        {view==="favorites" && <>
          <Header title="我的收藏" />
          <section className="restaurantList">
            {DEMO.filter(r=>favorites.includes(r.id)).map(r=><RestaurantCard key={r.id} r={r} favorite={true} compared={compare.includes(r.id)} onFavorite={()=>toggleFavorite(r.id)} onCompare={()=>toggleCompare(r.id)} onOpen={()=>goDetail(r)} />)}
            {favorites.length===0 && <Empty text="還沒有收藏餐廳。" />}
          </section>
        </>}

        {view==="settings" && <>
          <Header title="外觀與偏好" />
          <section className="settingsSection">
            <h2>介面風格</h2>
            <div className="themeGrid">
              {THEME_OPTIONS.map(t=>(
                <button key={t.id} className={"themeChoice "+(profile.theme===t.id?"selected":"")} onClick={()=>setProfile({...profile,theme:t.id})}>
                  <div className="themeThumb">{t.colors.map(c=><span key={c} style={{background:c}} />)}</div>
                  <strong>{t.name}</strong><small>{t.desc}</small>
                </button>
              ))}
            </div>
            <h2>角色</h2>
            <div className="mascotRow">
              {MASCOTS.map(m=><button key={m.id} className={"mascotChoice "+(profile.mascot===m.id?"selected":"")} onClick={()=>setProfile({...profile,mascot:m.id})}><span>{m.icon}</span><small>{m.label}</small></button>)}
            </div>
            <h2>預設篩選</h2>
            <div className="stackFields">
              <label>步行時間<select value={profile.walk} onChange={e=>setProfile({...profile,walk:Number(e.target.value)})}><option value={5}>5 分</option><option value={10}>10 分</option><option value={15}>15 分</option><option value={20}>20 分</option></select></label>
              <label><b>每人預算</b><select value={profile.budget} onChange={e=>setProfile({...profile,budget:Number(e.target.value)})}><option value={0}>不限</option><option value={200}>NT$200</option><option value={300}>NT$300</option><option value={500}>NT$500</option><option value={800}>NT$800</option><option value={1200}>NT$1,200</option></select></label>
              <label>最低評分<select value={minRating} onChange={e=>setMinRating(Number(e.target.value))}><option value={0}>不限</option><option value={3.5}>3.5+</option><option value={4}>4.0+</option><option value={4.5}>4.5+</option></select></label>
            </div>
            <div className="cloudPreview">
              <span className="googleDot">G</span><div><b>Google 登入與雲端同步</b><small>目前為預覽 UI；接 Supabase 後啟用。</small></div><span className="coming">待接入</span>
            </div>
            <button className="secondaryBtn" onClick={()=>setOnboarding(true)}>重新跑第一次設定</button>
          </section>
        </>}

        {view==="detail" && selected && <>
          <Header title="餐廳詳情" />
          <section className="detailHero">
            <div className="foodVisual">{selected.emoji}</div>
            <div className="detailTitle">
              <div><span className="cuisineTag">{selected.cuisine}</span>{selected.open&&<span className="openTag">營業中</span>}</div>
              <h1>{selected.name}</h1>
              <p>⭐ {selected.rating} · 🚶 {selected.walk} 分 · <b>每人 {moneyText(selected.priceMin,selected.priceMax)}</b></p>
            </div>
          </section>
          <section className="detailCard">
            <h2>推薦餐點</h2>
            <div className="signatureGrid">{selected.signature.map((s,i)=><div key={s}><span>{["👑","🍽️","✨"][i]||"🍴"}</span><b>{s}</b></div>)}</div>
          </section>
          <section className="detailCard"><h2>評論重點</h2><p>{selected.review}</p></section>
          <section className="detailCard"><h2>🧼 衛生訊號</h2><p>{selected.hygiene}</p><small className="muted">僅代表目前可取得評論的提示，不等於官方衛生稽查結果。</small></section>
          {selected.izakaya && <section className="detailCard izakayaScore"><h2>🍺 居酒屋專屬評分</h2><div className="scoreRows"><span>氣氛 <b>4.7</b></span><span>酒品 <b>4.5</b></span><span>烤物 <b>4.8</b></span><span>價格感受 <b>4.1</b></span></div></section>}
          <div className="detailActions"><button onClick={()=>toggleCompare(selected.id)}>⚖️ {compare.includes(selected.id)?"移出比較":"加入比較"}</button><button onClick={()=>toggleFavorite(selected.id)}>♡ {favorites.includes(selected.id)?"已收藏":"收藏"}</button></div>
        </>}

        <nav className="bottomNav">
          <button className={view==="home"?"active":""} onClick={()=>setView("home")}>⌂<span>首頁</span></button>
          <button className={view==="nearby"?"active":""} onClick={()=>setView("nearby")}>⌖<span>附近</span></button>
          <button className={view==="roulette"?"active":""} onClick={()=>setView("roulette")}>🎰<span>拉霸</span></button>
          <button className={view==="favorites"?"active":""} onClick={()=>setView("favorites")}>♡<span>收藏</span></button>
        </nav>
      </div>
    </main>
  );
}

function RestaurantCard({r,favorite,compared,onFavorite,onCompare,onOpen}:{r:Restaurant;favorite:boolean;compared:boolean;onFavorite:()=>void;onCompare:()=>void;onOpen:()=>void}) {
  return <article className="restaurantCard">
    <button className="foodThumb" onClick={onOpen}>{r.emoji}</button>
    <div className="restaurantInfo" onClick={onOpen}>
      <div className="restaurantLine"><b>{r.name}</b><span className={r.open?"good":"bad"}>{r.open?"營業中":"休息"}</span></div>
      <p>⭐ {r.rating} · {r.cuisine}</p>
      <p>🚶 {r.walk} 分 · <b>每人 {moneyText(r.priceMin,r.priceMax)}</b></p>
    </div>
    <div className="cardActions"><button onClick={onFavorite}>{favorite?"♥":"♡"}</button><button className={compared?"selected":""} onClick={onCompare}>⚖️</button></div>
  </article>
}

function Empty({text}:{text:string}) {
  return <div className="emptyState"><div>🍽️</div><p>{text}</p></div>;
}
