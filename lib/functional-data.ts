import type { DataSourceKind, Dish, MenuItem, Restaurant } from "./product";

export type EvidenceKind = "fact" | "preference" | "inference";
export type Evidence = { kind: EvidenceKind; text: string; source: DataSourceKind; asOf?: string };

export type RestaurantDetail = {
  id: string;
  identity: {
    name: string; cuisine?: string; photos: Array<{ url: string; source: DataSourceKind; attribution?: string }>;
    rating?: number; reviewCount?: number; open?: boolean; nextTransition?: string;
    walkingMinutes?: number; distanceMeters?: number; perPersonPrice?: [number, number];
    address?: string; phone?: string; mapsUrl?: string; websiteUrl?: string;
    menuUrl?: string; reservationUrl?: string; source: DataSourceKind; asOf?: string;
  };
  decision: {
    matchScore?: number; evidence: Evidence[]; strengths: Evidence[]; drawbacks: Evidence[];
    reviewSummary?: Evidence; recurringComplaints: Evidence[]; hygieneSignal?: Evidence;
    contexts: string[];
  };
  dishes: Dish[];
};

export type CompareCandidate = {
  detail: RestaurantDetail;
  selected: boolean;
  bestFor: string[];
};

export type PlaceQuery = { lat: number; lng: number; radiusMeters: number; cuisine?: string; openNow?: boolean };
export type DataResult<T> = { data: T; source: DataSourceKind; fetchedAt: string };

/** The live implementation is server-side only and must not be instantiated before the cost gate. */
export interface RestaurantDataAdapter {
  nearby(query: PlaceQuery): Promise<DataResult<RestaurantDetail[]>>;
  detail(placeId: string): Promise<DataResult<RestaurantDetail>>;
  walking(origin: { lat: number; lng: number }, placeId: string): Promise<DataResult<{ minutes: number; meters: number }>>;
  resolveMapUrl(input: string): Promise<DataResult<{ placeId: string }>>;
}

export function dishFromMenu(restaurant: Restaurant, item: MenuItem, index: number): Dish {
  // A price is valid only when its provenance can be shown alongside it.
  const price = item.source === "official" || item.source === "booking" || item.source === "user" || item.source === "demo"
    ? item.price : undefined;
  return {
    dishId: `${restaurant.id}:dish:${index}`,
    restaurantId: restaurant.id,
    name: item.name,
    category: restaurant.cuisine,
    price,
    source: item.source,
    sourceFreshness: restaurant.lastVerified,
    likes: 0,
    dislikes: 0,
    selectionCount: 0,
    recommendationEvidence: ["餐廳提供的品項；實際供應與價格請再確認"],
  };
}

export function dishesFor(restaurant: Restaurant): Dish[] {
  return restaurant.menuItems.map((item, index) => dishFromMenu(restaurant, item, index));
}

/** Parse only unambiguous IDs. Short links require a guarded server resolver; never guess a restaurant. */
export function parseGoogleMapsInput(raw: string): { kind: "placeId" | "search" | "shortLink" | "unsupported"; value: string } {
  const value = raw.trim();
  if (!value) return { kind: "unsupported", value };
  if (!/^https?:\/\//i.test(value)) return { kind: "search", value };
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (host === "maps.app.goo.gl" || host === "goo.gl") return { kind: "shortLink", value };
    if (!["google.com", "www.google.com", "maps.google.com", "google.com.tw", "www.google.com.tw"].includes(host))
      return { kind: "unsupported", value };
    const placeId = url.searchParams.get("query_place_id") || url.searchParams.get("place_id");
    if (placeId && /^[\w-]{8,200}$/.test(placeId)) return { kind: "placeId", value: placeId };
    const query = url.searchParams.get("query") || url.searchParams.get("q");
    if (query && !/^-?\d+\.\d+,-?\d+\.\d+$/.test(query)) return { kind: "search", value: query };
    const match = url.pathname.match(/\/place\/([^/]+)/i);
    if (match) return { kind: "search", value: decodeURIComponent(match[1]).replace(/\+/g, " ") };
    return { kind: "unsupported", value };
  } catch { return { kind: "unsupported", value }; }
}
