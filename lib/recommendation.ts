import { Profile, Restaurant } from "./product";

export type RecommendationReason = {
  score: number;
  reasons: string[];
};

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

  if (profile.walk > 0) {
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
  return reasons.length ? reasons.slice(0, 2).join(" · ") : "符合目前條件";
}
