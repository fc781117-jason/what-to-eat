export type ResolvedLocation = {
  lat: number;
  lng: number;
  accuracy: number;
  label: string;
  source: "google" | "openstreetmap" | "gps";
};

async function reverseWithGoogle(lat: number, lng: number, key: string) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=zh-TW&key=${encodeURIComponent(key)}`,
  );
  if (!response.ok) throw new Error("Google reverse geocoding failed");
  const data = await response.json();
  const first = data?.results?.[0]?.formatted_address;
  return typeof first === "string" ? first.replace(/^台灣/, "") : null;
}

async function reverseWithOsm(lat: number, lng: number) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=zh-TW`,
    { headers: { Accept: "application/json" } },
  );
  if (!response.ok) throw new Error("OSM reverse geocoding failed");
  const data = await response.json();
  return typeof data?.display_name === "string" ? data.display_name : null;
}

export async function resolveBrowserLocation(): Promise<ResolvedLocation> {
  if (!navigator.geolocation) throw new Error("此裝置不支援定位");

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000,
    });
  });

  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const accuracy = Math.round(position.coords.accuracy);
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (googleKey) {
    try {
      const label = await reverseWithGoogle(lat, lng, googleKey);
      if (label) return { lat, lng, accuracy, label, source: "google" };
    } catch {}
  }

  try {
    const label = await reverseWithOsm(lat, lng);
    if (label) return { lat, lng, accuracy, label, source: "openstreetmap" };
  } catch {}

  return {
    lat,
    lng,
    accuracy,
    label: `GPS ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    source: "gps",
  };
}
