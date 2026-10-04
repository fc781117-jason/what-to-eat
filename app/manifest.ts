import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return {
    name: "今天吃什麼？",
    short_name: "今天吃什麼",
    description: "記住你的口味，用附近探索、隨機選餐、比較與收藏，讓每天決定吃什麼更簡單。",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    background_color: "#fff8f0",
    theme_color: "#ef746b",
    orientation: "portrait",
    icons: [{ src: `${base}/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
