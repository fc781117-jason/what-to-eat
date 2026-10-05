export type ThemeId = "animal" | "minimal" | "illustrated" | "foodie";
export type MascotId = "cat" | "dog" | "rabbit" | "fox" | "none";
export type EntryMode = "google" | "apple" | "email" | "guest";
export type PriceBand = "any" | "budget" | "standard" | "treat";
export type ViewId =
  | "home"
  | "roulette"
  | "nearby"
  | "compare"
  | "category"
  | "favorites"
  | "stats"
  | "history"
  | "settings"
  | "detail"
  | "go";

export type DataSourceKind = "demo" | "google" | "official" | "booking" | "user" | "ai-summary" | "ai-estimate";

export type Dish = {
  dishId: string;
  restaurantId: string;
  name: string;
  category: string;
  price?: number;
  photo?: string;
  popularity?: number;
  source: DataSourceKind;
  sourceFreshness?: string;
  likes: number;
  dislikes: number;
  selectionCount: number;
  recommendationEvidence: string[];
};

export type MenuItem = {
  name: string;
  price?: number;
  note?: string;
  source: DataSourceKind;
};

export type WeeklyHours = Partial<
  Record<0 | 1 | 2 | 3 | 4 | 5 | 6, Array<[string, string]>>
>;

export type Profile = {
  name: string;
  entryMode: EntryMode;
  email: string;
  theme: ThemeId;
  mascot: MascotId;
  favoriteCuisines: string[];
  avoidances: string[];
  diningContexts: string[];
  priceBand: PriceBand;
  walk: number;
  surprise: boolean;
  excludedRestaurantIds: string[];
  onboardingCompleted: boolean;
};

export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  walk: number;
  distance: number;
  priceMin: number;
  priceMax: number;
  priceLevelLabel?: string;
  openNow?: boolean | null;
  address: string;
  phone?: string;
  websiteUrl?: string;
  menuUrl?: string;
  googleMapsUrl?: string;
  source: DataSourceKind;
  sourceLabel: string;
  lastVerified: string;
  weeklyHours: WeeklyHours;
  signature: string[];
  menuItems: MenuItem[];
  review: string;
  hygiene: string;
  contexts: string[];
  photoLabels: string[];
};

export type HistoryEntry = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  cuisine: string;
  source: "roulette" | "nearby" | "compare" | "category";
  createdAt: string;
  decisionSeconds?: number;
  candidateCount?: number;
  dishId?: string;
  dishName?: string;
};

export type DecisionSession = {
  source: HistoryEntry["source"];
  startedAt: number;
  candidateCount: number;
};

export const DEFAULT_PROFILE: Profile = {
  name: "",
  entryMode: "guest",
  email: "",
  theme: "animal",
  mascot: "cat",
  favoriteCuisines: [],
  avoidances: [],
  diningContexts: [],
  priceBand: "any",
  walk: 15,
  surprise: true,
  excludedRestaurantIds: [],
  onboardingCompleted: false,
};

export const THEME_OPTIONS = [
  {
    id: "animal" as const,
    code: "A",
    name: "可愛動物系",
    desc: "奶油色、圓潤卡片、角色陪伴",
    note: "溫暖療癒，角色感最完整",
  },
  {
    id: "minimal" as const,
    code: "B",
    name: "極簡清新系",
    desc: "留白、低彩度、資訊優先",
    note: "閱讀最快，畫面最乾淨",
  },
  {
    id: "illustrated" as const,
    code: "C",
    name: "活潑插畫系",
    desc: "幾何色塊、小插畫、探索感",
    note: "年輕有趣，互動感最強",
  },
  {
    id: "foodie" as const,
    code: "D",
    name: "美食質感系",
    desc: "深色、暖金、大圖與沉浸感",
    note: "讓餐廳與食物資訊成為主角",
  },
];

export const MASCOTS = [
  { id: "cat" as const, label: "布偶貓", note: "溫柔陪伴" },
  { id: "dog" as const, label: "雪納瑞", note: "活潑可靠" },
  { id: "rabbit" as const, label: "長毛兔", note: "柔軟療癒" },
  { id: "fox" as const, label: "白狐狸", note: "靈巧好奇" },
  { id: "none" as const, label: "不要動物", note: "純介面模式" },
];

export const CUISINE_OPTIONS = [
  "台式",
  "日式",
  "韓式",
  "中式",
  "義式",
  "美式",
  "火鍋",
  "燒肉",
  "咖哩",
  "早餐",
  "咖啡甜點",
  "小吃",
];

export const AVOIDANCE_OPTIONS = [
  "不吃牛",
  "不吃豬",
  "不吃海鮮",
  "素食",
  "不辣",
  "不要香菜",
  "乳製品少",
  "無特別忌口",
];

export const DINING_CONTEXT_OPTIONS = [
  "一個人",
  "朋友",
  "情侶",
  "家庭",
  "快速吃",
  "慢慢聊天",
];

export const PRICE_BANDS = [
  { id: "any" as const, label: "不限", max: 0 },
  { id: "budget" as const, label: "平價 · 約 $200", max: 200 },
  { id: "standard" as const, label: "一般 · 約 $500", max: 500 },
  { id: "treat" as const, label: "犒賞 · 約 $1,000", max: 1000 },
];

const ALL_DAYS: WeeklyHours = {
  0: [["11:00", "21:00"]],
  1: [["11:00", "21:00"]],
  2: [["11:00", "21:00"]],
  3: [["11:00", "21:00"]],
  4: [["11:00", "21:00"]],
  5: [["11:00", "21:30"]],
  6: [["11:00", "21:30"]],
};

const NIGHT_HOURS: WeeklyHours = {
  0: [["17:00", "00:30"]],
  1: [["17:00", "00:30"]],
  2: [["17:00", "00:30"]],
  3: [["17:00", "00:30"]],
  4: [["17:00", "01:00"]],
  5: [["17:00", "01:00"]],
  6: [["17:00", "00:30"]],
};

export const DEMO_RESTAURANTS: Restaurant[] = [
  {
    id: "r1",
    name: "老張牛肉麵",
    cuisine: "台式",
    rating: 4.6,
    reviewCount: 1284,
    walk: 6,
    distance: 450,
    priceMin: 120,
    priceMax: 220,
    address: "DEMO｜正式版由 Google Places 顯示實際地址",
    phone: undefined,
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=%E7%89%9B%E8%82%89%E9%BA%B5",
    source: "demo",
    sourceLabel: "Demo 測試資料",
    lastVerified: "Preview data",
    weeklyHours: ALL_DAYS,
    signature: ["紅燒牛肉麵", "滷味拼盤", "燙青菜"],
    menuItems: [
      { name: "紅燒牛肉麵", price: 180, source: "demo" },
      { name: "半筋半肉麵", price: 210, source: "demo" },
      { name: "滷味拼盤", price: 100, source: "demo" },
      { name: "燙青菜", price: 50, source: "demo" },
    ],
    review: "Demo 摘要：湯頭與牛肉穩定，尖峰時段可能需要稍候。",
    hygiene: "目前尚未連接真實評論來源，正式版不會以 Demo 結論冒充即時資料。",
    contexts: ["一個人", "快速吃", "朋友"],
    photoLabels: ["招牌牛肉麵", "店內用餐", "滷味小菜"],
  },
  {
    id: "r2",
    name: "山海小館",
    cuisine: "台式",
    rating: 4.4,
    reviewCount: 687,
    walk: 10,
    distance: 760,
    priceMin: 280,
    priceMax: 520,
    address: "DEMO｜正式版由 Google Places 顯示實際地址",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E8%8F%9C",
    source: "demo",
    sourceLabel: "Demo 測試資料",
    lastVerified: "Preview data",
    weeklyHours: { ...ALL_DAYS, 1: [] },
    signature: ["三杯雞", "金沙豆腐", "蛤蜊湯"],
    menuItems: [
      { name: "三杯雞", price: 320, source: "demo" },
      { name: "金沙豆腐", price: 220, source: "demo" },
      { name: "蛤蜊湯", price: 180, source: "demo" },
    ],
    review: "Demo 摘要：份量充足，適合兩人以上分享。",
    hygiene: "正式版會以可驗證評論來源重新分析。",
    contexts: ["朋友", "家庭", "慢慢聊天"],
    photoLabels: ["招牌熱炒", "多人分享", "店內空間"],
  },
  {
    id: "r3",
    name: "夜町串燒",
    cuisine: "日式",
    rating: 4.5,
    reviewCount: 1543,
    walk: 12,
    distance: 920,
    priceMin: 650,
    priceMax: 1100,
    address: "DEMO｜正式版由 Google Places 顯示實際地址",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=%E5%B1%85%E9%85%92%E5%B1%8B",
    source: "demo",
    sourceLabel: "Demo 測試資料",
    lastVerified: "Preview data",
    weeklyHours: NIGHT_HOURS,
    signature: ["明太子雞翅", "鹽烤牛舌", "烤飯糰"],
    menuItems: [
      { name: "明太子雞翅", price: 220, source: "demo" },
      { name: "鹽烤牛舌", price: 320, source: "demo" },
      { name: "烤飯糰", price: 120, source: "demo" },
    ],
    review: "Demo 摘要：氣氛熱鬧，假日晚間較容易客滿。",
    hygiene: "正式版會以真實評論與可驗證來源重新分析。",
    contexts: ["朋友", "情侶", "慢慢聊天"],
    photoLabels: ["串燒吧台", "明太子雞翅", "夜間氛圍"],
  },
  {
    id: "r4",
    name: "春日和食堂",
    cuisine: "日式",
    rating: 4.3,
    reviewCount: 421,
    walk: 14,
    distance: 1080,
    priceMin: 260,
    priceMax: 480,
    address: "DEMO｜正式版由 Google Places 顯示實際地址",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=%E6%97%A5%E5%BC%8F%E5%AE%9A%E9%A3%9F",
    source: "demo",
    sourceLabel: "Demo 測試資料",
    lastVerified: "Preview data",
    weeklyHours: { ...ALL_DAYS, 3: [] },
    signature: ["海鮮丼", "唐揚雞", "茶碗蒸"],
    menuItems: [
      { name: "海鮮丼", price: 360, source: "demo" },
      { name: "唐揚雞定食", price: 300, source: "demo" },
      { name: "茶碗蒸", price: 80, source: "demo" },
    ],
    review: "Demo 摘要：餐點穩定，熱門品項晚間可能售罄。",
    hygiene: "正式版會以真實評論與可驗證來源重新分析。",
    contexts: ["一個人", "朋友", "家庭"],
    photoLabels: ["海鮮丼", "定食組合", "吧台座位"],
  },
  {
    id: "r5",
    name: "暖暖石頭火鍋",
    cuisine: "火鍋",
    rating: 4.2,
    reviewCount: 899,
    walk: 15,
    distance: 1180,
    priceMin: 380,
    priceMax: 680,
    address: "DEMO｜正式版由 Google Places 顯示實際地址",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=%E7%81%AB%E9%8D%8B",
    source: "demo",
    sourceLabel: "Demo 測試資料",
    lastVerified: "Preview data",
    weeklyHours: {
      0: [["11:30", "23:00"]],
      1: [["11:30", "23:00"]],
      2: [["11:30", "23:00"]],
      3: [["11:30", "23:00"]],
      4: [["11:30", "23:00"]],
      5: [["11:30", "23:30"]],
      6: [["11:30", "23:30"]],
    },
    signature: ["爆香石頭鍋", "梅花豬", "手工餃類"],
    menuItems: [
      { name: "梅花豬鍋", price: 420, source: "demo" },
      { name: "霜降牛鍋", price: 520, source: "demo" },
      { name: "手工餃拼盤", price: 160, source: "demo" },
    ],
    review: "Demo 摘要：香氣足、適合聚餐，尖峰時段環境較熱鬧。",
    hygiene: "正式版會以真實評論與可驗證來源重新分析。",
    contexts: ["朋友", "家庭", "慢慢聊天"],
    photoLabels: ["石頭火鍋", "肉盤", "多人聚餐"],
  },
  {
    id: "r6",
    name: "港邊漢堡室",
    cuisine: "美式",
    rating: 4.1,
    reviewCount: 254,
    walk: 8,
    distance: 620,
    priceMin: 220,
    priceMax: 420,
    address: "DEMO｜正式版由 Google Places 顯示實際地址",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=%E6%BC%A2%E5%A0%A1",
    source: "demo",
    sourceLabel: "Demo 測試資料",
    lastVerified: "Preview data",
    weeklyHours: {
      0: [["10:30", "18:00"]],
      1: [["10:30", "18:00"]],
      2: [["10:30", "18:00"]],
      3: [["10:30", "18:00"]],
      4: [["10:30", "18:00"]],
      5: [["10:30", "19:00"]],
      6: [["10:30", "19:00"]],
    },
    signature: ["培根牛肉堡", "薯條", "奶昔"],
    menuItems: [
      { name: "培根牛肉堡", price: 280, source: "demo" },
      { name: "脆薯", price: 100, source: "demo" },
      { name: "香草奶昔", price: 140, source: "demo" },
    ],
    review: "Demo 摘要：份量大，適合快速吃或朋友聚餐。",
    hygiene: "正式版會以真實評論與可驗證來源重新分析。",
    contexts: ["一個人", "朋友", "快速吃"],
    photoLabels: ["牛肉漢堡", "套餐", "美式店面"],
  },
  {
    id: "r7",
    name: "慢慢咖哩",
    cuisine: "咖哩",
    rating: 4.7,
    reviewCount: 932,
    walk: 7,
    distance: 510,
    priceMin: 180,
    priceMax: 320,
    address: "DEMO｜正式版由 Google Places 顯示實際地址",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=%E5%92%96%E5%93%A9",
    source: "demo",
    sourceLabel: "Demo 測試資料",
    lastVerified: "Preview data",
    weeklyHours: { ...ALL_DAYS, 2: [] },
    signature: ["熟成牛肉咖哩", "炸雞咖哩", "布丁"],
    menuItems: [
      { name: "熟成牛肉咖哩", price: 260, source: "demo" },
      { name: "炸雞咖哩", price: 240, source: "demo" },
      { name: "焦糖布丁", price: 90, source: "demo" },
    ],
    review: "Demo 摘要：評分高、座位不多，尖峰時段建議提早到。",
    hygiene: "正式版會以真實評論與可驗證來源重新分析。",
    contexts: ["一個人", "情侶", "快速吃"],
    photoLabels: ["熟成咖哩", "炸雞咖哩", "焦糖布丁"],
  },
  {
    id: "r8",
    name: "小島冰室",
    cuisine: "咖啡甜點",
    rating: 4.4,
    reviewCount: 718,
    walk: 5,
    distance: 350,
    priceMin: 120,
    priceMax: 260,
    address: "DEMO｜正式版由 Google Places 顯示實際地址",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=%E7%94%9C%E9%BB%9E",
    source: "demo",
    sourceLabel: "Demo 測試資料",
    lastVerified: "Preview data",
    weeklyHours: {
      0: [["12:00", "22:30"]],
      1: [["12:00", "22:30"]],
      2: [["12:00", "22:30"]],
      3: [["12:00", "22:30"]],
      4: [["12:00", "22:30"]],
      5: [["12:00", "23:00"]],
      6: [["12:00", "23:00"]],
    },
    signature: ["芒果冰", "焦糖布丁", "奶茶"],
    menuItems: [
      { name: "芒果冰", price: 220, source: "demo" },
      { name: "焦糖布丁", price: 90, source: "demo" },
      { name: "鮮奶茶", price: 110, source: "demo" },
    ],
    review: "Demo 摘要：適合飯後續攤，甜度偏高。",
    hygiene: "正式版會以真實評論與可驗證來源重新分析。",
    contexts: ["朋友", "情侶", "慢慢聊天"],
    photoLabels: ["芒果冰", "焦糖布丁", "午後甜點"],
  },
];

function minutesOf(text: string) {
  const [hour, minute] = text.split(":").map(Number);
  return hour * 60 + minute;
}

export function restaurantOpenState(restaurant: Restaurant, now = new Date()) {
  if (typeof restaurant.openNow === "boolean") {
    return { open: restaurant.openNow, label: restaurant.openNow ? "營業中" : "目前休息" };
  }
  if (!Object.keys(restaurant.weeklyHours).length) {
    return { open: true, label: "營業狀態請見 Google Maps", unknown: true };
  }
  const day = now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const minute = now.getHours() * 60 + now.getMinutes();
  const intervals = restaurant.weeklyHours[day] ?? [];

  for (const [startText, endText] of intervals) {
    const start = minutesOf(startText);
    const end = minutesOf(endText);
    if (end > start && minute >= start && minute < end) {
      return { open: true, label: `營業中 · ${endText} 打烊` };
    }
    if (end <= start && (minute >= start || minute < end)) {
      return { open: true, label: `營業中 · ${endText} 打烊` };
    }
  }

  const prevDay = ((day + 6) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  for (const [startText, endText] of restaurant.weeklyHours[prevDay] ?? []) {
    const start = minutesOf(startText);
    const end = minutesOf(endText);
    if (end <= start && minute < end) {
      return { open: true, label: `營業中 · ${endText} 打烊` };
    }
  }

  return { open: false, label: "目前休息" };
}

export function moneyText(min: number, max: number) {
  if (!min && !max) return "價格請見 Google Maps";
  return `NT$ ${min}–${max}`;
}

export function restaurantPriceText(restaurant: Restaurant) {
  return restaurant.priceLevelLabel || moneyText(restaurant.priceMin, restaurant.priceMax);
}

export function priceBandMax(id: PriceBand) {
  return PRICE_BANDS.find((item) => item.id === id)?.max ?? 0;
}

export function normalizeStoredProfile(input: unknown): Profile {
  if (!input || typeof input !== "object") return DEFAULT_PROFILE;
  const raw = input as Record<string, unknown>;
  const oldTheme = typeof raw.theme === "string" ? raw.theme : "animal";
  const themeMap: Record<string, ThemeId> = {
    cute: "animal",
    clean: "minimal",
    izakaya: "foodie",
    future: "illustrated",
    auto: "animal",
    animal: "animal",
    minimal: "minimal",
    illustrated: "illustrated",
    foodie: "foodie",
  };

  const mascotMap: Record<string, MascotId> = {
    cat: "cat",
    dog: "dog",
    rabbit: "rabbit",
    bear: "fox",
    fox: "fox",
    none: "none",
  };

  return {
    ...DEFAULT_PROFILE,
    name: typeof raw.name === "string" ? raw.name : "",
    entryMode: ["google", "apple", "email", "guest"].includes(String(raw.entryMode))
      ? (raw.entryMode as EntryMode)
      : "guest",
    email: typeof raw.email === "string" ? raw.email : "",
    theme: themeMap[oldTheme] ?? "animal",
    mascot: mascotMap[String(raw.mascot)] ?? "cat",
    favoriteCuisines: Array.isArray(raw.favoriteCuisines)
      ? raw.favoriteCuisines.filter((x): x is string => typeof x === "string")
      : [],
    avoidances: Array.isArray(raw.avoidances)
      ? raw.avoidances.filter((x): x is string => typeof x === "string")
      : [],
    diningContexts: Array.isArray(raw.diningContexts)
      ? raw.diningContexts.filter((x): x is string => typeof x === "string")
      : [],
    priceBand: ["any", "budget", "standard", "treat"].includes(String(raw.priceBand))
      ? (raw.priceBand as PriceBand)
      : typeof raw.budget === "number" && raw.budget > 0
        ? raw.budget <= 200
          ? "budget"
          : raw.budget <= 500
            ? "standard"
            : "treat"
        : "any",
    walk: typeof raw.walk === "number" ? raw.walk : 15,
    surprise: typeof raw.surprise === "boolean" ? raw.surprise : true,
    excludedRestaurantIds: Array.isArray(raw.excludedRestaurantIds)
      ? raw.excludedRestaurantIds.filter((x): x is string => typeof x === "string")
      : [],
    onboardingCompleted:
      typeof raw.onboardingCompleted === "boolean"
        ? raw.onboardingCompleted
        : Boolean(raw.name || raw.theme),
  };
}
