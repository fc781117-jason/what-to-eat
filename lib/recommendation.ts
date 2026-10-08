import type { Profile, Restaurant } from "./product";

export type RecommendationReason = {
  score: number;
  reasons: string[];
};

const CONTEXT_ALIASES: Array<{ terms: string[]; contexts: string[] }> = [
  { terms: ["約會", "情侶"], contexts: ["情侶"] },
  { terms: ["一個人", "獨食", "自己吃"], contexts: ["一個人"] },
  { terms: ["朋友", "聚餐"], contexts: ["朋友", "家庭"] },
  { terms: ["家庭", "親子"], contexts: ["家庭"] },
  { terms: ["快速", "趕時間"], contexts: ["快速吃"] },
  { terms: ["聊天", "坐久一點"], contexts: ["慢慢聊天"] },
];

function supportsLateNight(restaurant: Restaurant) {
  return Object.values(restaurant.weeklyHours).some((periods) => periods?.some(([, close]) => {
    const [hour] = close.split(":").map(Number);
    return hour >= 23 || hour <= 3;
  }));
}

/** Matches explicit Demo fields and simple user intent without inventing venue attributes. */
export function matchesRestaurantSearch(restaurant: Restaurant, rawQuery: string) {
  let query = rawQuery.trim().toLowerCase();
  if (!query) return true;

  const budgetMatch = query.match(/(?:每人)?\s*(\d{2,5})\s*(?:元|塊)?\s*(?:以?內|以下|內)/);
  if (budgetMatch) {
    if (!restaurant.priceMin) return false;
    if (restaurant.priceMin > Number(budgetMatch[1])) return false;
    query = query.replace(budgetMatch[0], " ");
  }

  const wantsLateNight = query.includes("宵夜") || query.includes("深夜");
  if (wantsLateNight) {
    if (!supportsLateNight(restaurant)) return false;
    query = query.replaceAll("宵夜", " ").replaceAll("深夜", " ");
  }

  for (const alias of CONTEXT_ALIASES) {
    const usedTerms = alias.terms.filter((term) => query.includes(term));
    if (!usedTerms.length) continue;
    if (!alias.contexts.some((context) => restaurant.contexts.includes(context))) return false;
    usedTerms.forEach((term) => { query = query.replaceAll(term, " "); });
  }

  const terms = query.split(/[\s,，、/]+/).filter(Boolean);
  const haystack = [
    restaurant.name,
    restaurant.cuisine,
    ...restaurant.signature,
    ...restaurant.menuItems.map((item) => item.name),
    ...restaurant.contexts,
  ].join(" ").toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export function scoreRestaurant(restaurant: Restaurant, profile: Profile): RecommendationReason {
  let score = restaurant.rating * 10;
  const reasons: string[] = [];

  if (profile.favoriteCuisines.includes(restaurant.cuisine)) {
    score += 28;
    reasons.push(`你喜歡 ${restaurant.cuisine}`);
  }

  const contextMatches = restaurant.contexts.filter((context) =>
    profile.diningContexts.includes(context),
  );
  if (contextMatches.length) {
    score += contextMatches.length * 9;
    reasons.push(`適合${contextMatches.slice(0, 2).join("、")}`);
  }

  if (profile.walk > 0 && restaurant.walk > 0) {
    const walkFit = Math.max(0, profile.walk - restaurant.walk);
    score += Math.min(walkFit, 10) * 1.2;
    if (restaurant.walk <= Math.min(profile.walk, 8)) reasons.push("走路很近");
  }

  if (restaurant.rating >= 4.5) {
    score += 7;
    reasons.push("評分較高");
  }

  if (profile.surprise && !profile.favoriteCuisines.includes(restaurant.cuisine)) {
    score += 3;
  }

  return { score: Math.max(1, score), reasons };
}

export function rankRestaurants(restaurants: Restaurant[], profile: Profile) {
  return [...restaurants].sort(
    (a, b) => scoreRestaurant(b, profile).score - scoreRestaurant(a, profile).score,
  );
}

export function weightedPick(restaurants: Restaurant[], profile: Profile) {
  if (!restaurants.length) return null;

  const weighted = restaurants.map((restaurant) => ({
    restaurant,
    weight: scoreRestaurant(restaurant, profile).score,
  }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * total;

  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) return item.restaurant;
  }

  return weighted[weighted.length - 1].restaurant;
}

export function recommendationHint(restaurant: Restaurant, profile: Profile) {
  const { reasons } = scoreRestaurant(restaurant, profile);
  return reasons.length ? reasons.slice(0, 2).join(" · ") : "已列入候選；請查看店家資料";
}
