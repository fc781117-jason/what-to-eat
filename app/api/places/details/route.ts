import { NextRequest, NextResponse } from "next/server";
import { googlePlaceToRestaurant, placeDetailsFieldMask, type GooglePlace } from "../../../../lib/google-places";

export const dynamic = "force-dynamic";
const attempts = new Map<string, { count: number; resetAt: number }>();

function placesJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const now = Date.now();
  const existing = attempts.get(client);
  if (!existing || existing.resetAt <= now) attempts.set(client, { count: 1, resetAt: now + 60_000 });
  else if (++existing.count > 30) {
    return placesJson({ code: "RATE_LIMITED", message: "查詢次數過多，請稍後再試。" }, 429);
  }

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (process.env.GOOGLE_PLACES_LIVE_ENABLED !== "true" || !key) {
    return placesJson({ code: "PLACES_NOT_CONFIGURED", message: "真實 Google Places 尚未啟用。" }, 503);
  }

  const id = request.nextUrl.searchParams.get("id") || "";
  if (!/^[A-Za-z0-9_-]{8,200}$/.test(id)) {
    return placesJson({ code: "INVALID_PLACE_ID", message: "Google Place ID 格式無效。" }, 400);
  }

  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": placeDetailsFieldMask(process.env.GOOGLE_PLACES_FIELD_TIER === "enterprise"),
      },
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Google Place Details request failed", response.status);
      return placesJson({ code: "PLACES_UPSTREAM_ERROR", message: "無法取得這家餐廳的 Google 資料。" }, 502);
    }
    const place = await response.json() as GooglePlace;
    const restaurant = googlePlaceToRestaurant(place);
    if (!restaurant) return placesJson({ code: "PLACE_NOT_FOUND", message: "無法核對這個 Place ID。" }, 404);
    return placesJson({ restaurant, source: "google", retrievedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Google Place Details network error", error);
    return placesJson({ code: "PLACES_NETWORK_ERROR", message: "無法連線到 Google Places。" }, 502);
  }
}
