import { NextRequest, NextResponse } from "next/server";
import { googlePlaceToRestaurant, placesFieldMask, placesWithinRadius, type GooglePlace } from "../../../../lib/google-places";

export const dynamic = "force-dynamic";

const attempts = new Map<string, { count: number; resetAt: number }>();

function limited(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 30;
}

function numberParam(value: string | null) {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: NextRequest) {
  if (limited(request)) {
    return NextResponse.json({ code: "RATE_LIMITED", message: "搜尋次數過多，請稍後再試。" }, { status: 429 });
  }

  const enabled = process.env.GOOGLE_PLACES_LIVE_ENABLED === "true";
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!enabled || !key) {
    return NextResponse.json({
      code: "PLACES_NOT_CONFIGURED",
      message: "真實 Google Places 尚未啟用。請先設定受限制的伺服器金鑰與用量上限。",
    }, { status: 503 });
  }

  const lat = numberParam(request.nextUrl.searchParams.get("lat"));
  const lng = numberParam(request.nextUrl.searchParams.get("lng"));
  const rawRadius = numberParam(request.nextUrl.searchParams.get("radius")) ?? 2000;
  const radius = Math.min(5000, Math.max(250, rawRadius));
  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 120) || "";

  const hasCoordinates = lat !== null && lng !== null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  if ((request.nextUrl.searchParams.has("lat") || request.nextUrl.searchParams.has("lng")) && !hasCoordinates) {
    return NextResponse.json({ code: "INVALID_LOCATION", message: "位置座標無效，請重新定位。" }, { status: 400 });
  }
  if (!hasCoordinates && !query) {
    return NextResponse.json({ code: "LOCATION_REQUIRED", message: "請先取得有效位置，或輸入地區與搜尋內容。" }, { status: 400 });
  }

  const enterprise = process.env.GOOGLE_PLACES_FIELD_TIER === "enterprise";
  const fieldMask = placesFieldMask(enterprise);

  const isTextSearch = Boolean(query);
  const endpoint = isTextSearch
    ? "https://places.googleapis.com/v1/places:searchText"
    : "https://places.googleapis.com/v1/places:searchNearby";
  const body = isTextSearch
    ? {
        textQuery: query,
        languageCode: "zh-TW",
        regionCode: "TW",
        maxResultCount: 12,
        ...(hasCoordinates ? { locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius } } } : {}),
      }
    : {
        includedTypes: ["restaurant", "cafe", "bakery", "meal_takeaway"],
        maxResultCount: 15,
        rankPreference: "DISTANCE",
        languageCode: "zh-TW",
        regionCode: "TW",
        locationRestriction: { circle: { center: { latitude: lat!, longitude: lng! }, radius } },
      };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Google Places request failed", response.status, detail.slice(0, 500));
      return NextResponse.json({ code: "PLACES_UPSTREAM_ERROR", message: "Google Places 暫時無法完成搜尋。" }, { status: 502 });
    }

    const data = await response.json() as { places?: GooglePlace[] };
    // Text Search locationBias is a preference, so enforce the chosen radius here.
    const scopedPlaces = hasCoordinates
      ? placesWithinRadius(data.places || [], { lat: lat!, lng: lng! }, radius)
      : data.places || [];
    const restaurants = scopedPlaces
      .map((place) => googlePlaceToRestaurant(place, hasCoordinates ? { lat: lat!, lng: lng! } : undefined))
      .filter(Boolean);
    return NextResponse.json({ restaurants, source: "google", retrievedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Google Places network error", error);
    return NextResponse.json({ code: "PLACES_NETWORK_ERROR", message: "無法連線到 Google Places。" }, { status: 502 });
  }
}
