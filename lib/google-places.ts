import type { Restaurant } from "./product";

type GoogleText = { text?: string };

export type GooglePlace = {
  id?: string;
  displayName?: GoogleText;
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  googleMapsUri?: string;
  primaryTypeDisplayName?: GoogleText;
  currentOpeningHours?: { openNow?: boolean };
};

const PRICE_LEVELS: Record<string, string> = {
  PRICE_LEVEL_FREE: "免費",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
};

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function googlePlaceToRestaurant(
  place: GooglePlace,
  origin?: { lat: number; lng: number },
): Restaurant | null {
  const id = place.id?.trim();
  const name = place.displayName?.text?.trim();
  if (!id || !name) return null;

  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  const distance = origin && typeof lat === "number" && typeof lng === "number"
    ? haversineMeters(origin.lat, origin.lng, lat, lng)
    : 0;
  const cuisine = place.primaryTypeDisplayName?.text?.trim() || "餐廳";

  return {
    id,
    name,
    cuisine,
    rating: typeof place.rating === "number" ? place.rating : 0,
    reviewCount: typeof place.userRatingCount === "number" ? place.userRatingCount : 0,
    walk: distance ? Math.max(1, Math.ceil(distance / 80)) : 0,
    distance,
    priceMin: 0,
    priceMax: 0,
    priceLevelLabel: place.priceLevel ? PRICE_LEVELS[place.priceLevel] || "價格請見 Google Maps" : "價格請見 Google Maps",
    openNow: typeof place.currentOpeningHours?.openNow === "boolean" ? place.currentOpeningHours.openNow : null,
    address: place.formattedAddress || "地址請見 Google Maps",
    googleMapsUrl: place.googleMapsUri,
    source: "google",
    sourceLabel: "Google Places",
    lastVerified: new Date().toISOString(),
    weeklyHours: {},
    signature: [],
    menuItems: [],
    review: "Google Places 即時基本資料；評論摘要尚未啟用。",
    hygiene: "尚無可核實的衛生資料。",
    contexts: [],
    photoLabels: [],
  };
}

