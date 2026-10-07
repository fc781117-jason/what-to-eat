import { NextRequest, NextResponse } from "next/server";
import { googlePlaceToRestaurant, placeDetailsFieldMask, type GooglePlace } from "../../../../lib/google-places";

export const dynamic = "force-dynamic";
const attempts = new Map<string, { count: number; resetAt: number }>();

export async function GET(request: NextRequest) {
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const now = Date.now();
  const existing = attempts.get(client);
  if (!existing || existing.resetAt <= now) attempts.set(client, { count: 1, resetAt: now + 60_000 });
  else if (++existing.count > 30) {
    return NextResponse.json({ code: "RATE_LIMITED", message: "查詢次數過多，請稍後再試。" }, { status: 429 });
  }

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (process.env.GOOGLE_PLACES_LIVE_ENABLED !== "true" || !key) {
    return NextResponse.json({ code: "PLACES_NOT_CONFIGURED", message: "真實 Google Places 尚未啟用。" }, { status: 503 });
  }

  const id = request.nextUrl.searchParams.get("id") || "";
  if (!/^[A-Za-z0-9_-]{8,200}$/.test(id)) {
    return NextResponse.json({ code: "INVALID_PLACE_ID", message: "Google Place ID 格式無效。" }, { status: 400 });
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
      return NextResponse.json({ code: "PLACES_UPSTREAM_ERROR", message: "無法取得這家餐廳的 Google 資料。" }, { status: 502 });
    }
    const place = await response.json() as GooglePlace;
    const restaurant = googlePlaceToRestaurant(place);
    if (!restaurant) return NextResponse.json({ code: "PLACE_NOT_FOUND", message: "無法核對這個 Place ID。" }, { status: 404 });
    return NextResponse.json({ restaurant, source: "google", retrievedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Google Place Details network error", error);
    return NextResponse.json({ code: "PLACES_NETWORK_ERROR", message: "無法連線到 Google Places。" }, { status: 502 });
  }
}
