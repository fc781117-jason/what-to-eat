export type ThemeId = "animal" | "minimal" | "illustrated" | "foodie";
export type MascotId = "cat" | "dog" | "rabbit" | "bear" | "none";
export type EntryMode = "google" | "apple" | "email" | "guest";
export type PriceBand = "any" | "budget" | "standard" | "treat";
export type ViewId =
  | "home"
  | "roulette"
  | "nearby"
  | "compare"
  | "category"
  | "favorites"
  | "history"
  | "settings"
  | "detail";

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
  onboardingCompleted: boolean;
};

export type Restaurant = {
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
  contexts: string[];
};

export type HistoryEntry = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  cuisine: string;
  emoji: string;
  source: "roulette" | "nearby" | "compare" | "category";
  createdAt: string;
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
  onboardingCompleted: false,
};

export const THEME_OPTIONS = [
  {
    id: "animal" as const,
    code: "A",
    name: "可愛動物系",
    desc: "溫暖、可愛、療癒，有陪伴感",
    note: "角色會陪你一起找吃的",
  },
  {
    id: "minimal" as const,
    code: "B",
    name: "極簡清新系",
    desc: "乾淨、輕盈、質感，專注內容",
    note: "留白更多、資訊閱讀最快",
  },
  {
    id: "illustrated" as const,
    code: "C",
    name: "活潑插畫系",
    desc: "年輕、活潑、有趣，色彩豐富",
    note: "用插畫與小動態增加探索感",
  },
  {
    id: "foodie" as const,
    code: "D",
    name: "美食質感系",
    desc: "精緻、美食、質感，沉浸體驗",
    note: "讓食物與餐廳內容成為主角",
  },
];

export const MASCOTS = [
  { id: "cat" as const, icon: "🐱", label: "貓貓" },
  { id: "dog" as const, icon: "🐶", label: "狗狗" },
  { id: "rabbit" as const, icon: "🐰", label: "兔兔" },
  { id: "bear" as const, icon: "🐻", label: "熊熊" },
  { id: "none" as const, icon: "✨", label: "不要動物" },
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

export const DEMO_RESTAURANTS: Restaurant[] = [
  {
    id: "r1",
    name: "老張牛肉麵",
    cuisine: "台式",
    rating: 4.6,
    walk: 6,
    distance: 450,
    priceMin: 120,
    priceMax: 220,
    open: true,
    close: "21:00",
    emoji: "🍜",
    signature: ["紅燒牛肉麵", "滷味拼盤", "酸菜小菜"],
    review: "湯頭與牛肉穩定，尖峰時段可能需要稍候。",
    hygiene: "可取得評論中未見重複衛生疑慮。",
    contexts: ["一個人", "快速吃", "朋友"],
  },
  {
    id: "r2",
    name: "山海小館",
    cuisine: "台式",
    rating: 4.4,
    walk: 10,
    distance: 760,
    priceMin: 280,
    priceMax: 520,
    open: true,
    close: "22:00",
    emoji: "🍚",
    signature: ["三杯雞", "金沙豆腐", "蛤蜊湯"],
    review: "份量充足，適合兩人以上分享。",
    hygiene: "近期評論多為環境整潔正向回饋。",
    contexts: ["朋友", "家庭", "慢慢聊天"],
  },
  {
    id: "r3",
    name: "夜町串燒",
    cuisine: "日式",
    rating: 4.5,
    walk: 12,
    distance: 920,
    priceMin: 650,
    priceMax: 1100,
    open: true,
    close: "01:00",
    emoji: "🍢",
    signature: ["明太子雞翅", "鹽烤牛舌", "烤飯糰"],
    review: "氣氛熱鬧，假日晚間較容易客滿。",
    hygiene: "未見明顯重複衛生警訊。",
    contexts: ["朋友", "情侶", "慢慢聊天"],
  },
  {
    id: "r4",
    name: "春日和食堂",
    cuisine: "日式",
    rating: 4.3,
    walk: 14,
    distance: 1080,
    priceMin: 260,
    priceMax: 480,
    open: true,
    close: "20:30",
    emoji: "🍣",
    signature: ["海鮮丼", "唐揚雞", "茶碗蒸"],
    review: "餐點穩定，熱門品項晚間可能售罄。",
    hygiene: "可取得評論中未見重大衛生議題。",
    contexts: ["一個人", "朋友", "家庭"],
  },
  {
    id: "r5",
    name: "暖暖石頭火鍋",
    cuisine: "火鍋",
    rating: 4.2,
    walk: 15,
    distance: 1180,
    priceMin: 380,
    priceMax: 680,
    open: true,
    close: "23:30",
    emoji: "🍲",
    signature: ["爆香石頭鍋", "梅花豬", "手工餃類"],
    review: "香氣足、適合聚餐；尖峰時段環境較熱鬧。",
    hygiene: "近期評論以桌面清潔正常為主。",
    contexts: ["朋友", "家庭", "慢慢聊天"],
  },
  {
    id: "r6",
    name: "港邊漢堡室",
    cuisine: "美式",
    rating: 4.1,
    walk: 8,
    distance: 620,
    priceMin: 220,
    priceMax: 420,
    open: false,
    close: "18:00",
    emoji: "🍔",
    signature: ["培根牛肉堡", "薯條", "奶昔"],
    review: "份量大，但今日已結束營業。",
    hygiene: "無足夠近期評論可判斷。",
    contexts: ["一個人", "朋友", "快速吃"],
  },
  {
    id: "r7",
    name: "慢慢咖哩",
    cuisine: "咖哩",
    rating: 4.7,
    walk: 7,
    distance: 510,
    priceMin: 180,
    priceMax: 320,
    open: true,
    close: "20:00",
    emoji: "🍛",
    signature: ["熟成牛肉咖哩", "炸雞咖哩", "布丁"],
    review: "評分高、座位不多，尖峰時段建議提早到。",
    hygiene: "近期可取得評論多為整潔正向訊號。",
    contexts: ["一個人", "情侶", "快速吃"],
  },
  {
    id: "r8",
    name: "小島冰室",
    cuisine: "咖啡甜點",
    rating: 4.4,
    walk: 5,
    distance: 350,
    priceMin: 120,
    priceMax: 260,
    open: true,
    close: "22:30",
    emoji: "🍧",
    signature: ["芒果冰", "焦糖布丁", "奶茶"],
    review: "適合飯後續攤，甜度偏高。",
    hygiene: "未見重複衛生負評。",
    contexts: ["朋友", "情侶", "慢慢聊天"],
  },
];

export function moneyText(min: number, max: number) {
  return `NT$ ${min}–${max}`;
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
  const mascot = ["cat", "dog", "rabbit", "bear", "none"].includes(String(raw.mascot))
    ? (raw.mascot as MascotId)
    : "cat";

  return {
    ...DEFAULT_PROFILE,
    name: typeof raw.name === "string" ? raw.name : "",
    entryMode: ["google", "apple", "email", "guest"].includes(String(raw.entryMode))
      ? (raw.entryMode as EntryMode)
      : "guest",
    email: typeof raw.email === "string" ? raw.email : "",
    theme: themeMap[oldTheme] ?? "animal",
    mascot,
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
    onboardingCompleted:
      typeof raw.onboardingCompleted === "boolean"
        ? raw.onboardingCompleted
        : Boolean(raw.name || raw.theme),
  };
}
